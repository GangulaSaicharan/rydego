"use server"

import prisma from "@/lib/db"

export type RequireProfileError = {
  success: false
  error: string
  requiresProfile: true
}

/**
 * Ensures the user has a mobile number. Use before booking or creating a ride.
 * @returns null if user has phone; otherwise error payload to return to client
 */
export async function requireMobile(
  userId: string,
  context: "book" | "create_ride"
): Promise<RequireProfileError | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true },
  })
  
  if (user?.phone?.trim()) return null
  const error =
    context === "book"
      ? "Please add your mobile number to book a ride."
      : "Please add your mobile number to create a ride."
  return { success: false, error, requiresProfile: true }
}
