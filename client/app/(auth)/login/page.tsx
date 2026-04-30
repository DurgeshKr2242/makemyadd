import type { Metadata } from "next";

import { LoginCard } from "./login-card";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return <LoginCard />;
}
