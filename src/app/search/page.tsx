import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { MapPin, Settings as SettingsIcon } from "lucide-react"
import { auth } from "@/auth"
import { isSuperAdmin } from "@/lib/super-admin"
import { RideSearchForm } from "@/components/rides/RideSearchForm"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"
import { HeaderUserMenu } from "@/components/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"

const HeaderNotifications = dynamic(() =>
  import("@/components/header-notifications").then((m) => m.HeaderNotifications),
)

export const metadata: Metadata = {
  title: "Find a Ride",
  description:
    `Search for rides by route and date. Share trips and save with ${APP_NAME}.`,
  alternates: {
    canonical: "/search",
  },
}

export default async function SearchPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"
  const isOwner = session ? isSuperAdmin(session) : false
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
                <HeaderNotifications />
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
                href="/login"
                className="px-3 py-1.5 text-sm font-medium rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 min-h-0 flex flex-col items-center p-4 pb-20 pt-3 md:p-6 md:pb-6 md:pt-4">
          {/* Short hero */}
          <section className="w-full max-w-3xl mx-auto relative overflow-hidden rounded-xl md:rounded-2xl mb-6 shadow-lg ring-1 ring-black/5">
            <div className="absolute inset-0 bg-linear-to-br from-[#0f766e] via-[#0d9488] to-[#059669]" />
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 text-white">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight md:text-xl">
                  Find a ride
                </h1>
                <p className="text-white/85 text-xs md:text-sm">
                  Share trips, save money.
                </p>
              </div>
            </div>
          </section>

          {/* Centered search */}
          <div className="w-full max-w-3xl mx-auto space-y-6">
            <RideSearchForm />
          </div>
        </main>
      </SidebarInset>
      <AppBottomNav isAdmin={isAdmin} />
    </SidebarProvider>
  )
}

