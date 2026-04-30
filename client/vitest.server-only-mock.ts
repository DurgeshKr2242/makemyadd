// No-op mock for `server-only` in vitest (jsdom environment).
// The real package throws when imported outside Next.js server context.
// This file is aliased in vitest.config.ts so test files can import
// server-only modules without crashing.
export {};
