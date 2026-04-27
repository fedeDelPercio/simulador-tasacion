import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      "/api/pdf": ["./Ejemplo PDF ACM.pdf"],
    },
  },
};

export default nextConfig;
