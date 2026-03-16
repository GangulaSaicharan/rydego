"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice?: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function InstallPwaButton({ className }: { className?: string }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [supported, setSupported] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return

    function checkInstalled() {
      const isStandalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        // iOS Safari
        // @ts-expect-error - non-standard property
        Boolean(window.navigator.standalone)
      setInstalled(isStandalone)
    }

    checkInstalled()

    function handleAppInstalled() {
      setInstalled(true)
    }

    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setSupported(true)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [])

  const handleClick = useCallback(async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    try {
      await deferredPrompt.userChoice
    } catch {
      // ignore
    }
    setDeferredPrompt(null)
    setSupported(false)
  }, [deferredPrompt])

  if (installed) {
    return (
      <p className={`text-xs text-muted-foreground ${className ?? ""}`}>
        App is already installed on this device.
      </p>
    )
  }

  if (!supported || !deferredPrompt) {
    return null
  }

  return (
    <Button type="button" onClick={handleClick} className={className}>
      <Download className="mr-2 h-4 w-4" />
      Install app
    </Button>
  )
}

