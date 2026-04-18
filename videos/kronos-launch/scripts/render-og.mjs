/**
 * Render og.html → public/kronos/og-image.png using Hyperframes' bundled
 * Chrome via puppeteer-core (installed locally as a dev dep).
 *
 *   node scripts/render-og.mjs
 */

import { spawnSync } from "node:child_process";
import http from "node:http";
import { readFile, mkdir, unlink, stat } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const OUT = path.resolve(ROOT, "../../public/kronos/og-image.png");

const chromePath = spawnSync(
  "sh",
  ["-c", "find ~/.cache/hyperframes/chrome -name 'chrome-headless-shell' -type f | head -1"],
  { encoding: "utf8" },
).stdout.trim();
if (!chromePath) {
  console.error("Chrome not found. Run: npx hyperframes browser ensure");
  process.exit(1);
}

const server = http.createServer(async (req, res) => {
  const reqPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const safe = path.join(ROOT, reqPath.replace(/^\/+/, ""));
  if (!safe.startsWith(ROOT)) return res.writeHead(403).end();
  try {
    const data = await readFile(safe);
    const ct = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".json": "application/json",
      ".svg": "image/svg+xml",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".woff2": "font/woff2",
    }[path.extname(safe).toLowerCase()] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": ct, "Cache-Control": "no-store" });
    res.end(data);
  } catch {
    res.writeHead(404).end();
  }
});

await new Promise((r) => server.listen(0, r));
const port = server.address().port;
const url = `http://localhost:${port}/og.html`;

await mkdir(path.dirname(OUT), { recursive: true });
try { await unlink(OUT); } catch { /* ok */ }

console.log(`Rendering ${url} → ${OUT}`);

const browser = await puppeteer.launch({
  executablePath: chromePath,
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 2 });
await page.goto(url, { waitUntil: "networkidle0" });
await page.waitForFunction("window.__READY === true", { timeout: 10_000 });
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 300));
await page.screenshot({ path: OUT, type: "png" });

const { size } = await stat(OUT);
console.log(`Wrote ${(size / 1024).toFixed(1)} KB (@2x for crisp OG)`);

await browser.close();
server.close();
