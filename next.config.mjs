/** @type {import('next').NextConfig} */

// Dev proxy: the browser calls this app's own origin at `/api/*` and Next forwards
// to the TryBuy Gateway. This keeps the session cookie first-party (same-site) and
// avoids CORS-with-credentials config. The gateway stays the ONLY backend reached
// (see .ai/context/data-fetching.md); GHN is never called directly.
//
// Target origin comes from API_PROXY_TARGET (server-only env, not exposed to the
// browser). Default matches the local gateway.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? "http://localhost:3000";

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_TARGET}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
