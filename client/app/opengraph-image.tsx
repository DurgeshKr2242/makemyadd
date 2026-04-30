import { OG_CONTENT_TYPE, OG_SIZE, renderOg } from "@/lib/og/render";

export const runtime = "edge";
export const alt =
  "AdCreator — AI ads for Indian small businesses, in 30 seconds.";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  return renderOg("en");
}
