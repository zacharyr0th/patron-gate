import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Exclude test files from bundling
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    config.module.rules.push({
      test: /node_modules\/.*\/test\//,
      use: "null-loader",
    });

    return config;
  },
  reactStrictMode: true,
  transpilePackages: ["@repo/ui", "@repo/database", "@repo/storage"],
  serverExternalPackages: ["pino", "thread-stream", "x402a"],
};

export default nextConfig;
