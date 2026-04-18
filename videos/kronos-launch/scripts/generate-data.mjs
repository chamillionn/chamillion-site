/**
 * Fetch 512 BTC/USDT 1h candles from Binance and generate a real
 * Kronos-mini prediction by POSTing them to the Modal endpoint.
 *
 *   node scripts/generate-data.mjs
 *
 * Writes:
 *   data/btc-history.json
 *   data/btc-prediction.json
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

const BINANCE_URL =
  "https://data-api.binance.vision/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=512";
const KRONOS_URL =
  "https://chamillionn--kronos-predictor-kronosservice-api.modal.run";

const binRes = await fetch(BINANCE_URL);
const rawCandles = await binRes.json();
const history = rawCandles.map((k) => ({
  t: Math.floor(k[0] / 1000),
  o: +k[1],
  h: +k[2],
  l: +k[3],
  c: +k[4],
}));
console.log(
  `Binance: ${history.length} candles, ${new Date(history[0].t * 1000).toISOString()} → ${new Date(history[history.length - 1].t * 1000).toISOString()}`,
);

const body = {
  ohlcv: {
    columns: ["open", "high", "low", "close"],
    data: history.map((c) => [c.o, c.h, c.l, c.c]),
    timestamps: history.map((c) => new Date(c.t * 1000).toISOString()),
  },
  prediction_length: 24,
  model_size: "mini",
};
console.log("Calling Kronos modal.run (cold start may take 30-60s)...");
const t0 = Date.now();
const kRes = await fetch(KRONOS_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!kRes.ok) {
  console.error(`Kronos HTTP ${kRes.status}: ${await kRes.text()}`);
  process.exit(1);
}
const result = await kRes.json();
const elapsed = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`Kronos: ${result.data.length} predicted candles in ${elapsed}s`);

const ci = {
  o: result.columns.indexOf("open"),
  h: result.columns.indexOf("high"),
  l: result.columns.indexOf("low"),
  c: result.columns.indexOf("close"),
};
const prediction = result.data.map((row, i) => ({
  t: Math.floor(new Date(result.timestamps[i]).getTime() / 1000),
  o: row[ci.o] ?? row[0],
  h: row[ci.h] ?? row[1],
  l: row[ci.l] ?? row[2],
  c: row[ci.c] ?? row[3],
}));

const lastHist = history[history.length - 1].c;
const lastPred = prediction[prediction.length - 1].c;
const delta = ((lastPred - lastHist) / lastHist) * 100;
const reds = prediction.filter((c) => c.c < c.o).length;
console.log(
  `Delta: ${delta.toFixed(2)}%  |  red: ${reds}  green: ${24 - reds}`,
);

fs.writeFileSync(
  path.join(ROOT, "data/btc-history.json"),
  JSON.stringify(history),
);
fs.writeFileSync(
  path.join(ROOT, "data/btc-prediction.json"),
  JSON.stringify(prediction),
);
console.log("Wrote data/btc-history.json + data/btc-prediction.json");
