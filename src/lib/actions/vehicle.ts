"use server"

import { auth } from "@/auth"
import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { vehicleCreateSchema } from "@/lib/validation"

export async function listMyVehiclesAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: "Unauthorized" }
  }

  // Trust DB for authz (session can be stale)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser) return { success: false as const, error: "User not found." }
  if (dbUser.isBlocked) return { success: false as const, error: "Your account is blocked." }
  if (dbUser.role !== "ADMIN") {
    return { success: false as const, error: "Only admins can manage vehicles." }
  }

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      brand: true,
      model: true,
      color: true,
      plateNumber: true,
      seats: true,
      createdAt: true,
    },
  })

  return { success: true as const, vehicles }
}

export async function createVehicleAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser) return { success: false as const, error: "User not found." }
  if (dbUser.isBlocked) return { success: false as const, error: "Your account is blocked." }
  if (dbUser.role !== "ADMIN") {
    return { success: false as const, error: "Only admins can add vehicles." }
  }

  const existingCount = await prisma.vehicle.count({
    where: { ownerId: session.user.id, deletedAt: null },
  })
  if (existingCount >= 2) {
    return { success: false as const, error: "You can add maximum 2 vehicles." }
  }

  const raw = {
    brand: (formData.get("brand") as string | null) ?? "",
    model: (formData.get("model") as string | null) ?? "",
    color: ((formData.get("color") as string | null) ?? "").trim() || undefined,
    plateNumber: (formData.get("plateNumber") as string | null) ?? "",
    seats: (formData.get("seats") as string | null) ?? "",
  }

  const parsed = vehicleCreateSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid vehicle details"
    return { success: false as const, error: firstError }
  }

  const seats = Number(parsed.data.seats)

  try {
    const vehicle = await prisma.vehicle.create({
      data: {
        ownerId: session.user.id,
        brand: parsed.data.brand,
        model: parsed.data.model,
        color: parsed.data.color,
        plateNumber: parsed.data.plateNumber,
        seats,
      },
      select: { id: true },
    })

    revalidatePath("/settings/vehicles")
    revalidatePath("/publish")

    return { success: true as const, vehicleId: vehicle.id }
  } catch (error: unknown) {
    // Prisma unique constraint (plateNumber)
    const maybe = error as { code?: unknown }
    if (maybe?.code === "P2002") {
      return { success: false as const, error: "Plate number already exists." }
    }
    console.error("Failed to create vehicle:", error)
    return { success: false as const, error: "Failed to create vehicle" }
  }
}

export async function updateVehicleAction(vehicleId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser) return { success: false as const, error: "User not found." }
  if (dbUser.isBlocked) return { success: false as const, error: "Your account is blocked." }
  if (dbUser.role !== "ADMIN") {
    return { success: false as const, error: "Only admins can edit vehicles." }
  }

  const raw = {
    brand: (formData.get("brand") as string | null) ?? "",
    model: (formData.get("model") as string | null) ?? "",
    color: ((formData.get("color") as string | null) ?? "").trim() || undefined,
    plateNumber: (formData.get("plateNumber") as string | null) ?? "",
    seats: (formData.get("seats") as string | null) ?? "",
  }

  const parsed = vehicleCreateSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid vehicle details"
    return { success: false as const, error: firstError }
  }

  const seats = Number(parsed.data.seats)

  try {
    await prisma.vehicle.update({
      where: { id: vehicleId, ownerId: session.user.id, deletedAt: null },
      data: {
        brand: parsed.data.brand,
        model: parsed.data.model,
        color: parsed.data.color,
        plateNumber: parsed.data.plateNumber,
        seats,
      },
      select: { id: true },
    })

    revalidatePath("/settings/vehicles")
    revalidatePath("/publish")

    return { success: true as const }
  } catch (error: unknown) {
    const maybe = error as { code?: unknown }
    if (maybe?.code === "P2002") {
      return { success: false as const, error: "Plate number already exists." }
    }
    console.error("Failed to update vehicle:", error)
    return { success: false as const, error: "Failed to update vehicle" }
  }
}

export async function deleteVehicleAction(vehicleId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser) return { success: false as const, error: "User not found." }
  if (dbUser.isBlocked) return { success: false as const, error: "Your account is blocked." }
  if (dbUser.role !== "ADMIN") {
    return { success: false as const, error: "Only admins can delete vehicles." }
  }

  try {
    await prisma.vehicle.update({
      where: { id: vehicleId, ownerId: session.user.id, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { id: true },
    })

    revalidatePath("/settings/vehicles")
    revalidatePath("/publish")

    return { success: true as const }
  } catch (error) {
    console.error("Failed to delete vehicle:", error)
    return { success: false as const, error: "Failed to delete vehicle" }
  }
}

