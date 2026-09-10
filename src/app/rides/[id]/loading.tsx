import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"
import { RideDetailsSkeleton } from "@/components/rides/ListSkeletons"

export default function LoadingRideDetails() {
  const guestUser = { name: "Loading...", email: "Loading...", image: null }
  return (
    <SidebarProvider>
      <AppSidebar user={guestUser} isAdmin={false} isSuperAdmin={false} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 md:h-16 md:gap-4 md:px-6">
          <span className="hidden md:inline-flex">
            <SidebarTrigger className="-ml-1 size-9 rounded-md hover:bg-accent hover:text-accent-foreground" />
          </span>
          <Separator
            orientation="vertical"
            className="mr-1 hidden h-5 shrink-0 opacity-60 md:mr-2 md:block"
          />
          <div className="flex items-center gap-2 rounded-md">
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
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-20 pt-3 md:p-6 md:pb-6 md:pt-4">
          <RideDetailsSkeleton />
        </main>
      </SidebarInset>
      <AppBottomNav isAdmin={false} />
    </SidebarProvider>
  )
}
