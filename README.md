# chamillion.site

Web de la newsletter [Chamillion](https://chamillion.substack.com) — DeFi, mercados crypto y transparencia on-chain.

Proyecto Next.js (App Router) con widgets interactivos vanilla JS servidos como archivos estáticos.

## Estructura

```
chamillion.site/
├── app/
│   ├── layout.tsx                      ← Root layout (fuentes, metadata)
│   ├── globals.css                     ← Estilos globales
│   ├── page.tsx                        ← Landing (/)
│   └── newsletter/
│       └── post-01/
│           ├── page.tsx                ← Post 01 (/newsletter/post-01)
│           └── page.module.css
├── components/
│   └── chameleon-eye.tsx               ← SVG camaleón con eye-tracking
├── public/
│   ├── assets/                         ← SVGs y PNGs
│   └── widgets/
│       └── post-01/
│           ├── orderbook-patatas/      ← Libro de órdenes interactivo
│           ├── retail-vs-inst-esma/    ← Visualización ESMA
│           └── stablecoins-mcap/       ← Gráfico stablecoins market cap
├── STYLE_REFERENCE.md
└── README.md
```

## Desarrollo

```bash
npm install
npm run dev
```

## Rutas

| Ruta | Descripción |
|---|---|
| `/` | Landing page con camaleón SVG interactivo |
| `/newsletter/post-01` | Primer post: widgets embebidos via iframe |

## Widgets

Los widgets son HTML/CSS/JS vanilla autocontenidos en `public/widgets/`. Se embeben en las páginas Next.js via `<iframe>` y también funcionan como páginas independientes:

- `/widgets/post-01/orderbook-patatas/index.html`
- `/widgets/post-01/retail-vs-inst-esma/index.html`
- `/widgets/post-01/stablecoins-mcap/index.html`

Cada widget tiene su propia carpeta con:

```
widget-nombre/
├── index.html   ← estructura
├── style.css    ← estilos
└── app.js       ← lógica
```

## Convenciones

- **Carpetas**: kebab-case
- **Fuentes**: DM Mono (datos/UI), DM Serif Display (titulares landing)
- **Landing**: fondo `#0f0f0f`, acento azul `#6b8cae`
- **Widgets**: fondo dark `#191919`, light `#f4e9da` (paleta cálida)
- **Toggle dark/light**: esquina superior derecha en cada widget
- **Modo captura**: clic derecho en toggle → submenú contextual
- **Idioma**: español (es)
- **Prefijo `STYLING:`**: mensajes con este prefijo aplican cambios de estilo a todos los widgets
