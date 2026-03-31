const BASE = "https://chamillion.site";

interface Props {
  title: string;
  description: string;
  slug: string;
  date: string;
  bannerPath?: string;
}

export default function PostJsonLd({ title, description, slug, date, bannerPath }: Props) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${BASE}/newsletter/${slug}`,
    datePublished: date,
    image: bannerPath ? `${BASE}${bannerPath}` : `${BASE}/og-image.jpg`,
    author: {
      "@type": "Person",
      name: "Chamillion",
      url: "https://x.com/chamillion__",
    },
    publisher: {
      "@type": "Organization",
      name: "Chamillion",
      url: BASE,
    },
    inLanguage: "es",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
