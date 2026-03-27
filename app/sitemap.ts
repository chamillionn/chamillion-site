import type { MetadataRoute } from "next";

const BASE = "https://chamillion.site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/newsletter`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/newsletter/como-decir-adios-a-tu-banco`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/v`, lastModified: new Date(), changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE}/widgets`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];
}
