import type { PlatformAdapter, PositionRow } from "../types";
import { safeFloat, assertOk } from "../validate";

// ── Ankr Multi-Chain JSON-RPC (primary) ──
const ANKR_RPC = "https://rpc.ankr.com/multichain";

// ── Moralis REST API (fallback) ──
const MORALIS_API = "https://deep-index.moralis.io/api/v2.2/wallets";

// EVM chains supported by MetaMask
const ANKR_CHAINS = [
  "eth", "arbitrum", "polygon", "optimism", "base", "avalanche", "bsc",
] as const;

// Moralis chain identifiers (mapped from Ankr names)
const MORALIS_CHAINS: Record<string, string> = {
  eth: "eth",
  arbitrum: "arbitrum",
  polygon: "polygon",
  optimism: "optimism",
  base: "base",
  avalanche: "avalanche",
  bsc: "bsc",
};

const CHAIN_LABELS: Record<string, string> = {
  eth: "Ethereum",
  arbitrum: "Arbitrum",
  polygon: "Polygon",
  optimism: "Optimism",
  base: "Base",
  avalanche: "Avalanche",
  bsc: "BSC",
};

// ── Safe number coercion (Ankr returns most numbers as strings) ──

function toNum(v: unknown): number {
  if (v == null) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ── Aggregation helper ──

interface TokenBucket {
  symbol: string;
  name: string;
  totalBalance: number;
  totalUsd: number;
  chains: string[];
  price: number;
}

function aggregateToken(
  map: Map<string, TokenBucket>,
  symbol: string,
  name: string,
  balance: number,
  usd: number,
  chain: string,
  price: number,
) {
  const key = symbol.toUpperCase();
  const existing = map.get(key);
  const label = CHAIN_LABELS[chain] ?? chain;

  if (existing) {
    existing.totalBalance += balance;
    existing.totalUsd += usd;
    if (!existing.chains.includes(label)) existing.chains.push(label);
    if (price > 0) existing.price = price; // keep latest non-zero price
  } else {
    map.set(key, { symbol, name, totalBalance: balance, totalUsd: usd, chains: [label], price });
  }
}

function bucketsToPositions(map: Map<string, TokenBucket>): PositionRow[] {
  const positions: PositionRow[] = [];
  for (const [, t] of map) {
    if (t.totalUsd < 0.01) continue; // skip dust
    positions.push({
      asset: t.symbol,
      size: t.totalBalance,
      cost_basis: 0,
      current_value: t.totalUsd,
      notes: `${t.name} | $${t.price.toFixed(2)}/unit | ${t.chains.join(", ")}`,
    });
  }
  positions.sort((a, b) => b.current_value - a.current_value);
  return positions;
}

// ── Ankr fetch ──
// Docs: all numeric fields (balance, balanceUsd, tokenPrice, totalBalanceUsd)
// are returned as STRINGS. Only tokenDecimals is a true number.

interface AnkrAsset {
  blockchain: string;
  tokenName: string;
  tokenSymbol: string;
  tokenType: string;
  tokenDecimals: number;
  contractAddress?: string;
  holderAddress?: string;
  balance: string;
  balanceRawInteger: string;
  balanceUsd: string;
  tokenPrice: string;
  thumbnail?: string;
}

interface AnkrResult {
  assets?: AnkrAsset[];
  totalBalanceUsd?: string;
  nextPageToken?: string;
}

interface AnkrResponse {
  jsonrpc: string;
  id: number;
  result?: AnkrResult;
  error?: { code: number; message: string };
}

async function fetchAnkr(wallet: string, signal?: AbortSignal): Promise<PositionRow[]> {
  const apiKey = process.env.ANKR_API_KEY;
  if (!apiKey) throw new Error("ANKR_API_KEY not configured");
  const url = `${ANKR_RPC}/${apiKey}`;

  const allAssets: AnkrAsset[] = [];
  let pageToken: string | undefined;

  // Paginated fetch — Ankr may split large wallets across pages
  do {
    const params: Record<string, unknown> = {
      walletAddress: wallet,
      blockchain: [...ANKR_CHAINS],
      onlyWhitelisted: true,
    };
    if (pageToken) params.pageToken = pageToken;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", method: "ankr_getAccountBalance", params, id: 1 }),
      signal,
    });

    assertOk(res, "Ankr multichain balance");
    const data: AnkrResponse = await res.json();

    if (data.error) {
      throw new Error(`Ankr API: ${data.error.message} (code ${data.error.code})`);
    }

    if (data.result?.assets) {
      allAssets.push(...data.result.assets);
    }

    pageToken = data.result?.nextPageToken || undefined;
  } while (pageToken);

  if (allAssets.length === 0) return [];

  const map = new Map<string, TokenBucket>();
  for (const a of allAssets) {
    const balance = safeFloat(a.balance);
    const usd = toNum(a.balanceUsd);
    const price = toNum(a.tokenPrice);
    if (balance == null || balance === 0) continue;
    if (usd < 0.01) continue;
    aggregateToken(map, a.tokenSymbol, a.tokenName, balance, usd, a.blockchain, price);
  }

  return bucketsToPositions(map);
}

// ── Moralis fetch (fallback) ──

interface MoralisToken {
  symbol: string;
  name: string;
  balance_formatted: string;
  usd_value: number | null;
  usd_price: number | null;
}

async function fetchMoralis(wallet: string, signal?: AbortSignal): Promise<PositionRow[]> {
  const apiKey = process.env.MORALIS_API_KEY;
  if (!apiKey) throw new Error("MORALIS_API_KEY not configured (needed for fallback)");

  const map = new Map<string, TokenBucket>();

  for (const [ankrChain, moralisChain] of Object.entries(MORALIS_CHAINS)) {
    const reqUrl = `${MORALIS_API}/${wallet}/tokens?chain=${moralisChain}`;
    const res = await fetch(reqUrl, {
      headers: { accept: "application/json", "X-API-Key": apiKey },
      signal,
    });

    if (!res.ok) continue; // skip failed chains, try the rest

    const data: { result?: MoralisToken[] } = await res.json();
    if (!data.result) continue;

    for (const t of data.result) {
      const balance = safeFloat(t.balance_formatted);
      if (balance == null || balance === 0) continue;
      const usd = toNum(t.usd_value);
      if (usd < 0.01) continue;
      aggregateToken(map, t.symbol, t.name, balance, usd, ankrChain, toNum(t.usd_price));
    }
  }

  return bucketsToPositions(map);
}

// ── Adapter ──

export const DefiWalletAdapter: PlatformAdapter = {
  platformName: "DeFi Wallet",

  async fetchPositions(wallet: string, signal?: AbortSignal) {
    const warnings: string[] = [];

    // Primary: Ankr
    try {
      const positions = await fetchAnkr(wallet, signal);
      if (positions.length === 0) {
        warnings.push("Wallet may be empty — no token balances found");
      }
      return { positions, warnings };
    } catch (ankrErr) {
      warnings.push(`Ankr failed: ${ankrErr instanceof Error ? ankrErr.message : String(ankrErr)}`);
    }

    // Fallback: Moralis
    try {
      warnings.push("Falling back to Moralis API");
      const positions = await fetchMoralis(wallet, signal);
      return { positions, warnings };
    } catch (moralisErr) {
      warnings.push(`Moralis failed: ${moralisErr instanceof Error ? moralisErr.message : String(moralisErr)}`);
    }

    // Both failed
    return { positions: [], warnings };
  },
};
