import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

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
