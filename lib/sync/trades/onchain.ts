import type { TradeFetcher, TradeRow } from "./types";
import { usdToEur } from "../forex";

const MORALIS_API = "https://deep-index.moralis.io/api/v2.2";

const CHAINS = ["eth", "arbitrum", "polygon", "optimism", "base"] as const;

// Tokens to ignore in swap detection (wrapping, not a real trade)
const WRAP_TOKENS = new Set(["WETH", "WMATIC", "WAVAX", "WBNB"]);

/**
 * Moralis ERC20 transfer record.
 * Endpoint: GET /{address}/erc20/transfers?chain={chain}&from_date={iso}
 */
interface MoralisTransfer {
  transaction_hash: string;
  log_index: string;
  from_address: string;
  to_address: string;
  value: string;          // raw integer (needs decimals division)
  token_decimals: number;
  token_symbol: string;
  token_name: string;
  value_decimal: string;  // human-readable float string
  block_timestamp: string;
  possible_spam: boolean;
}

interface SwapPair {
  out: MoralisTransfer;
  in: MoralisTransfer;
}

/**
 * Group ERC20 transfers by transaction hash.
 * Within each tx, identify OUT (from wallet) and IN (to wallet) transfers.
 * If both exist in the same tx, it's a swap.
 */
function detectSwaps(transfers: MoralisTransfer[], wallet: string): SwapPair[] {
  const walletLower = wallet.toLowerCase();
  const byTx = new Map<string, { outs: MoralisTransfer[]; ins: MoralisTransfer[] }>();

  for (const t of transfers) {
    if (t.possible_spam) continue;

    const txHash = t.transaction_hash;
    if (!byTx.has(txHash)) byTx.set(txHash, { outs: [], ins: [] });
    const group = byTx.get(txHash)!;

    if (t.from_address.toLowerCase() === walletLower) {
      group.outs.push(t);
    } else if (t.to_address.toLowerCase() === walletLower) {
      group.ins.push(t);
    }
  }

  const swaps: SwapPair[] = [];

  for (const [, group] of byTx) {
    if (group.outs.length === 0 || group.ins.length === 0) continue;

    // Take the largest out and largest in by value as the swap pair
    const out = group.outs.reduce((a, b) =>
      parseFloat(a.value_decimal) > parseFloat(b.value_decimal) ? a : b
    );
    const in_ = group.ins.reduce((a, b) =>
      parseFloat(a.value_decimal) > parseFloat(b.value_decimal) ? a : b
    );

    // Filter: skip pure wrapping (ETH→WETH)
    const isWrap =
      WRAP_TOKENS.has(out.token_symbol) && WRAP_TOKENS.has(in_.token_symbol);
    if (isWrap) continue;

    // Filter: skip if same token (shouldn't happen, but defensive)
    if (out.token_symbol === in_.token_symbol) continue;

    swaps.push({ out, in: in_ });
  }

  return swaps;
}

export const OnchainTradeFetcher: TradeFetcher = {
  platformName: "Wallet",

  async fetchTrades(wallet, platformId, since, eurUsdRate, signal) {
    const trades: TradeRow[] = [];
    const warnings: string[] = [];

    const apiKey = process.env.MORALIS_API_KEY;
    if (!apiKey) {
      warnings.push("MORALIS_API_KEY not configured, skipping on-chain trades");
      return { trades, warnings };
    }

    const fromDate = since ? since.toISOString() : undefined;

    for (const chain of CHAINS) {
      let cursor: string | undefined;

      do {
        const params = new URLSearchParams({
          chain,
          order: "DESC",
          limit: "100",
        });
        if (fromDate) params.set("from_date", fromDate);
        if (cursor) params.set("cursor", cursor);

        const url = `${MORALIS_API}/${wallet}/erc20/transfers?${params}`;

        let res: Response;
        try {
          res = await fetch(url, {
            headers: { accept: "application/json", "X-API-Key": apiKey },
            signal,
          });
        } catch (e) {
          warnings.push(`${chain}: fetch failed — ${e instanceof Error ? e.message : String(e)}`);
          break;
        }

        if (!res.ok) {
          warnings.push(`${chain}: HTTP ${res.status}`);
          break;
        }

        const data: { result?: MoralisTransfer[]; cursor?: string } = await res.json();
        const transfers = data.result ?? [];

        if (transfers.length === 0) break;

        const swaps = detectSwaps(transfers, wallet);

        for (const swap of swaps) {
          const outVal = parseFloat(swap.out.value_decimal);
          const inVal = parseFloat(swap.in.value_decimal);
          if (!Number.isFinite(outVal) || !Number.isFinite(inVal)) continue;
          if (outVal === 0 || inVal === 0) continue;

          // Price: how much of token_out per token_in
          const impliedPrice = outVal / inVal;

          // Sell side (token out)
          trades.push({
            platform_id: platformId,
            asset: swap.out.token_symbol,
            side: "sell",
            quantity: outVal,
            price: impliedPrice, // in terms of the paired token, not USD
            total_value: outVal,
            total_value_eur: usdToEur(outVal, eurUsdRate),
            fee: null,
            trade_id: `${swap.out.transaction_hash}:${swap.out.log_index}:sell`,
            executed_at: new Date(swap.out.block_timestamp).toISOString(),
          });

          // Buy side (token in)
          trades.push({
            platform_id: platformId,
            asset: swap.in.token_symbol,
            side: "buy",
            quantity: inVal,
            price: 1 / impliedPrice,
            total_value: inVal,
            total_value_eur: usdToEur(inVal, eurUsdRate),
            fee: null,
            trade_id: `${swap.in.transaction_hash}:${swap.in.log_index}:buy`,
            executed_at: new Date(swap.in.block_timestamp).toISOString(),
          });
        }

        cursor = data.cursor || undefined;
      } while (cursor);
    }

    return { trades, warnings };
  },
};
