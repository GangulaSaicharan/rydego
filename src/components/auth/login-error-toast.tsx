"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"

export function LoginErrorToast({
  message,
}: {
  message?: string | null
}) {
  const hasShownRef = useRef(false)

  useEffect(() => {
    if (!message || hasShownRef.current) return
    hasShownRef.current = true
    toast.error(message)
  }, [message])

  return null
}

