import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/auth"
import { isSuperAdmin } from "@/lib/super-admin"
import prisma from "@/lib/db"
import { notFound } from "next/navigation"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"
import { HeaderUserMenu } from "@/components/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"
import { Settings as SettingsIcon } from "lucide-react"
import { getRideDetailAction } from "@/lib/actions/ride"
import { RideDetailsContent } from "@/components/rides/RideDetailsContent"

export const dynamic = "force-dynamic"

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  )

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    fromLocationId?: string
    toLocationId?: string
    date?: string
    sort?: string
    priceMin?: string
    priceMax?: string
    seatsNeeded?: string
  }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      fromLocation: { select: { city: true } },
      toLocation: { select: { city: true } },
    },
  })
  if (!ride) return { title: "Ride" }
  const route = `${ride.fromLocation.city} → ${ride.toLocation.city}`
  const canonical = `/rides/${id}`
  return {
    title: `Ride: ${route}`,
    description: `View ride details: ${route}. Date & time, driver, price on ${APP_NAME}.`,
    alternates: {
      canonical,
    },
    openGraph: {
      title: `Ride: ${route}`,
      description: `View ride details on ${APP_NAME}`,
      images: [
        {
          url: `${SITE_URL}/og.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary",
      images: [`${SITE_URL}/og.png`],
    },
  }
}

export default async function RideDetailPage({ params, searchParams }: Props) {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"
  const isOwner = session ? isSuperAdmin(session) : false

  const { id } = await params
  const sp = await searchParams
  const backToSearch = (() => {
    if (!(sp?.fromLocationId && sp?.toLocationId && sp?.date)) return "/rides"
    const q = new URLSearchParams()
    q.set("fromLocationId", sp.fromLocationId)
    q.set("toLocationId", sp.toLocationId)
    q.set("date", sp.date)
    if (sp.sort) q.set("sort", sp.sort)
    if (sp.priceMin) q.set("priceMin", sp.priceMin)
    if (sp.priceMax) q.set("priceMax", sp.priceMax)
    if (sp.seatsNeeded) q.set("seatsNeeded", sp.seatsNeeded)
    return `/search?${q.toString()}`
  })()

  const result = await getRideDetailAction(id)
  if (!result.success || !result.ride) notFound()

  const isLoggedIn = !!session?.user
  const sidebarUser =
    session?.user ?? {
      name: "Guest",
      email: "Sign in to save trips",
      image: null,
    }

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} isAdmin={isAdmin} isSuperAdmin={isOwner} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 md:h-16 md:gap-4 md:px-6">
          <span className="hidden md:inline-flex">
            <SidebarTrigger className="-ml-1 size-9 rounded-md hover:bg-accent hover:text-accent-foreground" />
          </span>
          <Separator
            orientation="vertical"
            className="mr-1 hidden h-5 shrink-0 opacity-60 md:mr-2 md:block"
          />
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src={LOGO_URL}
              alt={APP_NAME}
              width={32}
              height={32}
              className="size-8 object-contain md:size-9"
            />
            <span className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              {APP_NAME}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/settings"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:h-10 md:w-10"
                  aria-label="Settings"
                >
                  <SettingsIcon className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
                <HeaderUserMenu user={session.user} />
              </>
            ) : (
              <Link
                href={`/login?${new URLSearchParams({
                  callbackUrl: `/rides/${id}`,
                }).toString()}`}
                className="px-3 py-1.5 text-sm font-medium rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-20 pt-3 md:p-6 md:pb-6 md:pt-4">
          <RideDetailsContent
            {...result}
            userId={session?.user?.id}
            backUrl={backToSearch}
          />
        </main>
      </SidebarInset>
      <AppBottomNav isAdmin={isAdmin} />
    </SidebarProvider>
  )
}
