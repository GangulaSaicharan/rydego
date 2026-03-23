"use client"

import { useEffect } from "react"
import { recordUniqueVisitorVisit } from "@/lib/actions/site-visit"
import { SITE_VISIT_COOKIE_KEY } from "@/lib/constants/site-analytics"

/** Cross-tab + Strict Mode safe: only one tab can run the check + increment at a time. */
const SITE_VISIT_LOCK_NAME = `${SITE_VISIT_COOKIE_KEY}_lock`

function getCookieValue(name: string) {
  if (typeof document === "undefined") return null
  const parts = document.cookie.split(";")
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed.startsWith(`${name}=`)) continue
    return decodeURIComponent(trimmed.slice(name.length + 1))
  }
  return null
}

function setCookieValue(name: string, value: string) {
  if (typeof document === "undefined") return
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:"
  const secureSuffix = isSecure ? "; Secure" : ""
  // Long-lived marker; this counter is intentionally "first time ever" per client.
  const maxAgeSeconds = 60 * 60 * 24 * 365 * 10
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureSuffix}`
}

export function SiteVisitRecorder() {
  useEffect(() => {
    const run = async () => {
      try {
        const recordOnce = async () => {
          if (getCookieValue(SITE_VISIT_COOKIE_KEY)) return
          // Set the cookie before the server call so React Strict Mode or cross-tab
          // races cannot double-increment.
          setCookieValue(SITE_VISIT_COOKIE_KEY, "1")

          const res = await recordUniqueVisitorVisit()
          if (res.ok && res.recorded) return
          // Intentionally do not clear the marker on failure. If the server increment
          // actually happened but the response failed, clearing would allow a duplicate retry.
        }

        if (typeof navigator !== "undefined" && navigator.locks) {
          await navigator.locks.request(
            SITE_VISIT_LOCK_NAME,
            { mode: "exclusive" },
            recordOnce
          )
        } else {
          await recordOnce()
        }
      } catch {
        /* lock denied or cookie/localStorage blocked */
      }
    }

    void run()
  }, [])

  return null
}
