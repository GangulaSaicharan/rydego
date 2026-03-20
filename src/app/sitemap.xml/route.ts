import prisma from "@/lib/db"
import { RideStatus } from "@prisma/client"

export const dynamic = "force-dynamic"

function toXmlEscape(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

export async function GET() {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  )

  const now = new Date()
  const urls = new Map<string, { loc: string; lastmod?: Date }>()

  const add = (path: string, lastmod?: Date) => {
    const loc = `${siteUrl}${path.startsWith("/") ? "" : "/"}${path}`
    if (!urls.has(loc)) urls.set(loc, { loc, lastmod })
  }

  // Static/public pages
  add("/", now)
  add("/search", now)
  add("/privacy", now)
  add("/terms", now)

  // Public ride detail pages (keep sitemap small & crawler-friendly)
  const rides = await prisma.ride.findMany({
    where: {
      status: RideStatus.SCHEDULED,
      deletedAt: null,
      departureTime: { gt: now },
    },
    select: { id: true, departureTime: true },
    take: 200,
    orderBy: { departureTime: "asc" },
  })
  for (const ride of rides) {
    add(`/rides/${ride.id}`, ride.departureTime)
  }

  // Public driver profile pages (verified drivers)
  const drivers = await prisma.user.findMany({
    where: { deletedAt: null, driverProfile: { verified: true } },
    select: { id: true, updatedAt: true },
    take: 200,
    orderBy: { updatedAt: "desc" },
  })
  for (const d of drivers) {
    add(`/profile/${d.id}`, d.updatedAt)
  }

  const items = Array.from(urls.values())
  const xmlUrls = items
    .map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ""
      return `<url><loc>${toXmlEscape(u.loc)}</loc>${lastmod}</url>`
    })
    .join("")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${xmlUrls}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  })
}

