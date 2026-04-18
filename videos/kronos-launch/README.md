# Kronos launch video

18-second 1920×1080 MP4 used in the Twitter launch announcement for `/kronos`.
Built with [Hyperframes](https://github.com/heygen-com/hyperframes) (HTML + data
attributes → headless Chrome → ffmpeg). Uses real BTC/USDT 1h data from Binance
and a real Kronos-mini prediction from the Modal endpoint.

## Requirements

- Node 22+ (Hyperframes requires it)
- ffmpeg on PATH

## Commands

```bash
npm run preview           # live-reload browser editor (npx hyperframes preview)
npm run lint              # validate composition
npm run render            # final MP4 → renders/kronos-launch_*.mp4
npm run render:og         # regenerate public/kronos/og-image.png (1200×675)
npm run data:refresh      # fetch fresh Binance + Kronos prediction
```

Requires Node 22+ (Hyperframes) and ffmpeg on PATH.

Chrome binary used by the OG screenshot script is the one bundled by
Hyperframes (under `~/.cache/hyperframes/chrome/…`). Install it once:

```bash
npx hyperframes browser ensure
```

## Regenerating the data

The prediction is deterministic from the snapshot of Binance data. To refresh
with a newer window:

```bash
node scripts/generate-data.mjs
```

(Script fetches 512 BTC 1h candles, POSTs them to
`chamillionn--kronos-predictor-kronosservice-api.modal.run`, writes
`data/btc-history.json` + `data/btc-prediction.json`.)

## File layout

- `index.html` — composition root with data-attribute timing
- `styles.css` — matches the `/kronos` aesthetic (Playfair / Outfit / DM Mono)
- `timeline.js` — GSAP master timeline + SVG chart builder
- `data/*.json` — real BTC history + Kronos-mini prediction (deterministic render)
- `fonts/*.woff2` — Playfair Display, Outfit, DM Mono, JetBrains Mono (bundled)
- `assets/` — Kronos and Chamillion logos
- `dist/kronos-launch.mp4` — final render for the tweet
