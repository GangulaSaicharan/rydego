import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import { Settings } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { HeaderUserMenu } from "@/components/header-user-menu"
import { AddMobileModal } from "@/components/add-mobile-modal"
import { InstallPwaLoginPrompt } from "@/components/InstallPwaLoginPrompt"
import { Separator } from "@/components/ui/separator"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const HeaderNotifications = dynamic(() =>
  import("@/components/header-notifications").then(
    (m) => m.HeaderNotifications,
  ),
)

const PushRegistration = dynamic(() =>
  import("@/components/push-registration").then(
    (m) => m.PushRegistration,
  ),
)

const AppBottomNav = dynamic(() =>
  import("@/components/app-bottom-nav").then(
    (m) => m.AppBottomNav,
  ),
)

import { auth } from "@/auth"
import { isSuperAdmin } from "@/lib/super-admin"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const isAdmin = session.user.role === "ADMIN"
  const isOwner = isSuperAdmin(session)

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true },
  })
  const hasPhone = !!dbUser?.phone

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} isAdmin={isAdmin} isSuperAdmin={isOwner} />
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
            <HeaderNotifications />
            <Link
              href="/settings"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:h-10 md:w-10"
              aria-label="Settings"
            >
              <Settings className="h-4 w-4 md:h-5 md:w-5" />
            </Link>
            <HeaderUserMenu user={session.user} />
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-20 pt-3 md:p-6 md:pb-6 md:pt-4">
          <PushRegistration />
          <AddMobileModal hasPhone={hasPhone} />
          <InstallPwaLoginPrompt />
          {children}
        </main>
      </SidebarInset>
      <AppBottomNav isAdmin={isAdmin} />
    </SidebarProvider>
  )
}
