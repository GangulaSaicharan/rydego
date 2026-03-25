"use client"

import { useEffect, useState, useRef, useCallback } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui"
import { APP_NAME } from "@/lib/constants/brand"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const STORAGE_KEY = "pwa_install_dialog_daily"
const MAX_SHOWS_PER_DAY = 2
const MIN_GAP_MS = 60 * 60 * 1000 // 1 hour

function isInstalled() {
  if (typeof window === "undefined") return false
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    // @ts-expect-error - non-standard property
    Boolean(window.navigator.standalone)
  return isStandalone
}

function getShowsToday(): number {
  if (typeof window === "undefined") return 0
  const today = new Date().toDateString()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { d?: string; n?: number }
    if (parsed.d !== today) return 0
    return typeof parsed.n === "number" ? parsed.n : 0
  } catch {
    return 0
  }
}

function getLastShownAt(): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return 0
    const parsed = JSON.parse(raw) as { t?: number }
    return typeof parsed.t === "number" ? parsed.t : 0
  } catch {
    return 0
  }
}

function recordShow() {
  if (typeof window === "undefined") return
  const today = new Date().toDateString()
  const n = getShowsToday() + 1
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ d: today, n, t: Date.now() }),
  )
}

export function InstallPwaLoginPrompt() {
  const [mounted, setMounted] = useState(false)
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)
  const openedForEventRef = useRef<BeforeInstallPromptEvent | null>(null)
  const retryTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isInstalled()) return

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }

    function handleAppInstalled() {
      setOpen(false)
      setEvent(null)
      openedForEventRef.current = null
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  useEffect(() => {
    if (!event) return

    const attemptOpen = () => {
      if (!event) return
      if (isInstalled()) return
      if (openedForEventRef.current === event) return
      if (getShowsToday() >= MAX_SHOWS_PER_DAY) return

      const lastShownAt = getLastShownAt()
      if (lastShownAt && Date.now() - lastShownAt < MIN_GAP_MS) {
        const remainingMs = MIN_GAP_MS - (Date.now() - lastShownAt)
        if (retryTimerRef.current) return
        retryTimerRef.current = window.setTimeout(() => {
          retryTimerRef.current = null
          attemptOpen()
        }, remainingMs)
        return
      }

      openedForEventRef.current = event
      recordShow()
      setOpen(true)
    }

    attemptOpen()

    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [event])

  const handleInstall = useCallback(async () => {
    if (!event) return
    try {
      await event.prompt()
      await event.userChoice
    } catch {
      // ignore
    } finally {
      setOpen(false)
      setEvent(null)
      openedForEventRef.current = null
    }
  }, [event])

  if (!mounted || isInstalled()) {
    return null
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Install {APP_NAME}?</AlertDialogTitle>
          <AlertDialogDescription>
            Add {APP_NAME} to your home screen for faster access.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
          <AlertDialogAction autoFocus type="button" onClick={handleInstall}>
            Install app
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
