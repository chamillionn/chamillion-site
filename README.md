# chamillion.site

Web de la newsletter [Chamillion](https://chamillion.substack.com) — DeFi, mercados crypto y transparencia on-chain.

Proyecto Next.js (App Router) con widgets interactivos vanilla JS servidos como archivos estaticos.

## Estructura

```
chamillion.site/
├── app/
│   ├── layout.tsx                      ← Root layout (fuentes, metadata, theme toggle)
│   ├── globals.css                     ← Estilos globales + paleta dark/light
│   ├── (home)/
│   │   ├── page.tsx                    ← Landing (/)
│   │   └── hub/                        ← Hub — en construccion (/hub)
│   ├── newsletter/
│   │   ├── layout.tsx                  ← Layout compartido newsletter (header)
│   │   ├── layout.module.css
│   │   ├── page.tsx                    ← Indice newsletter (/newsletter)
│   │   ├── post.module.css             ← Estilos compartidos de posts
│   │   └── navegar-las-.../page.tsx    ← Post 01 (slug completo)
│   └── widgets/
│       └── page.tsx                    ← Catalogo de widgets (/widgets)
├── components/
│   ├── chameleon-eye.tsx               ← SVG camaleon con eye-tracking (newsletter bg)
│   ├── theme-toggle.tsx                ← Toggle dark/light global
│   ├── financial-bg.tsx                ← Fondo financiero animado (hub)
│   └── financial-bg.module.css
├── lib/
│   └── theme.ts                        ← Constantes de color V, helpers steelA/bgCardA
├── public/
│   ├── assets/
│   │   ├── face-vector.svg             ← Camaleon vectorial
│   │   ├── newsletter/                 ← Assets del newsletter (banners, iconos)
│   │   └── og-image.png                ← Open Graph
│   └── widgets/
│       ├── widget-common.css           ← Estilos compartidos widgets
│       ├── widget-common.js            ← JS compartido widgets
│       ├── compound-interest/          ← Calculadora interes compuesto
│       └── post-01/
│           ├── orderbook-patatas/      ← Libro de ordenes interactivo
│           ├── retail-vs-inst-esma/    ← Visualizacion ESMA
│           └── stablecoins-mcap/       ← Grafico stablecoins market cap
├── STYLE_REFERENCE.md
├── POST_TEMPLATE.md
└── README.md
```

## Desarrollo

```bash
npm install
npm run dev
```

## Rutas

| Ruta | Descripcion |
|---|---|
| `/` | Landing page con portfolio, donut chart, post preview |
| `/newsletter` | Indice de posts |
| `/newsletter/navegar-las-finanzas-modernas-...` | Post 01 con widgets embebidos |
| `/hub` | Hub — en construccion |
| `/widgets` | Catalogo de widgets interactivos |
| `/w/orderbook` | Shortcut → orderbook widget |
| `/w/esma` | Shortcut → ESMA widget |
| `/w/stablecoins` | Shortcut → stablecoins widget |
| `/w/compound` | Shortcut → compound interest widget |

## Widgets

Los widgets son HTML/CSS/JS vanilla autocontenidos en `public/widgets/`. Se embeben en las paginas Next.js via `<iframe>` y tambien funcionan como paginas independientes.

Cada widget tiene su propia carpeta con:

```
widget-nombre/
├── index.html   ← estructura
├── style.css    ← estilos
└── app.js       ← logica
```

## Convenciones

- **Carpetas**: kebab-case
- **Fuentes app**: Instrument Serif (titulo hero), Playfair Display (headings), JetBrains Mono (datos), Outfit (body)
- **Fuentes widgets**: DM Mono (datos), DM Serif Display (titulares)
- **Paleta**: dark/light via CSS custom properties en globals.css
- **Constantes de color**: `lib/theme.ts` exporta `V`, `steelA()`, `bgCardA()`
- **Toggle dark/light**: global en esquina superior derecha, sincroniza con iframes
- **Idioma**: espanol (es)
- **Prefijo `STYLING:`**: mensajes con este prefijo aplican cambios de estilo a todos los widgets
