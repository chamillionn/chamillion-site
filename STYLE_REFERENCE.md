# Style Reference

Guia de estilo para chamillion.site — proyecto Next.js (App Router).

---

## Fuentes

Las fuentes se cargan via `next/font/google` en `app/layout.tsx` y se exponen como CSS variables.

| Uso | Familia | CSS Variable |
|---|---|---|
| Titulo "Chamillion" (solo H1 hero) | `'Instrument Serif', serif` | `--font-instrument-serif` |
| Titulares, headings, cards | `'Playfair Display', serif` | `--font-playfair` |
| Datos, cifras, monospace (app) | `'JetBrains Mono', monospace` | `--font-jetbrains` |
| Datos, cifras, monospace (widgets) | `'DM Mono', monospace` | `--font-dm-mono` |
| Body / UI general | `'Outfit', sans-serif` | `--font-outfit` |
| Body / UI (newsletter posts, hub) | `'Source Sans 3', sans-serif` | `--font-source-sans` |

Los widgets en `public/widgets/` cargan sus propias fuentes via Google Fonts `<link>` (son HTML estatico independiente).

---

## Paleta de colores

La paleta se define como CSS custom properties en `app/globals.css` con soporte dark/light. Las paginas de la app acceden a las variables via `lib/theme.ts` que exporta el objeto `V` y helpers `steelA()` / `bgCardA()`.

### Dark mode (default)

| Rol | Variable CSS | Valor |
|---|---|---|
| **Fondo** | `--bg-dark` | `#0C0E11` |
| **Tarjetas** | `--bg-card` | `#13161B` |
| **Tarjetas hover** | `--bg-card-hover` | `#191D24` |
| **Bordes** | `--border` | `#1E2229` |
| **Texto primario** | `--text-primary` | `#E8EAED` |
| **Texto secundario** | `--text-secondary` | `#8B9099` |
| **Texto muted** | `--text-muted` | `#5A5F6A` |
| **Acento azul** | `--steel-blue` | `#6B8EA0` |
| **Verde (PnL+)** | `--green` | `#5BAA7C` |
| **Rojo (PnL-)** | `--red` | `#C7555A` |

### Light mode

| Rol | Variable CSS | Valor |
|---|---|---|
| **Fondo** | `--bg-dark` | `#f4e9da` |
| **Tarjetas** | `--bg-card` | `#ede3d6` |
| **Tarjetas hover** | `--bg-card-hover` | `#f0e6d8` |
| **Bordes** | `--border` | `#d4c4b0` |
| **Texto primario** | `--text-primary` | `#1e1410` |
| **Texto secundario** | `--text-secondary` | `#6b5a4e` |
| **Texto muted** | `--text-muted` | `#a89080` |
| **Acento azul** | `--steel-blue` | `#4a7a9a` |
| **Verde** | `--green` | `#3d8a5e` |
| **Rojo** | `--red` | `#b94449` |

### Widgets (public/widgets/)

Los widgets mantienen su propio CSS con variables de tema:

```css
:root {
  --bg: #0d0d0d;
  --text: #e8e6e1;
}

[data-theme="light"] {
  --bg: #f4e9da;
  --text: #1e1410;
}
```

---

## Escala tipografica (widgets)

| Tamano | Uso |
|---|---|
| `4.5rem` | Cifras hero (cantidades principales) |
| `2.2rem` | Cifras secundarias |
| `1.35rem` | Headline normal |
| `1.1rem` | Punchline / conclusion |
| `0.75rem` | Source / atribuciones |
| `0.7rem` | Labels |
| `0.65rem` | Tags uppercase, labels pequenos |

---

## Convenciones CSS

### App (Next.js)

- Estilos globales en `app/globals.css`
- Paginas internas usan CSS Modules (`.module.css`)
- Homepage y newsletter index usan inline styles con las constantes de `lib/theme.ts`

### Labels y tags

```css
.label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}
```

### Toggle dark/light

Toggle fijo global en esquina superior derecha (`components/theme-toggle.tsx`), sincroniza con iframes de widgets via `postMessage`.

### Modo captura (widgets)

Clase `html.capture` para screenshots — oculta UI no esencial, ajusta tamanos para exportacion a imagen (Substack, 728px de ancho).
