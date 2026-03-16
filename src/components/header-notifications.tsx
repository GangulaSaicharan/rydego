"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button, buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatRelativeTimeIST, formatDateLabelIST } from "@/lib/date-time"

type NotificationItem = {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

type NotificationsResponse = {
  notifications: NotificationItem[]
  unreadCount: number
  nextCursor: string | null
}

function groupByDate(notifications: NotificationItem[]): Map<string, NotificationItem[]> {
  const map = new Map<string, NotificationItem[]>()
  for (const n of notifications) {
    const label = formatDateLabelIST(n.createdAt)
    const list = map.get(label) ?? []
    list.push(n)
    map.set(label, list)
  }
  const order = ["Today", "Yesterday"]
  const sorted = new Map<string, NotificationItem[]>()
  for (const label of order) {
    const list = map.get(label)
    if (list) sorted.set(label, list)
  }
  for (const [label, list] of map) {
    if (!sorted.has(label)) sorted.set(label, list)
  }
  return sorted
}

export function HeaderNotifications() {
  const [data, setData] = useState<NotificationsResponse | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const loadMoreRef = useRef<HTMLLIElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = useCallback(async (cursor?: string | null) => {
    const isAppend = !!cursor
    if (isAppend) setLoadingMore(true)
    else setLoading(true)
    try {
      const url = cursor
        ? `/api/notifications?cursor=${encodeURIComponent(cursor)}`
        : "/api/notifications"
      const res = await fetch(url)
      if (res.ok) {
        const json: NotificationsResponse = await res.json()
        setData((prev) => {
          if (!isAppend || !prev) return json
          return {
            notifications: [...prev.notifications, ...json.notifications],
            unreadCount: json.unreadCount,
            nextCursor: json.nextCursor,
          }
        })
      }
    } finally {
      if (isAppend) setLoadingMore(false)
      else setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setData(null)
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  useEffect(() => {
    if (!open || !data?.nextCursor || loadingMore) return
    const root = scrollContainerRef.current
    const el = loadMoreRef.current
    if (!root || !el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) fetchNotifications(data.nextCursor)
      },
      { root, rootMargin: "100px", threshold: 0 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [open, data?.nextCursor, loadingMore, fetchNotifications])

  const markRead = useCallback(async (id: string) => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok && data)
        setData({
          ...data,
          notifications: data.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, data.unreadCount - 1),
        })
    } catch {
      // ignore
    }
  }, [data])

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      })
      if (res.ok && data)
        setData({
          ...data,
          notifications: data.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        })
    } catch {
      // ignore
    }
  }, [data])

  const unreadCount = data?.unreadCount ?? 0
  const notifications = data?.notifications ?? []
  const grouped = groupByDate(notifications)

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "relative h-9 w-9 shrink-0 rounded-full md:h-10 md:w-10"
        )}
      >
        <Bell className="h-4 w-4 md:h-5 md:w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] md:-right-1 md:-top-1"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(calc(100vw-2rem),24rem)] p-0" sideOffset={8}>
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={markAllRead}
            >
              <CheckCheck className="h-5 w-5" />
              Mark all read
            </Button>
          )}
        </div>
        <div
          ref={scrollContainerRef}
          className="max-h-[min(20rem,60vh)] overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
              No notifications yet
            </div>
          ) : (
            <ul className="py-1">
              {Array.from(grouped.entries()).flatMap(([dateLabel, items]) => [
                <li key={`h-${dateLabel}`}>
                  <div className="sticky top-0 z-10 bg-popover px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {dateLabel}
                  </div>
                </li>,
                ...items.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full cursor-pointer px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none",
                        !n.read && "bg-muted/50"
                      )}
                      onClick={() => markRead(n.id)}
                    >
                      <p className={cn("font-medium", !n.read && "text-foreground")}>
                        {n.title}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {formatRelativeTimeIST(n.createdAt)}
                      </p>
                    </button>
                  </li>
                )),
              ])}
              {data?.nextCursor && (
                <li ref={loadMoreRef} className="flex justify-center py-2">
                  {loadingMore && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </li>
              )}
            </ul>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
