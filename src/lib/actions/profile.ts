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
  const phoneRaw = ((formData.get("phone") as string) ?? "").trim()

  // Frontend sends only 10 digits; normalize to +91XXXXXXXXXX in DB
  let phone: string | null = null
  if (phoneRaw) {
    const digits = phoneRaw.replace(/\D/g, "")
    if (digits.length === 10) {
      phone = `+91${digits}`
    } else {
      // Fallback to generic normalization (keeps existing behaviour if something unexpected comes through)
      phone = phoneSchema.parse(phoneRaw)
    }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { bio: bio || null, phone },
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

  const raw = phone.trim()
  const digits = raw.replace(/\D/g, "")
  const normalized = digits.length === 10 ? `+91${digits}` : phoneSchema.parse(phone)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { phone: normalized },
  })

  revalidatePath("/profile")
  revalidatePath("/profile/edit")
  return { success: true }
}
