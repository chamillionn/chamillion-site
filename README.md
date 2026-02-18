# notion-contents

Widgets HTML interactivos para embeber en una newsletter de Notion vía iframe.

## Estructura

```
notion-contents/
├── index.html                          ← Hub de navegación
└── newsletter/
    └── post-01/
        ├── orderbook-patatas/          ← Libro de órdenes interactivo
        ├── retail-vs-inst-esma/        ← Visualización ESMA retail vs institucional
        └── stablecoins-mcap/           ← Gráfico de área: stablecoins market cap
```

Los componentes se organizan por destino y post de newsletter. Cada widget tiene su propia carpeta con tres archivos:

```
widget-nombre/
├── index.html   ← estructura
├── style.css    ← estilos
└── app.js       ← lógica
```

## Componentes

### Libro de Órdenes · Mercado de Patatas
Simulación interactiva de un libro de órdenes con límite de precio usando patatas como activo. El usuario puede comprar y vender, ver el spread, y observar cómo el matching engine ejecuta las órdenes. Las órdenes pasivas se rellenan automáticamente tras unos segundos.

### Retail vs Institucional (ESMA)
Visualización basada en el informe ESMA 2025 sobre costes de fondos de inversión europeos. Muestra la diferencia en comisiones entre el inversor minorista y el institucional, y su impacto en el valor real a 10 años.

### Stablecoins Market Cap
Gráfico de área con curva suave (monotone cubic spline) que muestra la evolución del market cap total de stablecoins desde noviembre 2017 hasta febrero 2026. Incluye crosshair interactivo con tooltip de fecha y valor.

## Convenciones

- **Carpeta**: `kebab-case`, una por widget
- **Archivos**: `index.html` + `style.css` + `app.js` por widget
- **Fondo**: `#191919` (dark) · `#f4e9da` (light)
- **Fuentes**: [DM Mono](https://fonts.google.com/specimen/DM+Mono) para datos/UI · [DM Serif Display](https://fonts.google.com/specimen/DM+Serif+Display) para cabeceras editoriales
- **Toggle dark/light**: esquina superior derecha, icono sol/luna
- **Modo captura**: accesible via clic derecho en el toggle de tema → submenú contextual
- **Sin dependencias externas**: vanilla HTML/CSS/JS, sin frameworks ni librerías
- **Idioma**: español (es)
- **Prefijo `STYLING:`**: mensajes con este prefijo aplican cambios de estilo a todos los componentes
