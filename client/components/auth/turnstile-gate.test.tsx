import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock publicEnv before importing the SUT — Vitest hoists vi.mock.
vi.mock("@/lib/env", () => ({
  publicEnv: {
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: undefined,
  },
}));

// The Turnstile package may try to inject a script tag in tests; mock it.
vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: () => <div data-testid="turnstile-widget" />,
}));

import { TurnstileGate } from "./turnstile-gate";

describe("TurnstileGate", () => {
  it("dev-mode (no site key) renders a dev-bypass hint, no widget", () => {
    render(<TurnstileGate onVerified={() => {}} />);
    expect(screen.getByText(/Bot check is dev-bypassed/i)).toBeInTheDocument();
    expect(screen.queryByTestId("turnstile-widget")).not.toBeInTheDocument();
  });
});
