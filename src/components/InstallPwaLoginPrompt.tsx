"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

const STORAGE_KEY = "rydego_install_prompt_last"

function isInstalled() {
  if (typeof window === "undefined") return false
  const isStandalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // iOS Safari
    // @ts-expect-error - non-standard property
    Boolean(window.navigator.standalone)
  return isStandalone
}

export function InstallPwaLoginPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (isInstalled()) return

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    }
  }, [])

  const maybeShowToast = useCallback(
    (promptEvent: BeforeInstallPromptEvent) => {
      if (typeof window === "undefined") return

      const today = new Date().toDateString()
      const last = window.localStorage.getItem(STORAGE_KEY)
      if (last === today) return

      toast("Install RydeGo app", {
        description: "Add RydeGo to your home screen for faster access.",
        action: {
          label: "Install",
          onClick: async () => {
            try {
              await promptEvent.prompt()
              await promptEvent.userChoice
            } catch {
              // ignore
            } finally {
              window.localStorage.setItem(STORAGE_KEY, today)
            }
          },
        },
      })

      window.localStorage.setItem(STORAGE_KEY, today)
    },
    [],
  )

  useEffect(() => {
    if (!event) return
    if (isInstalled()) return
    maybeShowToast(event)
  }, [event, maybeShowToast])

  return null
}

