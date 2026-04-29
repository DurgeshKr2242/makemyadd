import type { Metadata } from "next";
import { DesignShowcase } from "./showcase";

export const metadata: Metadata = {
  title: "Design system",
  description:
    "Visual lock for the AdCreator design system. Tokens, typography, components, motion.",
  robots: { index: false, follow: false },
};

export default function DesignPage() {
  return <DesignShowcase />;
}
