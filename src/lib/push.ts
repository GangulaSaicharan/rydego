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
  if (!messaging) return

  try {
    const tokens = await prisma.userFcmToken.findMany({
      where: { userId },
      select: { token: true },
    })
    if (tokens.length === 0) return

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
        .catch((err: { code?: string }) => {
          if (err?.code === "messaging/registration-token-not-registered" || err?.code === "messaging/invalid-registration-token") {
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
    }
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
