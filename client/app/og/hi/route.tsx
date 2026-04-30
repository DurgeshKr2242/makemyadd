import { renderOg } from "@/lib/og/render";

export const runtime = "edge";

export async function GET() {
  return renderOg("hi");
}
