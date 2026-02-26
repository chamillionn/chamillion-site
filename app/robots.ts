import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/login", "/api", "/auth"],
    },
    sitemap: "https://chamillion.site/sitemap.xml",
  };
}
