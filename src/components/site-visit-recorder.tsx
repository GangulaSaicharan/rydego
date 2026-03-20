"use client"

import { useEffect } from "react"
import { recordUniqueVisitorVisit } from "@/lib/actions/site-visit"
import { SITE_VISIT_LOCAL_STORAGE_KEY } from "@/lib/constants/site-analytics"

export function SiteVisitRecorder() {
  useEffect(() => {
    try {
      if (typeof localStorage === "undefined") return
      if (localStorage.getItem(SITE_VISIT_LOCAL_STORAGE_KEY)) return
      // Set before the async call so React Strict Mode’s second mount skips a second request.
      localStorage.setItem(SITE_VISIT_LOCAL_STORAGE_KEY, "1")
    } catch {
      return
    }

    void recordUniqueVisitorVisit().then((res) => {
      if (res.ok && res.recorded) return
      try {
        localStorage.removeItem(SITE_VISIT_LOCAL_STORAGE_KEY)
      } catch {
        /* ignore */
      }
    })
  }, [])

  return null
}
