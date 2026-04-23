import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      // Raise from 1 MB default to 10 MB so banner uploads go through.
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/widgets/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/newsletter/post-01",
        destination: "/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      { source: "/w/orderbook", destination: "/widgets/post-01/orderbook-patatas/index.html" },
      { source: "/w/esma", destination: "/widgets/post-01/retail-vs-inst-esma/index.html" },
      { source: "/w/stablecoins", destination: "/widgets/post-01/stablecoins-mcap/index.html" },
      { source: "/w/compound", destination: "/widgets/compound-interest/index.html" },
    ];
  },
};

export default nextConfig;
