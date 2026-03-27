> **Flujo Notion suspendido.** El post ahora se escribe en Substack.
> Para convertir, usar **SUBSTACK_TEMPLATE.md**.
> Este archivo se conserva como referencia de estructura y CSS classes.

# Post Template — Guía de conversión Notion → Web

Referencia para convertir posts de Notion a páginas web en chamillion.site.

---

## 1. Mapeo Notion → HTML/CSS

Todos los estilos se importan del módulo compartido:
```tsx
import styles from "../post.module.css";
```

| Notion | TSX | Clase CSS |
|---|---|---|
| **Heading 1** | `<h1>texto</h1>` | Auto (`.article h1`) |
| **Heading 2** | `<h2>texto</h2>` | Auto (`.article h2`) |
| **Heading 3** | `<h3>texto</h3>` | Auto (`.article h3`) |
| **Párrafo** | `<p>texto</p>` | Auto (`.article p`) |
| **Negrita** | `<strong>texto</strong>` | Auto (`.article strong`) |
| **Cursiva** | `<em>texto</em>` | Auto (`.article p em`) |
| **Enlace externo** | `<a href="URL" target="_blank" rel="noopener noreferrer" data-domain="dominio.com">texto</a>` | Auto + tooltip con dominio |
| **Enlace interno** | `<Link href="/ruta">texto</Link>` | — |
| **Blockquote** | `<div className={styles.pullquote}><p>texto</p></div>` | `.pullquote` |
| **Callout** | `<div className={styles.highlightBox}><p>texto</p></div>` | `.highlightBox` |
| **Divider** | `<hr className={styles.divider} />` | `.divider` |
| **Divider (sección)** | `<hr className={styles.dividerHeavy} />` | `.dividerHeavy` |
| **Imagen** | `<Image className={styles.heroImg} src="/assets/newsletter/nombre.ext" alt="desc" width={W} height={H} />` | `.heroImg` |
| **Lista (bullets)** | `<ul className={styles.hubList}><li>item</li></ul>` | `.hubList` |
| **Widget/embed** | Ver sección 6 | `.iframe` + `.iframeNombreWidget` |

### Reglas de conversión

- **Enlaces externos**: siempre `target="_blank" rel="noopener noreferrer"` + `data-domain="dominio.com"` (muestra tooltip con el dominio en hover)
- **Espacios en JSX**: cuando un elemento inline está en línea separada, usar `{" "}` para el espacio
- **Comillas tipográficas**: `&ldquo;` `&rdquo;` `&lsquo;` `&rsquo;`
- **Saltos de línea**: `<br />` dentro de un bloque de texto
- **Imágenes**: usar `<Image>` de `next/image` con width/height reales

---

## 2. Skeleton TSX

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import styles from "../post.module.css";

export const metadata: Metadata = {
  title: "TÍTULO",
  description: "DESCRIPCIÓN_CORTA",
  openGraph: {
    title: "TÍTULO — Chamillion",
    description: "DESCRIPCIÓN_CORTA",
    images: [{ url: "/assets/newsletter/banner-post-XX.jpeg" }],
  },
};

export default function PostXX() {
  return (
    <>
      {/* BANNER */}
      <div className={styles.bannerSection}>
        <div className={styles.bannerWrapper}>
          <Image
            className={styles.bannerImg}
            src="/assets/newsletter/banner-post-XX.jpeg"
            alt="Chamillion"
            width={1568}
            height={700}
            priority
          />
        </div>
      </div>

      {/* ARTICLE */}
      <article className={styles.article}>
        <div className={styles.articleHeader}>
          <h1>TÍTULO</h1>
          <p className={styles.articleSubtitle}>SUBTÍTULO</p>
          <div className={styles.postMeta}>DD MMM YYYY · X min</div>
        </div>

        <hr className={styles.dividerHeavy} />

        {/* === CONTENIDO === */}


        {/* === FIN CONTENIDO === */}

        <hr className={styles.dividerHeavy} />

        {/* DISCLAIMER */}
        <div className={styles.disclaimer}>
          Nada de lo publicado en esta newsletter constituye asesoramiento
          financiero, de inversión, legal o fiscal. El contenido se proporciona
          únicamente con fines educativos e informativos. Las inversiones en
          criptomonedas y productos financieros conllevan riesgos
          significativos, incluyendo la pérdida total del capital invertido.
          Cada lector es responsable de realizar su propia investigación y
          consultar con profesionales cualificados antes de tomar cualquier
          decisión financiera. Los resultados pasados no garantizan resultados
          futuros.
        </div>
      </article>
    </>
  );
}
```

---

## 3. Metadata

```tsx
export const metadata: Metadata = {
  title: "Título del Post",
  description: "Descripción corta para SEO y redes",
  openGraph: {
    title: "Título del Post — Chamillion",
    description: "Descripción corta para SEO y redes",
    images: [{ url: "/assets/newsletter/banner-post-XX.jpeg" }],
  },
};
```

El root layout añade ` — Chamillion` al `<title>` via `title.template`. OG title se pone manualmente con el sufijo.

---

## 4. Actualizar el índice

Añadir entrada al array `posts` en `app/newsletter/page.tsx`:

```tsx
const posts = [
  {
    slug: "post-XX",
    title: "Título completo",
    subtitle: "Subtítulo / descripción",
    date: "YYYY-MM-DD",
    banner: "/assets/newsletter/banner-post-XX.jpeg",
  },
  // ... posts anteriores (más reciente primero)
];
```

---

## 5. Assets

```
public/assets/newsletter/
  banner-post-XX.jpeg     ← Banner (3:1, ~1568×700)
  nombre-post-XX.png      ← Hero/cierre (si aplica)

public/widgets/post-XX/
  widget-name/
    index.html
    style.css
    app.js
```

- Banner: `banner-post-XX.ext` (jpeg para fotos)
- Imágenes específicas del post: incluir `post-XX` en el nombre
- Widgets: carpeta propia por widget dentro de `public/widgets/post-XX/`

---

## 6. Widgets (iframe)

```tsx
<iframe
  src="/widgets/post-XX/widget-name/index.html"
  loading="lazy"
  className={`${styles.iframe} ${styles.iframeWidgetName}`}
  title="Descripción accesible del widget"
/>
```

- Altura del iframe via clase CSS (ej. `.iframeWidgetName { height: 700px; }`) en `post.module.css`, no inline
- `loading="lazy"` siempre
- `title` obligatorio (accesibilidad)
- Los widgets gestionan su propio dark/light mode internamente
- Incluir responsivo en `@media (max-width: 600px)` si la altura cambia en móvil

---

## 7. Componentes reutilizables

Bloques comunes que se pueden copiar entre posts:

### Social link (X/Twitter)
```tsx
<a className={styles.socialLink} href="https://x.com/chamillionnnnn" target="_blank" rel="noopener noreferrer">
  <svg className={styles.socialLinkIcon} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
  <span className={styles.socialLinkText}>TEXTO <strong>@chamillionnnnn</strong></span>
  <span className={styles.socialLinkArrow}>&rarr;</span>
</a>
```

### Plan box (datos estructurados)
```tsx
<h3 className={styles.planHeading}>TÍTULO</h3>
<div className={styles.planBox}>
  <div className={styles.planEntry}>
    <span className={styles.planLabel}>Label:</span>
    <span className={styles.planDesc}>Descripción</span>
  </div>
  <div className={styles.planFooter}>Nota al pie</div>
</div>
```

### Sections grid (cards con icono)
```tsx
<div className={styles.sectionsGrid}>
  <div className={styles.sectionItem}>
    <Image className={styles.sectionIcon} src="/assets/newsletter/icon-X.jpg" alt="Alt" width={40} height={40} />
    <div className={styles.sectionContent}>
      <h3>Título</h3>
      <p>Descripción</p>
    </div>
  </div>
</div>
```

---

## 8. Checklist de conversión

1. Crear carpeta `app/newsletter/post-XX/`
2. Crear `page.tsx` con el skeleton de la sección 2
3. Rellenar metadata (título, descripción)
4. Guardar banner en `public/assets/newsletter/banner-post-XX.jpeg`
5. Convertir bloques de Notion usando la tabla de la sección 1
6. Guardar imágenes en `public/assets/newsletter/`
7. Crear widgets en `public/widgets/post-XX/` si aplica
8. Añadir disclaimer al final del artículo
9. Añadir entrada al array `posts` en `app/newsletter/page.tsx`
10. Verificar con `npm run dev` en `localhost:3000/newsletter/post-XX`
