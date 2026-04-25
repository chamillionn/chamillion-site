#!/usr/bin/env node
/**
 * One-off: copia todas las predicciones de cobre (symbol='HG=F') de dev a prod.
 * Idempotente via ON CONFLICT (id) DO NOTHING implícito por la uniqueness del PK.
 *
 * Uso:
 *   node scripts/copy-kronos-copper.mjs
 */

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

const DEV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DEV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROD_URL = process.env.PROD_SUPABASE_URL;
const PROD_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;

if (!DEV_URL || !DEV_KEY || !PROD_URL || !PROD_KEY) {
  console.error("Faltan env vars (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PROD_*).");
  process.exit(1);
}
if (DEV_URL === PROD_URL) {
  console.error("Abort: DEV y PROD URLs coinciden.");
  process.exit(1);
}

const dev = createClient(DEV_URL, DEV_KEY, { auth: { persistSession: false } });
const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });

console.log(`\nFetching HG=F predictions from dev (${DEV_URL})...`);
const { data: rows, error: rErr } = await dev
  .from("kronos_predictions")
  .select("*")
  .eq("symbol", "HG=F")
  .order("created_at", { ascending: false });

if (rErr) {
  console.error("dev read error:", rErr.message);
  process.exit(1);
}
console.log(`  → ${rows.length} row(s) found`);
if (rows.length === 0) {
  console.log("  Nothing to copy. Exiting.");
  process.exit(0);
}
for (const r of rows) {
  console.log(`    • ${r.id} · ${r.timeframe} · ${r.created_at}`);
}

console.log(`\nInserting into prod (${PROD_URL})...`);
// Upsert so re-runs are idempotent. Conflict on id (PK).
const { data: inserted, error: iErr } = await prod
  .from("kronos_predictions")
  .upsert(rows, { onConflict: "id", ignoreDuplicates: true })
  .select("id");

if (iErr) {
  console.error("prod write error:", iErr.message);
  process.exit(1);
}
console.log(`  → ${inserted?.length ?? 0} row(s) written (idempotent upsert).`);
console.log("Done.\n");
