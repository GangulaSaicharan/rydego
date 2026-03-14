"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

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
  const phone = (formData.get("phone") as string)?.trim() ?? null

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio: bio || null, phone: phone || null },
  })

  revalidatePath("/profile")
  revalidatePath("/profile/edit")
  return { success: true }
}
