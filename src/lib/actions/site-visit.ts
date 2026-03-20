"use server"

import prisma from "@/lib/db"
import { SITE_VISIT_COUNTER_USER_EMAIL } from "@/lib/constants/site-analytics"

export async function recordUniqueVisitorVisit() {
  try {
    const counterUser = await prisma.user.findUnique({
      where: { email: SITE_VISIT_COUNTER_USER_EMAIL },
      select: { id: true },
    })
    if (!counterUser) {
      return { ok: false as const, recorded: false, error: "counter_user_not_found" as const }
    }

    await prisma.user.update({
      where: { id: counterUser.id },
      data: { totalRides: { increment: 1 } },
    })

    return { ok: true as const, recorded: true }
  } catch (error) {
    console.error("[site-visit] Failed to record visit:", error)
    return { ok: false as const, recorded: false, error: "db_error" as const }
  }
}
