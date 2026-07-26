import type { NextConfig } from "next";

/**
 * Resolve the real backend origin (for the rewrite).
 *
 * - If NEXT_PUBLIC_API_BASE_URL is a full URL like `http://localhost:3001/api/v1`,
 *   strip `/api/v1` to get the origin `http://localhost:3001`.
 * - If it's relative like `/api`, fall back to the default `http://localhost:3001`.
 *   (The Next.js rewrite will proxy `/api/v1/*` to the real backend.)
 */
const API_TARGET = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";
const API_ORIGIN = API_TARGET.startsWith("http")
  ? API_TARGET.replace(/\/api\/v\d+\/?$/, "")
  : "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "@tanstack/react-table",
      "recharts",
    ],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Proxy /api/* → <backend>/api/v1/*. Same-origin in the browser, no CORS.
  //
  // We support two URL shapes for the apiClient:
  //   1. `/api/v1/auth/login`  — full versioned path
  //   2. `/api/auth/login`      — unversioned (apiClient prepends `/api` from NEXT_PUBLIC_API_BASE_URL)
  // Both rewrite to the real backend at `${API_ORIGIN}/api/v1/auth/login`.
  async rewrites() {
    return [
      // Versioned: /api/v1/:path* → backend /api/v1/:path*
      {
        source: "/api/v1/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
      // Unversioned: /api/:path* → backend /api/v1/:path* (insert v1)
      {
        source: "/api/:path*",
        destination: `${API_ORIGIN}/api/v1/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
