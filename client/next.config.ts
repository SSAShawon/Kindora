import type { NextConfig } from "next";

/**
 * The browser always talks to the Next.js origin via relative /api URLs.
 * Next proxies those requests to the Express API, which keeps cookies
 * same-origin in development (sandbox previews) and in production.
 *
 * Set API_PROXY_TARGET to the deployed API URL on Vercel, e.g.
 *   API_PROXY_TARGET=https://kindora-api.onrender.com
 */
const apiTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: ["*.e2b.app"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiTarget}/api/:path*` }];
  },
};

export default nextConfig;
