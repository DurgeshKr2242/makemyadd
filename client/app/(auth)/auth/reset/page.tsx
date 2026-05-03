import type { Metadata } from "next";

import { ResetCard } from "./reset-card";

export const metadata: Metadata = {
  title: "Set new password",
};

export default function ResetPage() {
  return <ResetCard />;
}
