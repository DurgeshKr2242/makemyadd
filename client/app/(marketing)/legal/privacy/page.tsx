import type { Metadata } from "next";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="29 April 2026">
      <p>
        Placeholder copy. Will be finalised before launch (TODO §27). Designed
        to comply with India's DPDP Act 2023.
      </p>

      <h2>What we collect</h2>
      <p>
        Email, name, product images you upload, and usage analytics. No payment
        card data — that flows through Razorpay only.
      </p>

      <h2>Sub-processors</h2>
      <p>
        Supabase (auth + database), Cloudflare R2 (image storage), Groq (ad copy
        generation), HuggingFace (background removal), Razorpay (billing),
        Resend (transactional email), Sentry (error monitoring), PostHog
        (product analytics).
      </p>

      <h2>Data retention</h2>
      <p>
        Generations are retained for 90 days. Account deletion removes all your
        data within 30 days of request, in line with the DPDP Act.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions:{" "}
        <a href="mailto:privacy@adcreator.in">privacy@adcreator.in</a>.
      </p>
    </LegalPage>
  );
}
