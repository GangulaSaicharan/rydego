import type { Metadata } from "next"
import { InstallPwaButton } from "@/components/InstallPwaButton"
import { NotificationSettings } from "@/components/NotificationSettings"
import { auth } from "@/auth"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants/brand"

export const metadata: Metadata = {
  title: "Settings",
  description: `Manage your ${APP_NAME} app settings.`,
  robots: {
    index: false,
    follow: false,
  },
}

export default async function SettingsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === "ADMIN"

  return (
    <main className="flex-1 space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage how you use the app on this device.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Install app</h3>
          <p className="text-sm text-muted-foreground">
            Add {APP_NAME} to your home screen for faster access.
          </p>
        </div>
        <InstallPwaButton className="w-full sm:w-auto" />
      </section>

      {isAdmin && (
        <section className="space-y-3 rounded-lg border bg-card p-4">
          <div>
            <h3 className="text-base font-semibold">Vehicles</h3>
            <p className="text-sm text-muted-foreground">
              Manage the vehicles you use when publishing rides.
            </p>
          </div>
          <Link
            href="/settings/vehicles"
            className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto inline-flex")}
          >
            Show vehicles
          </Link>
        </section>
      )}

      <NotificationSettings />
    </main>
  )
}

