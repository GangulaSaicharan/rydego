import prisma from "@/lib/db"
import { sendPushToUser, sendPushToUsers } from "@/lib/push"

/**
 * Create an in-app notification for a single user and send FCM push if configured.
 * Fire-and-forget: we don't fail the main action if notification creation fails.
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string
): Promise<void> {
  try {
    await prisma.notification.create({
      data: { userId, title, message },
    })
    void sendPushToUser(userId, title, message)
  } catch (err) {
    console.error("[notifications] Failed to create notification:", err)
  }
}

/**
 * Create the same in-app notification for multiple users and send FCM push to each.
 * Used e.g. when a ride is cancelled and all passengers are notified.
 */
export async function createNotifications(
  userIds: string[],
  title: string,
  message: string
): Promise<void> {
  if (userIds.length === 0) return
  try {
    await prisma.notification.createMany({
      data: userIds.map((userId) => ({ userId, title, message })),
    })
    void sendPushToUsers(userIds, title, message)
  } catch (err) {
    console.error("[notifications] Failed to create notifications:", err)
  }
}
