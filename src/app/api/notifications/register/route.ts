import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/db"

/**
 * POST /api/notifications/register
 * Body: { token: string } — FCM device token
 * Registers the token for the current user (replaces any previous registration of the same token).
 */
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const token = typeof body?.token === "string" ? body.token.trim() : null
  if (!token) {
    return NextResponse.json({ error: "Missing or invalid token" }, { status: 400 })
  }

  try {
    await prisma.$transaction([
      prisma.userFcmToken.deleteMany({ where: { token } }),
      prisma.userFcmToken.create({
        data: { userId: session.user.id, token },
      }),
    ])
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[notifications/register] Failed:", err)
    return NextResponse.json(
      { error: "Failed to register token" },
      { status: 500 }
    )
  }
}
