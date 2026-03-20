"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { getFirebaseApp, getFirebaseConfig } from "@/lib/firebase-client"
import { toast } from "sonner"
import { LOGO_URL } from "@/lib/constants/brand"

const LOG_PREFIX = "[FCM]"

/** Log a message that helps debug production (visible in browser DevTools). */
function log(reason: string, detail?: unknown) {
  if (typeof window !== "undefined") {
    if (detail !== undefined) {
      console.warn(LOG_PREFIX, reason, detail)
    } else {
      console.warn(LOG_PREFIX, reason)
    }
  }
}

/**
 * Registers the current device for FCM push when the user is logged in.
 * Call from dashboard layout. Requires firebase-messaging-sw.js in public and NEXT_PUBLIC_FIREBASE_VAPID_KEY.
 * Production: use HTTPS; set env in build; serve /firebase-messaging-sw.js at app origin.
 */
export function useRegisterPush() {
  const { status } = useSession()
  const done = useRef(false)
  const registered = useRef(false)
  const firebaseAppRef = useRef<import("firebase/app").FirebaseApp | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    // Reset so each new sign-in (e.g. new account) runs registration and can prompt for permission
    if (status !== "authenticated") {
      done.current = false
      return
    }
    if (done.current) return

    const config = getFirebaseConfig()
    if (!config) {
      log("Skipped: missing Firebase env (NEXT_PUBLIC_FIREBASE_*)")
      return
    }
    if (!process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
      log("Skipped: missing NEXT_PUBLIC_FIREBASE_VAPID_KEY (required in production env)")
      return
    }
    if (!config.apiKey || !config.projectId) {
      log("Skipped: Firebase config incomplete (apiKey/projectId). Set NEXT_PUBLIC_FIREBASE_* in production build env.")
      return
    }

    let cancelled = false
    done.current = true
    registered.current = false

    const NOTIFICATION_ICON = LOGO_URL

    async function completeRegistration(app: import("firebase/app").FirebaseApp) {
      if (cancelled) return
      const { getMessaging, isSupported, getToken, onMessage } = await import(
        "firebase/messaging"
      )
      const supported = await isSupported()
      if (!supported || cancelled) {
        if (!supported) {
          log(
            "Skipped: FCM not supported (require HTTPS and secure context in production)",
          )
        }
        return
      }
      const messaging = getMessaging(app)
      onMessage(messaging, (payload) => {
        if (typeof window !== "undefined") {
          console.info(LOG_PREFIX, "Foreground message received.")
        }
        // Support both notification payload and data-only (data-only is used so foreground always receives)
        const data = (payload.data || {}) as {
          title?: string
          body?: string
          url?: string
        }
        const n = payload.notification ?? data
        const title = n?.title ?? "Notification"
        const body = n?.body ?? ""
        const url = data?.url ?? "/dashboard"
        // In-app toast
        toast.info(title, { description: body || undefined })
        // Show the same system push notification via the service worker (so it works when app is open too)
        if (Notification.permission === "granted" && navigator.serviceWorker) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(title, {
              body: body || undefined,
              icon: NOTIFICATION_ICON,
              tag: "fcm-foreground",
              requireInteraction: false,
              data: { url, payload: payload.data },
            })
          }).catch(() => {})
        }
      })

      let token: string | null = null
      try {
        token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        })
        if (typeof window !== "undefined") {
          console.info(LOG_PREFIX, "Token obtained; registering with server.")
        }
      } catch (getTokenErr) {
        log(
          "getToken failed (often: SW /firebase-messaging-sw.js missing or wrong config at build time). Check that production build has NEXT_PUBLIC_FIREBASE_* set and generates the SW.",
          getTokenErr,
        )
        return
      }
      if (!token || cancelled) {
        if (!token) log("Skipped: getToken returned no token")
        return
      }

      const res = await fetch("/api/notifications/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        credentials: "same-origin",
      })
      if (!res.ok) {
        if (res.status === 401) {
          log(
            "Token NOT stored: Unauthorized. Session cookie may not be sent yet — try refreshing or re-opening the dashboard.",
          )
        } else {
          log("Register API failed:", {
            status: res.status,
            body: await res.text(),
          })
        }
        return
      }
      console.info(
        LOG_PREFIX,
        "Token registered. This device will receive push notifications. To verify server-side: GET /api/notifications/debug",
      )
      registered.current = true
    }

    function maybeCompleteAfterPermissionGrant() {
      if (cancelled) return
      if (registered.current) return
      if (Notification.permission !== "granted") return
      const app = firebaseAppRef.current
      if (app) {
        completeRegistration(app).catch(() => {})
        return
      }

      // In case the Firebase app is still loading, fetch it on-demand.
      getFirebaseApp()
        .then(({ app: nextApp }) => {
          if (cancelled || !nextApp) return
          firebaseAppRef.current = nextApp
          completeRegistration(nextApp).catch(() => {})
        })
        .catch(() => {})
    }

    window.addEventListener(
      "fcm:notification-permission-granted",
      maybeCompleteAfterPermissionGrant,
    )

    async function register() {
      try {
        const { app } = await getFirebaseApp()
        if (!app) {
          log("Skipped: getFirebaseApp() returned no app")
          return
        }
        firebaseAppRef.current = app

        if (typeof Notification !== "undefined") {
          if (Notification.permission === "denied") {
            log("Skipped: notification permission denied by user")
            toast.info("Notifications blocked", {
              description:
                "To allow: Chrome (⋮) → Settings → Site settings → Notifications → add this site. Safari (Mac): Safari → Settings for this Website → Notifications → Allow.",
              duration: 10000,
            })
            return
          }
          if (Notification.permission === "default") {
            // Chrome often blocks the prompt unless it's triggered by a user click.
            toast("Get ride updates", {
              description: "Allow notifications to hear about bookings and ride changes.",
              duration: 10000,
              action: {
                label: "Enable",
                onClick: async () => {
                  const permission = await Notification.requestPermission()
                  if (permission === "granted") {
                    toast.success("Notifications enabled")
                    await completeRegistration(app)
                  } else if (permission === "denied") {
                    toast.info("Notifications blocked", {
                      description: "To allow later: Chrome (⋮) → Settings → Site settings → Notifications. Safari (Mac): Safari → Settings for this Website → Notifications.",
                      duration: 10000,
                    })
                  }
                },
              },
            })
            return
          }
        }

        await completeRegistration(app)
      } catch (err) {
        log("Registration failed", err)
      }
    }

    register()
    return () => {
      cancelled = true
      window.removeEventListener(
        "fcm:notification-permission-granted",
        maybeCompleteAfterPermissionGrant,
      )
    }
  }, [status])
}
