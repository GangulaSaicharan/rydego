import type { Metadata } from "next"
import { InstallPwaButton } from "@/components/InstallPwaButton"
import { NotificationSettings } from "@/components/NotificationSettings"

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your RydeGo app settings.",
}

export default function SettingsPage() {
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
            Add RydeGo to your home screen for faster access.
          </p>
        </div>
        <InstallPwaButton className="w-full sm:w-auto" />
      </section>

      <NotificationSettings />
    </main>
  )
}

