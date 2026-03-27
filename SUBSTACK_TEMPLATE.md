# Substack → Web: Guía de conversión

Flujo activo para publicar posts en chamillion.site.

---

## 1. Workflow

1. Escribe el post completo en Substack (draft o publicado).
2. Haz una **captura de pantalla completa** del post (scroll completo, toda la página visible).
3. Pega la imagen en el chat de Claude Code.
4. Antes de pegar, proporciona:
   - **slug** (kebab-case, ej: `tercer-post-titulo`)
   - **fecha** de publicación (`YYYY-MM-DD`)
   - **número de post** (`post-03`, `post-04`…) — para nombrar assets y widgets
   - **premium**: sí / no
   - **widgets embebidos** (si los hay): describir qué hace cada uno
5. Claude lee el contenido de la imagen, mapea los elementos y devuelve el `page.tsx` completo.

---

## 2. Mapeo Substack → TSX

Todos los estilos se importan del módulo compartido:
```tsx
import styles from "../post.module.css";
```

| Elemento Substack | TSX | Clase CSS |
|---|---|---|
| Título del post | `<h1>texto</h1>` | Auto (`.article h1`) |
| Subtítulo | `<p className={styles.articleSubtitle}>texto</p>` | `.articleSubtitle` |
| Párrafo cuerpo | `<p>texto</p>` | Auto (`.article p`) |
| **Negrita** | `<strong>texto</strong>` | Auto |
| *Cursiva* | `<em>texto</em>` | Auto |
| Link externo | `<a href="URL" target="_blank" rel="noopener noreferrer" data-domain="dominio.com">texto</a>` | Auto + tooltip |
| Link interno | `<Link href="/ruta">texto</Link>` | — |
| Blockquote / pull quote | `<div className={styles.pullquote}><p>texto</p></div>` | `.pullquote` |
| Callout / caja de aviso | `<div className={styles.highlightBox}><p>texto</p></div>` | `.highlightBox` |
| Separador fino | `<hr className={styles.divider} />` | `.divider` |
| Separador de sección | `<hr className={styles.dividerHeavy} />` | `.dividerHeavy` |
| Lista bullets | `<ul className={styles.hubList}><li>item</li></ul>` | `.hubList` |
| Lista numerada | `<ol className={styles.hubList}><li>item</li></ol>` | `.hubList` |
| Imagen inline | `<Image className={styles.heroImg} src="/assets/newsletter/post-XX-nombre.png" alt="desc" width={W} height={H} />` | `.heroImg` |
| Widget / embed | `<iframe src="/widgets/post-XX/nombre/index.html" loading="lazy" className={\`\${styles.iframe} \${styles.iframeNombre}\`} title="Descripción" />` | `.iframe` + `.iframeNombre` |
| CTA suscripción Substack | *ignorar* — no aplica en la web | — |
| Nota al pie | `<sup id="ref1"><a href="#fn1">1</a></sup>` en el texto + `<div id="fn1">…</div>` al final | ad-hoc |

### Reglas de conversión

- **Links externos**: siempre `target="_blank" rel="noopener noreferrer"` + `data-domain="dominio.com"`
- **Espacios JSX**: cuando un elemento inline está en línea separada, usar `{" "}` para el espacio
- **Comillas tipográficas**: `&ldquo;` `&rdquo;` `&lsquo;` `&rsquo;`
- **Saltos de línea**: `<br />` dentro de un bloque de texto

---

## 3. Skeleton TSX

```tsx
import type { Metadata } from "next";
import Image from "next/image";
import { createPostsClient } from "@/lib/supabase/posts-client";
import { PaywallGate } from "@/components/paywall-gate";
import styles from "../post.module.css";

const SLUG = "slug-del-post";

export const metadata: Metadata = {
  title: "TÍTULO",
  description: "DESCRIPCIÓN_CORTA",
  openGraph: {
    title: "TÍTULO — Chamillion",
    description: "DESCRIPCIÓN_CORTA",
    images: [{ url: "/assets/newsletter/banner-post-XX.jpeg" }],
  },
};

export default async function PostXX() {
  let isPremium = false;
  try {
    const db = createPostsClient();
    const { data } = await db.from("posts").select("premium").eq("slug", SLUG).single();
    isPremium = data?.premium ?? false;
  } catch {}

  const teaser = (
    <>
      {/* PRIMEROS PÁRRAFOS — visible para todos */}
      <p>...</p>
      <hr className={styles.dividerHeavy} />
    </>
  );

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

        <PaywallGate isPremium={isPremium} teaser={teaser}>
          {/* === CONTENIDO COMPLETO === */}


          {/* === FIN CONTENIDO === */}
        </PaywallGate>

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

## 4. Assets

```
public/assets/newsletter/
  banner-post-XX.jpeg       ← Banner principal (3:1, ~1568×700px, JPEG)
  post-XX-nombre.png        ← Imágenes inline del post

public/widgets/post-XX/
  nombre-widget/
    index.html
    favicon.svg
```

- El usuario proporciona el banner y las imágenes inline.
- Los widgets se crean a parte siguiendo el patrón de `widget-common.js/css`.

---

## 5. Base de datos

Añadir fila en la tabla `posts` de Supabase (prod):

| Campo | Valor |
|---|---|
| `slug` | `slug-del-post` |
| `title` | Título completo |
| `subtitle` | Subtítulo / descripción |
| `date` | `YYYY-MM-DD` |
| `banner_path` | `/assets/newsletter/banner-post-XX.jpeg` |
| `premium` | `false` / `true` |
| `published` | `false` (activar desde admin cuando esté listo) |

---

## 6. Checklist de publicación

1. Recibir screenshot completo del post en Substack
2. Confirmar: slug, número de post (XX), fecha, premium
3. Claude genera `app/newsletter/[slug]/page.tsx`
4. Usuario añade banner e imágenes en `public/assets/newsletter/`
5. Si hay widgets: crearlos en `public/widgets/post-XX/`
6. Insertar fila en tabla `posts` (published = false)
7. Verificar en `localhost:3000/newsletter/[slug]`
8. Cuando esté listo: activar `published = true` desde `/admin`

---

## 7. Referencia de CSS classes

Ver [POST_TEMPLATE.md](POST_TEMPLATE.md) §1 para el listado completo de clases disponibles en `post.module.css` (`.pullquote`, `.highlightBox`, `.hubList`, `.planBox`, `.sectionsGrid`, `.socialLink`, etc.).
