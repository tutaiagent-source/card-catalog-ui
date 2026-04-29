import type { NextConfig } from "next";

// next-pwa has no bundled TypeScript types in this setup, so we require it.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const withPWA = require("next-pwa");

const nextConfig: NextConfig = {
  turbopack: {},
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  register: false,
  skipWaiting: true,
  // Hard-disable next-pwa in production while we eliminate iOS/Chrome
  // service worker navigation loop issues.
  disable: true,
})(nextConfig);
