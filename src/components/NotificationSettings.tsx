"use client"

import { useCallback, useState } from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { APP_NAME } from "@/lib/constants/brand"

function isIOS() {
  if (typeof navigator === "undefined") return false
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function NotificationSettings() {
  const [mounted, setMounted] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [ios, setIos] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    setMounted(true)
    setIos(isIOS())
    if (!("Notification" in window)) {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [])

  const handleEnable = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return
    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result === "granted") {
        window.dispatchEvent(new Event("app:notification-permission-granted"))
      }
    } catch {
      // ignore
    }
  }, [])

  const showEnableButton = !mounted || permission === "default"
  const blocked = mounted && permission === "denied"
  const enabled = mounted && permission === "granted"

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h3 className="text-base font-semibold">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Get alerts about bookings, ride updates, and messages.
        </p>
      </div>

      {showEnableButton && (
        <Button
          type="button"
          onClick={handleEnable}
          className="w-full sm:w-auto"
        >
          Enable notifications
        </Button>
      )}

      {enabled && (
        <p className="text-xs text-green-600">
          Notifications are enabled on this device. You&apos;ll receive updates for rides and bookings.
        </p>
      )}

      {blocked && !ios && (
        <p className="text-xs text-destructive">
          Notifications are blocked in your browser. To enable, open your browser settings and allow notifications for this site.
        </p>
      )}

      {blocked && ios && (
        <p className="text-xs text-destructive">
          Notifications are blocked. In Safari, open this site, tap the &quot;AA&quot; / website settings in the address
          bar, choose &quot;Notifications&quot;, and allow notifications for this site.
        </p>
      )}

      {mounted && permission === "unsupported" && (
        <p className="text-xs text-muted-foreground">
          Notifications are not supported in this browser on this device.
        </p>
      )}

      {mounted && ios && (
        <p className="text-xs text-muted-foreground">
          On iPhone/iPad, make sure you open {APP_NAME} in Safari and add it to your Home Screen to receive push notifications.
        </p>
      )}
    </section>
  )
}

