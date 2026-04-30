/**
 * Typed transactional email sender. Each sender function below
 * encapsulates: who → what template → subject. The Resend dep is
 * lazy-loaded so routes that don't email never pay the import cost.
 *
 * Returns { ok: true } on success, { ok: false, reason } on failure
 * (caller decides whether to log/retry/swallow).
 */
import "server-only";

import { getResendClient, isResendConfigured } from "./resend";
import { WelcomeEmail } from "./templates/welcome";

const FROM = "AdCreator <noreply@adcreator.in>";

export type EmailResult =
  | { ok: true; id: string }
  | { ok: false; reason: string };

export async function sendWelcomeEmail(args: {
  to: string;
  name?: string;
}): Promise<EmailResult> {
  if (!isResendConfigured()) {
    return { ok: false, reason: "resend_not_configured" };
  }
  try {
    const resend = await getResendClient();
    const result = await resend.emails.send({
      from: FROM,
      to: args.to,
      subject: "Welcome to AdCreator",
      react: WelcomeEmail({ name: args.name }),
    });
    if (result.error) {
      return { ok: false, reason: result.error.message };
    }
    return { ok: true, id: result.data?.id ?? "unknown" };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
