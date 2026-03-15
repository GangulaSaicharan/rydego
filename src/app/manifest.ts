import type { MetadataRoute } from "next";
import { APP_NAME, APP_DESCRIPTION, LOGO_URL } from "@/lib/constants/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#f8fafc",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: LOGO_URL,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: LOGO_URL,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["travel", "carpool"],
  };
}
