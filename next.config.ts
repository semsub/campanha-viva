import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removemos o 'output: export' para permitir rotas e fetch dinâmico sem travar nas APIs
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
