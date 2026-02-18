# Style Reference

Guía de estilo para los componentes interactivos de la newsletter.

---

## Fuentes

| Uso | Familia | Import |
|---|---|---|
| Datos, cifras, monospace | `'DM Mono', monospace` | [Google Fonts](https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500) |
| Titulares editoriales | `'Instrument Serif', serif` | [Google Fonts](https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1) |
| UI (botones, labels) | `system-ui, -apple-system, 'Segoe UI', 'Roboto', sans-serif` | Nativa |

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&display=swap');
```

---

## Paleta de colores

### Dark mode (por defecto)

| Rol | Color | Uso |
|---|---|---|
| **Fondo** | `#171717` | Body background |
| **Texto principal** | `#e8e6e1` | Cifras grandes, cuerpo |
| **Texto soft** | `#c8c6c1` | Énfasis suave (em, destacados) |
| **Texto muted** | `#8a8a8e` | Titulares, subtítulos |
| **Labels** | `#555555` | Etiquetas uppercase |
| **Muy sutil** | `#3a3a3e` | Tags casi invisibles |
| **Bordes** | `#2a2a2e` | Separadores, bordes de sección |
| **Superficie track** | `#1e1e22` | Fondo de barras de progreso |
| **Acento rojo** | `#c0392b` | Pérdidas, costes retail |
| **Acento azul** | `#6b9ebb` | Datos institucionales, links hover |
| **Azul oscuro** | `#4a8aaa` | Variante secundaria de azul |

### Light mode

| Rol | Color | Uso |
|---|---|---|
| **Fondo** | `#f4e9da` | Body background |
| **Texto principal** | `#1e1410` | Cifras, cuerpo |
| **Texto soft** | `#3d2b22` | Énfasis suave |
| **Texto muted** | `#6b5a4e` | Subtítulos |
| **Labels** | `#8a7060` | Etiquetas |
| **Muy sutil** | `#b8a898` | Tags secundarios |
| **Bordes** | `#d4c4b0` | Separadores |
| **Superficie track** | `#e8d8c8` | Fondo de barras |
| **Fuente/source** | `#a89080` | Atribuciones, texto terciario |
| **Acento rojo** | `#a52a1a` | Versión light del rojo |
| **Acento azul** | `#4a7a9a` | Versión light del azul |

---

## Escala tipográfica

| Tamaño | Uso |
|---|---|
| `4.5rem` | Cifras hero (cantidades principales) |
| `2.2rem` | Cifras secundarias (comisiones) |
| `1.9rem` | Headline modo captura |
| `1.35rem` | Headline normal |
| `1.3rem` | Cifras terciarias (valor real) |
| `1.1rem` | Punchline / conclusión |
| `0.75rem` | Source / atribuciones |
| `0.7rem` | Labels |
| `0.65rem` | Tags uppercase, labels pequeños |
| `0.6rem` | Contexto fino, notas |

---

## Convenciones CSS

### Estructura base

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: 'DM Mono', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}
```

### Variables de tema

```css
:root {
  --bg: #171717;
  --text: #e8e6e1;
}

[data-theme="light"] {
  --bg: #f4e9da;
  --text: #1e1410;
}
```

### Labels y tags

```css
.label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  color: #555;
}
```

### Bordes y separadores

```css
border: 1px solid #2a2a2e;                    /* dark */
border: 1px solid #d4c4b0;                    /* light */
```

### Toggle dark/light

Toggle fijo en esquina superior derecha, icono SVG (sol/luna), 30×30px, `border-radius: 8px`.

### Modo captura

Clase `html.capture` para screenshots — oculta UI no esencial, ajusta tamaños para exportación a imagen (Substack, 728px de ancho).
