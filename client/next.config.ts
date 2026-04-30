import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { buildCsp } from "./lib/security/csp";

const isDev = process.env.NODE_ENV !== "production";

const SECURITY_HEADERS = [
  // Strict-Transport-Security is best set at the CDN edge (Cloudflare /
  // Vercel) for the apex domain only. Skipping here to avoid double-set.
  {
    key: "Content-Security-Policy",
    value: buildCsp({ isDev }),
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    // Belt-and-suspenders with frame-ancestors 'none' above. Some old
    // browsers ignore CSP frame-ancestors.
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "interest-cohort=()",
      "browsing-topics=()",
    ].join(", "),
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  // Image domains we trust to render via next/image. Keep tight; add when
  // we wire R2 + Supabase Storage.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "assets.adcreator.in" },
    ],
  },
  // sharp / fabric / @huggingface live outside the bundler; let Next know.
  serverExternalPackages: ["sharp"],
  async headers() {
    return [
      {
        // Apply to every route except statically-cached assets which Next
        // serves with their own Cache-Control. Headers still apply to .js
        // bundles (good — CSP needs to reach them).
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

// Sentry wrap is a no-op when SENTRY_AUTH_TOKEN / org / project aren't set.
// Source-map upload only fires in CI with the auth token.
const sentryWebpackOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Hide the source map files from the public bundle so they're upload-only.
  hideSourceMaps: true,
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryWebpackOptions);
