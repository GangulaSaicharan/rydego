"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { phoneSchema } from "@/lib/validation"

export type ProfileUser = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  phone: string | null
  bio: string | null
}

export async function getProfile(): Promise<{ success: true; user: ProfileUser } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, phone: true, bio: true },
  })

  if (!user) {
    return { success: false, error: "User not found" }
  }

  return { success: true, user }
}

export async function updateProfile(formData: FormData): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const bio = (formData.get("bio") as string)?.trim() ?? null
  const phoneRaw = (formData.get("phone") as string) ?? ""
  const phone = phoneRaw ? phoneSchema.parse(phoneRaw) : null

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio: bio || null, phone: phone || null },
  })

  revalidatePath("/profile")
  revalidatePath("/profile/edit")
  return { success: true }
}

export async function updatePhone(phone: string): Promise<{ success: true } | { success: false; error: string }> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Not authenticated" }
  }

  const normalized = phoneSchema.parse(phone)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: normalized },
  })

  revalidatePath("/profile")
  revalidatePath("/profile/edit")
  return { success: true }
}
