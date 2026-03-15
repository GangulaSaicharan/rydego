import { APP_NAME, APP_DESCRIPTION, LOGO_URL } from "@/lib/constants/brand"
import type { MetadataRoute } from "next"

/** Serves the web app manifest as JSON. Path /manifest.json avoids Next.js manifest.webmanifest conflict. */
export function GET() {
  const manifest: MetadataRoute.Manifest = {
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
      { src: LOGO_URL, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: LOGO_URL, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    categories: ["travel", "carpool"],
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}
