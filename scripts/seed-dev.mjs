#!/usr/bin/env node
/**
 * seed-dev — copia tablas seguras de prod a dev.
 *
 * Solo copia datos públicos o ya destinados a publicación:
 * portafolio (platforms, positions, snapshots, trades, capital_flows,
 * strategies), contenido (posts sin drafts, analyses sin admin_notes_md,
 * software, kronos_predictions) y el tracker (analysis_observations,
 * analysis_snapshots, analysis_events).
 *
 * NUNCA toca:
 *   auth.*, profiles, email_preferences, consultations, pending_logins,
 *   downloads, analyses.admin_notes_md (se nulla), posts.content_json/md/draft_*
 *   (se nullan — son borradores del editor, no publicados).
 *
 * Triple safety:
 *   1. URL de dev debe ser distinta de la de prod (aborta si coinciden).
 *   2. Variable DRY=1 para ensayo sin escribir.
 *   3. Confirma que el dev target NO contiene "hpyyuftot" (ID de prod).
 *
 * Uso:
 *   DRY=1 node scripts/seed-dev.mjs    # dry run, sólo cuenta filas
 *   node scripts/seed-dev.mjs          # ejecuta, escribe a dev
 */

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ── Parse .env.local manually (no dotenv dep) ─────────────────────
function loadEnv(path) {
  let raw;
  try {
    raw = readFileSync(path, "utf8");
  } catch {
    throw new Error(`Cannot read ${path}`);
  }
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, key, valRaw] = m;
    const val = valRaw.replace(/^["']|["']$/g, "").trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnv(".env.local");

const PROD_URL = process.env.PROD_SUPABASE_URL;
const PROD_KEY = process.env.PROD_SUPABASE_SERVICE_ROLE_KEY;
const DEV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const DEV_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DRY = process.env.DRY === "1";

if (!PROD_URL || !PROD_KEY) {
  console.error("Faltan PROD_SUPABASE_URL o PROD_SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
if (!DEV_URL || !DEV_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// ── Safety ────────────────────────────────────────────────────────
if (PROD_URL === DEV_URL) {
  console.error("Abort: PROD y DEV URLs coinciden. Esto sobrescribiría prod.");
  process.exit(1);
}
if (DEV_URL.includes("hpyyuftot")) {
  console.error("Abort: DEV URL contiene 'hpyyuftot' (prefijo de prod).");
  process.exit(1);
}

const prod = createClient(PROD_URL, PROD_KEY, {
  auth: { persistSession: false },
});
const dev = createClient(DEV_URL, DEV_KEY, {
  auth: { persistSession: false },
});

// ── Tables in FK-safe order (parents first, children last) ───────
// Each entry: { name, transform?: fn to scrub fields before insert }
// Tables in FK-safe order (parents first, children last). Deletion walks in
// reverse, insertion walks forward.
const TABLES = [
  { name: "platforms" },
  { name: "strategies" },
  {
    name: "posts",
    // Strip draft-editor columns: they only exist in prod (migration not yet
    // applied to dev). Also they're editor-only state we don't want to ship.
    transform: (r) => {
      const copy = { ...r };
      delete copy.content_json;
      delete copy.content_md;
      delete copy.draft_updated_at;
      return copy;
    },
  },
  { name: "software" },
  {
    name: "analyses",
    transform: (r) => {
      const copy = { ...r };
      // Admin notes are private to prod admin; never replicate.
      copy.admin_notes_md = null;
      // has_prediction is a generated column — can't be written directly.
      delete copy.has_prediction;
      return copy;
    },
  },
  { name: "site_settings" },
  { name: "kronos_predictions" },
  // Children
  { name: "positions" },
  { name: "trades" },
  { name: "capital_flows" },
  { name: "snapshots" },
  { name: "software_versions" },
  { name: "analysis_observations" },
  { name: "analysis_snapshots" },
  { name: "analysis_events" },
];

// Explicitly excluded — document here so future maintainers understand why.
const EXCLUDED = [
  "profiles",            // emails, stripe ids, roles
  "email_preferences",   // emails
  "consultations",       // user booking PII
  "downloads",           // user behaviour
  "pending_logins",      // auth tokens
  "auth.*",              // Supabase auth managed separately
];

const BATCH = 500;

async function fetchAll(name) {
  let page = 0;
  const rows = [];
  while (true) {
    const from = page * BATCH;
    const to = from + BATCH - 1;
    const { data, error } = await prod.from(name).select("*").range(from, to);
    if (error) {
      const missing =
        error.code === "42P01" ||
        error.code === "PGRST205" ||
        /does not exist/.test(error.message) ||
        /Could not find the table/i.test(error.message) ||
        /schema cache/i.test(error.message);
      if (missing) return { missing: true, rows: [] };
      throw new Error(`prod.${name} fetch: ${error.message}`);
    }
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BATCH) break;
    page += 1;
  }
  return { missing: false, rows };
}

async function deleteAll(name) {
  // Each table has either `id` uuid PK or (site_settings) `key` text PK.
  // Try both in sequence.
  const { error: e1 } = await dev.from(name).delete().not("id", "is", null);
  if (!e1) return;
  const { error: e2 } = await dev.from(name).delete().not("key", "is", null);
  if (!e2) return;
  const missing =
    e2.code === "42P01" ||
    e2.code === "PGRST205" ||
    /Could not find the table/i.test(e2.message);
  if (missing) return; // table doesn't exist in dev — nothing to delete
  throw new Error(`dev.${name} delete: ${e2.message}`);
}

async function insertAll(name, rows, transform) {
  const payload = transform ? rows.map(transform) : rows;
  for (let i = 0; i < payload.length; i += BATCH) {
    const chunk = payload.slice(i, i + BATCH);
    const { error } = await dev.from(name).insert(chunk);
    if (error) throw new Error(`dev.${name} insert batch ${i}: ${error.message}`);
  }
}

// ── Main ──────────────────────────────────────────────────────────
console.log(`\nseed-dev — ${DRY ? "DRY RUN" : "WRITING"} \n`);
console.log(`  source:   ${PROD_URL}`);
console.log(`  target:   ${DEV_URL}`);
console.log(`  excluded: ${EXCLUDED.join(", ")}\n`);

// Phase 1 — fetch everything from prod (read-only, safe to do in any order).
console.log(`  phase 1/3 — fetch from prod`);
const fetched = {};
const results = [];
for (const table of TABLES) {
  const started = Date.now();
  try {
    const r = await fetchAll(table.name);
    if (r.missing) {
      results.push({ name: table.name, status: "missing-in-prod", count: 0, elapsed: Date.now() - started });
    } else {
      fetched[table.name] = r.rows;
      results.push({ name: table.name, status: "fetched", count: r.rows.length, elapsed: Date.now() - started });
    }
  } catch (e) {
    results.push({ name: table.name, status: "fetch-error", count: 0, error: e.message, elapsed: Date.now() - started });
  }
}
for (const r of results) {
  const emoji = r.status === "fetched" ? "→" : r.status === "missing-in-prod" ? "·" : "✗";
  const msg = r.status === "fetch-error" ? `ERROR ${r.error}` : r.status;
  console.log(`    ${emoji} ${r.name.padEnd(26)} ${String(r.count).padStart(5)} rows  (${r.elapsed}ms)  ${msg}`);
}

if (DRY) {
  console.log(`\n  DRY RUN — skipping phases 2 & 3. Re-run without DRY=1 to sync.`);
  process.exit(0);
}

// Phase 2 — delete everything in dev (reverse FK order: children first)
console.log(`\n  phase 2/3 — delete existing dev rows (reverse FK order)`);
for (const table of [...TABLES].reverse()) {
  // Only delete tables we actually fetched (skip missing ones)
  if (!(table.name in fetched)) continue;
  const started = Date.now();
  try {
    await deleteAll(table.name);
    console.log(`    ✓ ${table.name.padEnd(26)} cleared        (${Date.now() - started}ms)`);
  } catch (e) {
    console.error(`    ✗ ${table.name.padEnd(26)} ERROR  ${e.message}`);
    process.exit(1);
  }
}

// Phase 3 — insert everything in forward FK order (parents first)
console.log(`\n  phase 3/3 — insert into dev`);
let errCount = 0;
for (const table of TABLES) {
  if (!(table.name in fetched)) continue;
  const started = Date.now();
  const rows = fetched[table.name];
  try {
    await insertAll(table.name, rows, table.transform);
    console.log(`    ✓ ${table.name.padEnd(26)} ${String(rows.length).padStart(5)} rows  (${Date.now() - started}ms)`);
  } catch (e) {
    console.error(`    ✗ ${table.name.padEnd(26)} ERROR  ${e.message}`);
    errCount += 1;
  }
}

const synced = Object.keys(fetched).length;
const missing = results.filter((r) => r.status === "missing-in-prod");

console.log(`\n  done: ${synced} tables synced · ${errCount} errors · ${missing.length} missing in prod`);
if (missing.length > 0) {
  console.log(`  missing in prod (schema drift): ${missing.map((r) => r.name).join(", ")}`);
}

process.exit(errCount > 0 ? 1 : 0);
