import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

export interface WelcomeEmailProps {
  /** First name or full name. Falls back to "there". */
  name?: string;
  /** Where the CTA points — defaults to /dashboard. */
  ctaUrl?: string;
}

export function WelcomeEmail({
  name,
  ctaUrl = "https://adcreator.in/dashboard",
}: WelcomeEmailProps) {
  const greeting = name ? `Hi ${name}` : "Hey there";
  return (
    <Html>
      <Head />
      <Preview>
        Welcome to AdCreator — make your first ad in 30 seconds.
      </Preview>
      <Tailwind>
        <Body className="bg-[#0a0a14] font-sans">
          <Container className="mx-auto my-10 max-w-[560px] rounded-2xl border border-white/[0.08] bg-[#15151c] p-8">
            <Heading className="m-0 text-3xl font-medium tracking-tight text-white">
              {greeting},
            </Heading>
            <Text className="mt-4 text-[15px] leading-7 text-[#a1a1aa]">
              Welcome to AdCreator. You can now generate professional ad
              creatives in Hindi, Tamil, Telugu, or English — drop a product
              photo, pick a language, get three ready-to-share variants in 30
              seconds.
            </Text>
            <Section className="mt-8">
              <Button
                href={ctaUrl}
                className="rounded-lg bg-[#FF7A2E] px-6 py-3 text-sm font-medium text-[#1a0e02]"
              >
                Make my first ad
              </Button>
            </Section>
            <Text className="mt-10 text-[13px] leading-5 text-[#71717a]">
              Five free generations on us. No card required. Upgrade anytime
              from{" "}
              <Link
                href="https://adcreator.in/billing"
                className="text-[#FF7A2E] underline-offset-4 hover:underline"
              >
                Billing
              </Link>
              .
            </Text>
            <Text className="mt-8 text-[12px] text-[#52525b]">
              Made in India · adcreator.in
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}

export default WelcomeEmail;
