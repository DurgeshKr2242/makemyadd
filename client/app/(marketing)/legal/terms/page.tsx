import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="29 April 2026">
      <p>
        Placeholder copy. Final terms will be reviewed by counsel before launch
        (TODO §27, T-1 week). For questions:{" "}
        <a href="mailto:hello@adcreator.in">hello@adcreator.in</a>.
      </p>

      <h2>1. Service</h2>
      <p>
        AdCreator generates advertisement creatives from product photos and
        URLs.
      </p>

      <h2>2. Account</h2>
      <p>You are responsible for the security of your account credentials.</p>

      <h2>3. Content</h2>
      <p>
        You retain ownership of the product images you upload. You grant
        AdCreator a limited licence to process them for the purpose of
        generating ads.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        No adult content, no weapons, no illegal goods, no infringing brand
        marks. We reserve the right to remove generations that violate these
        terms.
      </p>

      <h2>5. Plans &amp; billing</h2>
      <p>
        Plans are billed monthly or annually in INR via Razorpay. See{" "}
        <a href="/legal/refund">Refund policy</a>.
      </p>
    </LegalPage>
  );
}
