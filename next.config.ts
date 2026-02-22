import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/newsletter/post-01",
        destination: "/newsletter/navegar-las-finanzas-modernas-el-augurio-de-una-odisea",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
