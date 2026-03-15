"use client"

import { useRegisterPush } from "@/hooks/use-register-push"

/**
 * Renders nothing; registers the current device for FCM push when mounted (e.g. in dashboard layout).
 */
export function PushRegistration() {
  useRegisterPush()
  return null
}
