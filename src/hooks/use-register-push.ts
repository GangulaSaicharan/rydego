"use client"

import { useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { getFirebaseApp, getFirebaseConfig } from "@/lib/firebase-client"

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
 * Registers the current device for FCM push notifications when the user is logged in.
 * Call from dashboard layout so it runs on any authenticated page.
 * Waits for session to be ready so the register API receives the auth cookie.
 * Requires NEXT_PUBLIC_FIREBASE_* (including VAPID_KEY) and firebase-messaging-sw.js in public.
 *
 * Production: If tokens are not created, check browser console for [FCM] messages. Common causes:
 * - Env: NEXT_PUBLIC_FIREBASE_* and VAPID_KEY must be set in the production build (e.g. Vercel env).
 * - Build: "node scripts/generate-firebase-sw.js" runs in build; it needs those env vars so public/firebase-messaging-sw.js has valid config.
 * - HTTPS: FCM requires a secure context (HTTPS in production).
 * - SW: /firebase-messaging-sw.js must be served at the app origin (no 404).
 * - Firebase Console: Add your production domain under Project Settings > General > Your apps (Web) if using domain restrictions.
 */
export function useRegisterPush() {
  const { status } = useSession()
  const done = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || done.current || status !== "authenticated") return

    const config = getFirebaseConfig()
    if (!config) {
      log("Skipped: missing Firebase env (NEXT_PUBLIC_FIREBASE_*)")
      return
    }
    if (!config.vapidKey) {
      log("Skipped: missing NEXT_PUBLIC_FIREBASE_VAPID_KEY (required in production env)")
      return
    }
    if (!config.apiKey || !config.projectId) {
      log("Skipped: Firebase config incomplete (apiKey/projectId). Set NEXT_PUBLIC_FIREBASE_* in production build env.")
      return
    }

    let cancelled = false
    done.current = true

    async function register() {
      try {
        const { app } = await getFirebaseApp()
        if (!app) {
          log("Skipped: getFirebaseApp() returned no app")
          return
        }

        const { getMessaging, isSupported, getToken } = await import("firebase/messaging")

        const supported = await isSupported()
        if (!supported || cancelled) {
          if (!supported) {
            log(
              "Skipped: FCM not supported (require HTTPS and secure context in production)",
            )
          }
          return
        }

        if (typeof Notification !== "undefined") {
          if (Notification.permission === "denied") {
            log("Skipped: notification permission denied by user")
            return
          }
          if (Notification.permission === "default") {
            const permission = await Notification.requestPermission()
            if (permission !== "granted" || cancelled) {
              if (permission !== "granted") {
                log("Skipped: notification permission not granted")
              }
              return
            }
          }
        }

        const messaging = getMessaging(app)
        let token: string | null = null
        try {
          token = await getToken(messaging, { vapidKey: config!.vapidKey })
        } catch (getTokenErr) {
          log(
            "getToken failed (often: SW /firebase-messaging-sw.js missing or wrong config at build time). Check that production build has NEXT_PUBLIC_FIREBASE_* set and generates the SW.",
            getTokenErr,
          )
          return
        }
        if (!token || cancelled) {
          if (!token) {
            log("Skipped: getToken returned no token")
          }
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
            log("Register API failed:", { status: res.status, body: await res.text() })
          }
          return
        }
        console.info(LOG_PREFIX, "Token registered and saved to FCM table")
      } catch (err) {
        log("Registration failed", err)
      }
    }

    register()
    return () => {
      cancelled = true
    }
  }, [status])
}
