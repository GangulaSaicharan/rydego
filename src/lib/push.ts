import prisma from "@/lib/db"
import { getMessaging } from "@/lib/firebase-admin"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"


/**
 * Build notification title with app branding when logo is set.
 */
function formatNotificationTitle(title: string): string {
  return LOGO_URL ? `${APP_NAME} — ${title}` : title
}

export type SendPushResult =
  | { ok: true; sentCount: number; tokenCount: number }
  | { ok: false; reason: "no_firebase" | "no_tokens" | "error"; detail?: string }

/**
 * Send FCM push to all devices registered for a user. No-op if Firebase is not configured or user has no tokens.
 * Uses brand LOGO_URL (Cloudinary) for notification image; optional FCM_NOTIFICATION_IMAGE_URL env overrides.
 * @param url - Deep link (e.g. /rides/xyz or /bookings). Must be a concrete route, not left blank.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  message: string,
  url: string
): Promise<SendPushResult> {
  const messaging = getMessaging()
  if (!messaging) {
    console.warn(
      "[push] Firebase Admin not configured (FIREBASE_SERVICE_ACCOUNT_JSON missing or invalid); skipping push for user",
      userId,
    )
    return { ok: false, reason: "no_firebase" }
  }

  try {
    const tokens = await prisma.userFcmToken.findMany({
      where: { userId },
      select: { token: true },
    })
    if (tokens.length === 0) {
      console.info(
        "[push] No FCM tokens for user",
        userId,
        "; user must open app on the target device, allow notifications, and have /firebase-messaging-sw.js loaded (HTTPS). Skipping push.",
      )
      return { ok: false, reason: "no_tokens" }
    }
    console.info("[push] Sending to", tokens.length, "token(s) for user", userId, "| title:", title)

    const formattedTitle = formatNotificationTitle(title)
    // Data-only payload so the foreground page receives the message in onMessage.
    const invalidTokens: string[] = []
    const dataPayload = {
      title: formattedTitle,
      body: message,
      tag: "app-notification",
      url,
    }
    const send = tokens.map(({ token }) =>
      messaging
        .send({
          token,
          data: dataPayload,
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
          webpush: { fcmOptions: { link: url } },
        })
        .catch((err: { code?: string; message?: string }) => {
          const code = err?.code ?? ""
          const msg = String(err?.message ?? "")
          const errStr = typeof err === "object" ? JSON.stringify(err) : String(err)
          const isInvalid =
            code === "messaging/registration-token-not-registered" ||
            code === "messaging/invalid-registration-token" ||
            code === "messaging/invalid-argument" ||
            code.startsWith("messaging/") ||
            /permission denied|invalid.*token|not found/i.test(msg) ||
            /permission denied/i.test(errStr)
          if (isInvalid) {
            invalidTokens.push(token)
          }
          console.error("[push] Send failed for token:", err)
        })
    )
    await Promise.all(send)

    if (invalidTokens.length > 0) {
      await prisma.userFcmToken.deleteMany({
        where: { userId, token: { in: invalidTokens } },
      })
      console.warn("[push] Removed", invalidTokens.length, "invalid token(s) for user", userId)
    }
    const okCount = tokens.length - invalidTokens.length
    console.info("[push] Done for user", userId, "| delivered to", okCount, "of", tokens.length, "token(s)")
    return { ok: true, sentCount: okCount, tokenCount: tokens.length }
  } catch (err) {
    console.error("[push] sendPushToUser failed:", err)
    return {
      ok: false,
      reason: "error",
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Send FCM push to multiple users. No-op if Firebase is not configured.
 * @param url - Deep link for all (e.g. /bookings). Must be a concrete route, not left blank.
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  message: string,
  url: string
): Promise<void> {
  if (userIds.length === 0) return
  await Promise.all(userIds.map((id) => sendPushToUser(id, title, message, url)))
}
