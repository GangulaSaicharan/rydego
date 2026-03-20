import { APP_NAME } from "@/lib/constants/brand"

export const dynamic = "force-static"

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  )
  const sitemapUrl = `${siteUrl}/sitemap.xml`

  // Keep crawler access focused on indexable/public pages.
  // Protected user-specific pages (/login, /dashboard, /settings, etc.) are disallowed.
  // Public driver profiles remain accessible at `/profile/[userId]`.
  const body = [
    `User-agent: *`,
    `Allow: /`,
    `Disallow: /admin`,
    `Disallow: /dashboard`,
    `Disallow: /login`,
    `Disallow: /settings`,
    `Disallow: /publish`,
    `Disallow: /bookings`,
    `Disallow: /messages`,
    `Disallow: /api/`,
    `Disallow: /rides`,
    `Disallow: /profile`,
    `Disallow: /profile/edit`,
    `Allow: /rides/`,
    `Allow: /profile/`,
    `Sitemap: ${sitemapUrl}`,
    `# ${APP_NAME} SEO robots`,
    ``,
  ].join("\n")

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}

