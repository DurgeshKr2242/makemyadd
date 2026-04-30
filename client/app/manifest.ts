import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AdCreator — AI ads for Indian small businesses",
    short_name: "AdCreator",
    description:
      "Generate professional ad creatives in Hindi, Tamil, Telugu, and English in under 30 seconds.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#0a0a14",
    theme_color: "#0a0a10",
    orientation: "portrait-primary",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["productivity", "design", "marketing"],
    lang: "en-IN",
  };
}
