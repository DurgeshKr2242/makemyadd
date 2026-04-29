import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Shipping Policy",
};

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping Policy" updated="29 April 2026">
      <p>
        AdCreator is a digital service. There is no physical product to ship.
      </p>
      <p>
        Generated ad images are delivered instantly through your browser when
        you click "Download" — they are not emailed, posted, or otherwise
        dispatched.
      </p>
      <p>
        This page exists to satisfy Razorpay's onboarding requirements for
        Indian merchants. For anything else:{" "}
        <a href="mailto:support@adcreator.in">support@adcreator.in</a>.
      </p>
    </LegalPage>
  );
}
