"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Search,
  PlusCircle,
  Clock,
  MessageSquare,
  TicketCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/publish", label: "Offer", icon: PlusCircle },
  { href: "/search", label: "Search", icon: Search },
  { href: "/rides", label: "Rides", icon: Clock },
  { href: "/bookings", label: "Bookings", icon: TicketCheck },
  { href: "/messages", label: "Messages", icon: MessageSquare },
]

export function AppBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-pb"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 8px)" }}
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 min-w-[64px] flex-1 h-full rounded-lg transition-colors active:scale-95",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-[10px] font-medium tabular-nums">
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
