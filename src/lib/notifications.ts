import prisma from "@/lib/db"
import { sendPushToUser, sendPushToUsers } from "@/lib/push"

/**
 * Create an in-app notification for a single user and send FCM push if configured.
 * Fire-and-forget: we don't fail the main action if notification creation fails.
 * @param url - Deep link for push (e.g. /rides/xyz or /rides). Must be a concrete route, not left blank.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  url: string
): Promise<void> {
  try {
    console.info("[notifications] Creating notification for user", userId, "|", title, "|", message.slice(0, 80) + (message.length > 80 ? "…" : ""))
    await prisma.notification.create({
      data: { userId, title, message },
    })
    void sendPushToUser(userId, title, message, url)
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err)
  }
}

/**
 * Create the same in-app notification for multiple users and send FCM push to each.
 * Used e.g. when a ride is cancelled and all passengers are notified.
 * @param url - Deep link for push (e.g. /rides). Must be a concrete route, not left blank.
 */
export async function createNotifications(
  userIds: string[],
  title: string,
  message: string,
  url: string
): Promise<void> {
  if (userIds.length === 0) return
  try {
    console.info("[notifications] Creating notifications for", userIds.length, "user(s) |", title, "|", message.slice(0, 80) + (message.length > 80 ? "…" : ""))
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, message })),
    })
    void sendPushToUsers(userIds, title, message, url)
  } catch (err) {
    console.error("[notifications] Failed to create notifications:", err)
  }
}
