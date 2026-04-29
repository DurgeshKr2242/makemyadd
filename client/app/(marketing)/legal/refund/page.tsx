import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Refund &amp; Cancellation Policy",
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund & Cancellation Policy" updated="29 April 2026">
      <p>
        Placeholder copy. Required by Razorpay onboarding. Will be reviewed
        before live keys are activated (TODO §27).
      </p>

      <h2>Cancellation</h2>
      <p>
        You can cancel your subscription anytime from{" "}
        <a href="/billing">Billing</a>. Cancellation takes effect at the end of
        your current billing period — you keep access until then.
      </p>

      <h2>Refunds</h2>
      <p>
        Subscription fees are non-refundable mid-cycle. If you experience a
        technical issue that prevents you from generating ads, contact{" "}
        <a href="mailto:support@adcreator.in">support@adcreator.in</a> and we'll
        investigate within 2 business days.
      </p>

      <h2>Failed payments</h2>
      <p>
        After a failed payment, your subscription enters a 7-day grace period.
        If payment is not recovered, your plan is downgraded to Free.
      </p>
    </LegalPage>
  );
}
