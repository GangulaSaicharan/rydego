"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShieldCheck, Users } from "lucide-react"

const nav = [
  { href: "/admin", label: "Overview", icon: ShieldCheck },
  { href: "/admin/users", label: "Users", icon: Users },
] as const

export function OwnerDashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 rounded-xl border bg-background/80 p-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60 md:block">
      <div className="mb-2 px-2 py-2">
        <div className="text-sm font-semibold tracking-tight">Owner dashboard</div>
        <div className="text-xs text-muted-foreground">Admin tools & controls</div>
      </div>

      <nav className="space-y-1">
        {nav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="mt-4 border-t pt-3">
        <Link
          href="/dashboard"
          className="block rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Back to app
        </Link>
      </div>
    </aside>
  )
}

