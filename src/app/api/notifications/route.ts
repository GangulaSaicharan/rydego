import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"

const LIMIT = 20

/**
 * GET /api/notifications
 * Returns the current user's notifications (newest first).
 * Query: cursor (id of last item) for pagination.
 */
export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get("cursor") ?? undefined

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: LIMIT + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
      },
    })
    const hasMore = notifications.length > LIMIT
    const page = hasMore ? notifications.slice(0, LIMIT) : notifications
    const nextCursor = hasMore ? page[page.length - 1]?.id : null

    const unreadCount = await prisma.notification.count({
      where: { userId: session.user.id, read: false },
    })
    return NextResponse.json({
      notifications: page.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      })),
      unreadCount,
      nextCursor,
    })
  } catch (err) {
    console.error("[notifications] GET failed:", err)
    return NextResponse.json(
      { error: "Failed to load notifications" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/notifications
 * Body: { id?: string, markAll?: boolean }
 * Mark one notification as read (id) or all as read (markAll: true).
 */
export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { id?: string; markAll?: boolean }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  try {
    if (body.markAll) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, read: false },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }
    if (typeof body.id === "string" && body.id) {
      await prisma.notification.updateMany({
        where: { id: body.id, userId: session.user.id },
        data: { read: true },
      })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json(
      { error: "Provide id or markAll: true" },
      { status: 400 }
    )
  } catch (err) {
    console.error("[notifications] PATCH failed:", err)
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    )
  }
}
