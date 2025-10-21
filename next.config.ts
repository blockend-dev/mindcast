import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        "contract/**/*": { loaders: ["ignore"] },
        "*.sol": { loaders: ["ignore"] },
        "artifacts/**/*": { loaders: ["ignore"] },
        "cache/**/*": { loaders: ["ignore"] },
      },
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
};

export default nextConfig;
