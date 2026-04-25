#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path) {
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, valRaw] = m;
    const val = valRaw.replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(".env.local");

const dev = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const { data, error } = await dev
  .from("kronos_predictions")
  .select("id, symbol, timeframe, model, created_at")
  .order("created_at", { ascending: false })
  .limit(30);

if (error) {
  console.error(error.message);
  process.exit(1);
}
console.log(`Found ${data.length} recent predictions:`);
for (const r of data) {
  console.log(`  ${r.created_at}  ${r.symbol.padEnd(12)}  ${r.timeframe}  ${r.id.slice(0, 8)}`);
}
