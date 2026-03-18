"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { getSuperAdminEmails, isSuperAdmin } from "@/lib/super-admin"
import { updateUserRoleSchema } from "@/lib/validation"
import { revalidatePath } from "next/cache"

export async function updateUserRoleOwnerAction(input: unknown) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" }
  }
  if (!isSuperAdmin(session)) {
    return { success: false as const, error: "Forbidden" }
  }

  const parsed = updateUserRoleSchema.safeParse(input)
  if (!parsed.success) {
    const first = parsed.error.flatten().fieldErrors
    const message =
      first.userId?.[0] ?? first.role?.[0] ?? "Invalid input."
    return { success: false as const, error: message }
  }

  const { userId, role } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: userId },
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

  if (user.role === role) {
    return { success: true as const }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true },
    })
  } catch {
    return { success: false as const, error: "Failed to update role. Please try again." }
  }

  revalidatePath("/admin")
  revalidatePath("/admin/users")
  return { success: true as const }
}

