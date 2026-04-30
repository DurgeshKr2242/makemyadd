/**
 * Content-Security-Policy builder.
 *
 * Returns the header value as a single string. Keep one source of truth
 * here so env-conditional hosts (e.g. PostHog ingestion endpoint) are
 * easy to flip.
 *
 * Notes on the choices below:
 *
 *   - `'unsafe-inline'` on script-src IS currently allowed. Next.js's
 *     App Router emits inline scripts for the RSC payload + hydration
 *     bootstrap — without 'unsafe-inline' those scripts are blocked,
 *     React never hydrates client components, and (in our case)
 *     FabricCanvas never mounts → the canvas stays a zero-size element.
 *     The proper fix is nonce-based CSP via middleware (TODO §21
 *     follow-up): generate a per-request nonce, inject into the
 *     `script-src` directive + onto every Next inline script. That
 *     refactor warrants its own focused PR + per-language E2E to
 *     confirm hydration still works under the strict CSP. Until then,
 *     'unsafe-inline' is the practical choice — most production Next.js
 *     apps run with this same exception.
 *   - `'unsafe-inline'` on style-src is allowed because Tailwind v4 +
 *     Fabric.js + Sentry replay all inject inline styles dynamically.
 *     Locking this down requires a Tailwind-emit-nonce plugin we don't
 *     have yet. Acceptable trade — inline styles are not an XSS vector.
 *   - `data:` allowed on img-src because we use SVG data URLs for
 *     placeholder images + dashboard upload previews use blob: URLs.
 *   - `https://challenges.cloudflare.com` for Turnstile widget (loads
 *     when user signs up).
 *   - `https://checkout.razorpay.com` for the payment Checkout iframe
 *     (loads on /billing → upgrade flow).
 *   - PostHog + Sentry CDN hosts so the SDK can fetch its own assets.
 */
export interface CspOptions {
  /** Disable HSTS-style strictness in development for hot reload + Next
   *  dev tooling that injects scripts. Always strict in production. */
  isDev: boolean;
}

const SENTRY_HOSTS = [
  "https://*.sentry.io",
  "https://*.ingest.sentry.io",
  "https://*.ingest.us.sentry.io",
];

const POSTHOG_HOSTS = [
  "https://us.i.posthog.com",
  "https://eu.i.posthog.com",
  "https://app.posthog.com",
];

const RAZORPAY_HOSTS = [
  "https://checkout.razorpay.com",
  "https://api.razorpay.com",
];

const TURNSTILE_HOSTS = ["https://challenges.cloudflare.com"];

const FONT_HOSTS = [
  "https://fonts.googleapis.com",
  "https://fonts.gstatic.com",
];

const R2_HOSTS = ["https://assets.adcreator.in"];

const SUPABASE_HOSTS = ["https://*.supabase.co", "wss://*.supabase.co"];

export function buildCsp({ isDev }: CspOptions): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      // Required for Next.js App Router inline hydration scripts. See
      // the file-header comment for the nonce-refactor TODO.
      "'unsafe-inline'",
      ...RAZORPAY_HOSTS,
      ...TURNSTILE_HOSTS,
      ...POSTHOG_HOSTS,
      // Vercel preview / production bundles
      "https://va.vercel-scripts.com",
      // Dev additionally needs eval for Next.js HMR + React Refresh
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      ...R2_HOSTS,
      ...SUPABASE_HOSTS,
      // Sentry / PostHog occasionally inline images for badges
      "https:",
    ],
    "font-src": ["'self'", "data:", ...FONT_HOSTS],
    "connect-src": [
      "'self'",
      ...SENTRY_HOSTS,
      ...POSTHOG_HOSTS,
      ...SUPABASE_HOSTS,
      ...RAZORPAY_HOSTS,
      // Edge OG image renderer fetches Geist woff2 from gstatic at request time
      "https://fonts.gstatic.com",
      // Cheerio scrape hits arbitrary HTTPS hosts — but server-side, not
      // browser. The browser-side connect-src doesn't apply to fetch from
      // Route Handlers, so we don't need to allow * here.
    ],
    "frame-src": ["'self'", ...RAZORPAY_HOSTS, ...TURNSTILE_HOSTS],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
    "upgrade-insecure-requests": [],
  };

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length > 0 ? `${key} ${values.join(" ")}` : key,
    )
    .join("; ");
}
