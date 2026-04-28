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
  // Temporarily disable PWA in production while we debug a mobile load/redirect loop.
  // Existing service workers on devices may still remain until site data is cleared.
  disable: true,
})(nextConfig);
