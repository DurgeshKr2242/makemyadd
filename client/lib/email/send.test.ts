import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the Resend module + the env helper before importing the SUT
vi.mock("./resend", () => ({
  isResendConfigured: vi.fn(),
  getResendClient: vi.fn(),
}));

import { getResendClient, isResendConfigured } from "./resend";
import { sendWelcomeEmail } from "./send";

describe("sendWelcomeEmail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("short-circuits when resend isn't configured", async () => {
    vi.mocked(isResendConfigured).mockReturnValue(false);
    const result = await sendWelcomeEmail({ to: "user@example.in" });
    expect(result).toEqual({ ok: false, reason: "resend_not_configured" });
    expect(getResendClient).not.toHaveBeenCalled();
  });

  it("returns ok:true on successful send", async () => {
    vi.mocked(isResendConfigured).mockReturnValue(true);
    vi.mocked(getResendClient).mockResolvedValue({
      emails: {
        send: vi
          .fn()
          .mockResolvedValue({ data: { id: "msg_123" }, error: null }),
      },
    } as never);

    const result = await sendWelcomeEmail({
      to: "user@example.in",
      name: "Sundar",
    });
    expect(result).toEqual({ ok: true, id: "msg_123" });
  });

  it("returns ok:false with reason on Resend error", async () => {
    vi.mocked(isResendConfigured).mockReturnValue(true);
    vi.mocked(getResendClient).mockResolvedValue({
      emails: {
        send: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "rate_limited" },
        }),
      },
    } as never);

    const result = await sendWelcomeEmail({ to: "user@example.in" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("rate_limited");
  });

  it("catches thrown errors and surfaces as ok:false", async () => {
    vi.mocked(isResendConfigured).mockReturnValue(true);
    vi.mocked(getResendClient).mockRejectedValue(new Error("network"));

    const result = await sendWelcomeEmail({ to: "user@example.in" });
    expect(result).toEqual({ ok: false, reason: "network" });
  });
});
