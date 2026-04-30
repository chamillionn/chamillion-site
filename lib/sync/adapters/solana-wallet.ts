import type { PlatformAdapter, PositionRow } from "../types";
import { safeFloat } from "../validate";

// Solana RPCs. Helius free tier (HELIUS_API_KEY) is the most reliable —
// public endpoints throttle aggressively (429). Ankr Solana is a separate product
// from their EVM multichain plan, so ANKR_API_KEY is not guaranteed to work.
function solanaRpcUrls(): string[] {
  const urls: string[] = [];
  const heliusKey = process.env.HELIUS_API_KEY;
  if (heliusKey) urls.push(`https://mainnet.helius-rpc.com/?api-key=${heliusKey}`);
  const ankrKey = process.env.ANKR_API_KEY;
  if (ankrKey) urls.push(`https://rpc.ankr.com/solana/${ankrKey}`);
  urls.push(
    "https://solana-rpc.publicnode.com",
    "https://solana.drpc.org",
    "https://solana-mainnet.public.blastapi.io",
    "https://api.mainnet-beta.solana.com",
  );
  return urls;
}

// Jupiter APIs — keyless
const JUPITER_PRICE_API = "https://api.jup.ag/price/v3";
const JUPITER_TOKEN_API = "https://lite-api.jup.ag/tokens/v1/token";

// SPL Token programs — we need to scan both (many newer tokens are Token-2022)
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

// Wrapped-SOL mint — used as the Jupiter price source for native SOL
const WSOL_MINT = "So11111111111111111111111111111111111111112";

// Solana pubkey: base58, 32–44 chars
const SOLANA_PUBKEY_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

interface RpcResponse<T> {
  jsonrpc: string;
  id: number | string;
  result?: T;
  error?: { code: number; message: string };
}

interface ParsedTokenAccount {
  account: {
    data: {
      parsed: {
        info: {
          mint: string;
          tokenAmount: { amount: string; decimals: number; uiAmount: number | null; uiAmountString: string };
        };
      };
    };
  };
}

interface TokenAccountsResult {
  value: ParsedTokenAccount[];
}

interface JupiterTokenMeta {
  address: string;
  name?: string;
  symbol?: string;
}

type JupiterPriceMap = Record<string, { usdPrice?: number } | null>;

// Single RPC call with failover across providers. Sequential calls (Helius free
// tier rejects batch requests with 403), so callers invoke per-method.
async function rpcCall<T>(
  method: string,
  params: unknown[],
  warnings: string[],
  signal?: AbortSignal,
): Promise<T> {
  const body = { jsonrpc: "2.0", id: 1, method, params };
  const urls = solanaRpcUrls();
  let lastErr: unknown = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
        warnings.push(`Solana RPC ${new URL(url).host} ${method}: ${res.status}`);
        continue;
      }
      const data = (await res.json()) as RpcResponse<T>;
      if (data.error) {
        lastErr = new Error(data.error.message);
        warnings.push(`Solana RPC ${new URL(url).host} ${method}: ${data.error.message}`);
        continue;
      }
      if (data.result === undefined) {
        lastErr = new Error("empty result");
        continue;
      }
      return data.result;
    } catch (e) {
      lastErr = e;
      warnings.push(`Solana RPC ${new URL(url).host} ${method}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  throw new Error(`All Solana RPCs failed for ${method}: ${lastErr instanceof Error ? lastErr.message : String(lastErr)}`);
}

async function fetchPrices(mints: string[], signal?: AbortSignal): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (mints.length === 0) return prices;
  const CHUNK = 50;
  for (let i = 0; i < mints.length; i += CHUNK) {
    const ids = mints.slice(i, i + CHUNK).join(",");
    const res = await fetch(`${JUPITER_PRICE_API}?ids=${ids}`, { signal });
    if (!res.ok) continue;
    const data = (await res.json()) as JupiterPriceMap;
    for (const [mint, entry] of Object.entries(data)) {
      const p = entry?.usdPrice;
      if (typeof p === "number" && Number.isFinite(p) && p > 0) prices.set(mint, p);
    }
  }
  return prices;
}

async function fetchTokenMeta(mints: string[], signal?: AbortSignal): Promise<Map<string, JupiterTokenMeta>> {
  const meta = new Map<string, JupiterTokenMeta>();
  if (mints.length === 0) return meta;
  const results = await Promise.allSettled(
    mints.map(async (mint) => {
      const res = await fetch(`${JUPITER_TOKEN_API}/${mint}`, { signal });
      if (!res.ok) return null;
      return (await res.json()) as JupiterTokenMeta;
    }),
  );
  for (const r of results) {
    if (r.status === "fulfilled" && r.value?.address) meta.set(r.value.address, r.value);
  }
  return meta;
}

export const SolanaWalletAdapter: PlatformAdapter = {
  platformName: "Solana Wallet",

  async fetchPositions(wallet: string, signal?: AbortSignal) {
    const warnings: string[] = [];

    if (!SOLANA_PUBKEY_RE.test(wallet)) {
      warnings.push(`Wallet does not look like a Solana pubkey: ${wallet}`);
      return { positions: [], warnings };
    }

    // Sequential RPC calls (Helius free tier doesn't allow batch).
    const solRes = await rpcCall<{ value: number }>("getBalance", [wallet], warnings, signal);
    const splRes = await rpcCall<TokenAccountsResult>(
      "getTokenAccountsByOwner",
      [wallet, { programId: TOKEN_PROGRAM_ID }, { encoding: "jsonParsed" }],
      warnings,
      signal,
    );
    const spl22Res = await rpcCall<TokenAccountsResult>(
      "getTokenAccountsByOwner",
      [wallet, { programId: TOKEN_2022_PROGRAM_ID }, { encoding: "jsonParsed" }],
      warnings,
      signal,
    );

    const lamports = solRes.value ?? 0;
    const solBalance = lamports / 1e9;

    const tokenAccounts = [...(splRes.value ?? []), ...(spl22Res.value ?? [])];

    // 2. Aggregate by mint (a wallet may have multiple accounts for the same mint)
    const byMint = new Map<string, number>();
    for (const acc of tokenAccounts) {
      const info = acc.account.data.parsed.info;
      const amt = safeFloat(info.tokenAmount.uiAmountString);
      if (amt == null || amt === 0) continue;
      byMint.set(info.mint, (byMint.get(info.mint) ?? 0) + amt);
    }

    // 3. Fetch prices and metadata for all mints (+wSOL for native SOL price)
    const mintsForPrice = [WSOL_MINT, ...byMint.keys()];
    const mintsForMeta = [...byMint.keys()];

    const [prices, meta] = await Promise.all([
      fetchPrices(mintsForPrice, signal),
      fetchTokenMeta(mintsForMeta, signal),
    ]);

    const solPrice = prices.get(WSOL_MINT);
    const positions: PositionRow[] = [];

    // If we have balances but prices are completely empty it's a Jupiter outage —
    // throw so the engine skips deactivation instead of wiping positions.
    const hasMeaningfulBalance = solBalance > 0.001 || byMint.size > 0;
    if (hasMeaningfulBalance && prices.size === 0) {
      throw new Error("Jupiter price API returned no prices — skipping to preserve existing positions");
    }

    // Native SOL
    if (solBalance > 0) {
      if (solPrice == null) {
        warnings.push("SOL price unavailable from Jupiter — skipping native SOL");
      } else {
        const usd = solBalance * solPrice;
        if (usd >= 0.01) {
          positions.push({
            asset: "SOL (Solana)",
            size: solBalance,
            cost_basis: 0,
            current_value: usd,
            notes: `Solana | $${solPrice.toFixed(2)}/unit | Solana`,
          });
        }
      }
    }

    // SPL tokens
    for (const [mint, balance] of byMint) {
      const price = prices.get(mint);
      if (price == null) continue; // illiquid / no Jupiter route — skip
      const usd = balance * price;
      if (usd < 0.01) continue;

      const m = meta.get(mint);
      const symbol = (m?.symbol ?? "").trim() || `${mint.slice(0, 4)}…${mint.slice(-4)}`;
      const name = (m?.name ?? "").trim() || symbol;
      positions.push({
        asset: `${symbol} (Solana)`,
        size: balance,
        cost_basis: 0,
        current_value: usd,
        notes: `${name} | $${price.toFixed(2)}/unit | Solana`,
      });
    }

    positions.sort((a, b) => b.current_value - a.current_value);

    if (positions.length === 0) {
      warnings.push("Wallet may be empty — no priced balances found");
    }

    return { positions, warnings };
  },
};
