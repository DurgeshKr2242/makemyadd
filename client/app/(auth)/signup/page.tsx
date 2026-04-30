import type { Metadata } from "next";

import { SignupCard } from "./signup-card";

export const metadata: Metadata = {
  title: "Sign up",
};

export default function SignupPage() {
  return <SignupCard />;
}
