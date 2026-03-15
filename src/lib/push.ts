import prisma from "@/lib/db"
import { getMessaging } from "@/lib/firebase-admin"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"


/**
 * Build notification title with app branding when logo is set.
 */
function formatNotificationTitle(title: string): string {
  return LOGO_URL ? `${APP_NAME} — ${title}` : title
}

/**
 * Send FCM push to all devices registered for a user. No-op if Firebase is not configured or user has no tokens.
 * Uses brand LOGO_URL (Cloudinary) for notification image; optional FCM_NOTIFICATION_IMAGE_URL env overrides.
 */
export async function sendPushToUser(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  const messaging = getMessaging()
  if (!messaging) {
    console.warn("[push] Firebase Admin not configured; skipping push for user", userId)
    return
  }

  try {
    const tokens = await prisma.userFcmToken.findMany({
      where: { userId },
      select: { token: true },
    })
    if (tokens.length === 0) {
      console.info("[push] No FCM tokens for user", userId, "; skipping push.")
      return
    }
    console.info("[push] Sending to", tokens.length, "token(s) for user", userId)

    const formattedTitle = formatNotificationTitle(title)
    // Logo only as icon (left); no large image in content
    const notification: { title: string; body: string } = {
      title: formattedTitle,
      body: message,
    }

    const invalidTokens: string[] = []
    const send = tokens.map(({ token }) =>
      messaging
        .send({
          token,
          notification,
          data: { title: formattedTitle, body: message },
          android: { priority: "high" },
          apns: { payload: { aps: { sound: "default" } } },
          ...(LOGO_URL && {
            webpush: {
              notification: {
                title: formattedTitle,
                body: message,
                icon: LOGO_URL,
                badge: LOGO_URL,
              },
            },
          }),
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
    console.info("[push] Done for user", userId)
  } catch (err) {
    console.error("[push] sendPushToUser failed:", err)
  }
}

/**
 * Send FCM push to multiple users. No-op if Firebase is not configured.
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  message: string
): Promise<void> {
  if (userIds.length === 0) return
  await Promise.all(userIds.map((id) => sendPushToUser(id, title, message)))
}
