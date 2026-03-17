"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { getSuperAdminEmails, isSuperAdmin } from "@/lib/super-admin"
import { revalidatePath } from "next/cache"

export async function updateUserRoleOwnerAction(input: {
  userId: string
  role: "USER" | "ADMIN"
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" }
  }
  if (!isSuperAdmin(session)) {
    return { success: false as const, error: "Forbidden" }
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, email: true, role: true, deletedAt: true },
  })
  if (!user || user.deletedAt) {
    return { success: false as const, error: "User not found." }
  }

  const superEmails = new Set(getSuperAdminEmails())
  const email = (user.email ?? "").trim().toLowerCase()
  if (email && superEmails.has(email)) {
    return {
      success: false as const,
      error: "Cannot change role of an owner account.",
    }
  }

  if (user.role === input.role) {
    return { success: true as const }
  }

  await prisma.user.update({
    where: { id: input.userId },
    data: { role: input.role },
    select: { id: true },
  })

  revalidatePath("/admin")
  revalidatePath("/admin/users")
  return { success: true as const }
}

