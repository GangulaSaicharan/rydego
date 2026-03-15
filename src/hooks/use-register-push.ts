"use client"

import { useEffect, useRef } from "react"
import { getFirebaseApp, getFirebaseConfig } from "@/lib/firebase-client"

const LOG_PREFIX = "[FCM]"

/**
 * Registers the current device for FCM push notifications when the user is logged in.
 * Call from dashboard layout so it runs on any authenticated page.
 * Requires NEXT_PUBLIC_FIREBASE_* (including VAPID_KEY) and firebase-messaging-sw.js in public.
 */
export function useRegisterPush() {
  const done = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || done.current) return

    const config = getFirebaseConfig()
    if (!config) {
      console.warn(LOG_PREFIX, "Skipped: missing Firebase env (NEXT_PUBLIC_FIREBASE_*)")
      return
    }
    if (!config.vapidKey) {
      console.warn(LOG_PREFIX, "Skipped: missing NEXT_PUBLIC_FIREBASE_VAPID_KEY")
      return
    }

    let cancelled = false
    done.current = true

    async function register() {
      try {
        const { app } = await getFirebaseApp()
        if (!app) return

        const { getMessaging, isSupported, getToken } = await import("firebase/messaging")

        const supported = await isSupported()
        if (!supported || cancelled) {
          if (!supported) console.warn(LOG_PREFIX, "Skipped: FCM not supported (e.g. not HTTPS or insecure context)")
          return
        }

        if (typeof Notification !== "undefined") {
          if (Notification.permission === "denied") {
            console.warn(LOG_PREFIX, "Skipped: notification permission denied")
            return
          }
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission()
            if (permission !== "granted" || cancelled) {
              if (permission !== "granted") console.warn(LOG_PREFIX, "Skipped: notification permission not granted")
              return
            }
          }
        }

        const messaging = getMessaging(app)
        const token = await getToken(messaging, { vapidKey: config!.vapidKey })
        if (!token || cancelled) {
          if (!token) console.warn(LOG_PREFIX, "Skipped: getToken returned no token")
          return
        }

        const res = await fetch("/api/notifications/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
          credentials: "same-origin",
        })
        if (!res.ok && res.status !== 401) {
          console.warn(LOG_PREFIX, "Register API failed:", res.status, await res.text())
          return
        }
        console.info(LOG_PREFIX, "Token registered")
      } catch (err) {
        console.warn(LOG_PREFIX, "Registration failed:", err)
      }
    }

    register()
    return () => {
      cancelled = true
    }
  }, [])
}
