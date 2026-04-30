/**
 * Next.js runtime instrumentation. Loaded automatically by the framework
 * before the app boots — wires Sentry across both Node and Edge runtimes.
 *
 * Each runtime imports its own config module so the unused SDK never
 * ships in the wrong environment.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export { captureRequestError as onRequestError } from "@sentry/nextjs";
