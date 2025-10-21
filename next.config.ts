import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    turbo: {
      rules: {
        // 👇 Ignore Hardhat & Solidity files completely
        "contract/**/*": { loaders: ["ignore"] },
        "*.sol": { loaders: ["ignore"] },
        "artifacts/**/*": { loaders: ["ignore"] },
        "cache/**/*": { loaders: ["ignore"] },
      },
    },
  },
};

export default nextConfig;
