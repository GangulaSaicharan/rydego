import type { Metadata } from "next"
import { InstallPwaButton } from "@/components/InstallPwaButton"

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
          Manage how you use RydeGo on this device.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border bg-card p-4">
        <div>
          <h3 className="text-base font-semibold">Install app</h3>
          <p className="text-sm text-muted-foreground">
            Add RydeGo to your home screen for a faster, app-like experience.
          </p>
        </div>
        <InstallPwaButton className="w-full sm:w-auto" />
        <p className="text-xs text-muted-foreground">
          This option appears when your browser supports installing the app and it is not already installed.
        </p>
      </section>
    </main>
  )
}

