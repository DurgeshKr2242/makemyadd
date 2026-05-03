import type { Metadata } from "next";

import { ForgotCard } from "./forgot-card";

export const metadata: Metadata = {
  title: "Reset password",
};

export default function ForgotPage() {
  return <ForgotCard />;
}
