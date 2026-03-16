"use server"

import prisma from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { CITIES } from "@/lib/constants/locations"
import { requireMobile } from "@/lib/require-mobile"
import { createNotifications } from "@/lib/notifications"
import { parseISTLocalDateTime } from "@/lib/date-time"
import { rideFormSchema } from "@/lib/validation"

export async function getCitiesAction() {
  try {
    const cities = await prisma.location.findMany({
      where: { status: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    })
    return { success: true, cities }
  } catch (error) {
    console.error("Failed to fetch cities:", error)
    return { success: false, error: "Failed to fetch cities" }
  }
}

export async function createRideAction(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }
  if (session.user.role !== "ADMIN") {
    return { success: false, error: "Only admins can publish rides." }
  }

  const mobileError = await requireMobile(session.user.id, "create_ride")
  if (mobileError) return mobileError
  const raw = {
    fromCity: (formData.get("fromCity") as string | null) ?? "",
    toCity: (formData.get("toCity") as string | null) ?? "",
    departureTime: (formData.get("departureTime") as string | null) ?? "",
    arrivalTime: (formData.get("arrivalTime") as string | null) ?? "",
    pricePerSeat: (formData.get("pricePerSeat") as string | null) ?? "",
    seatsTotal: (formData.get("seatsTotal") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    fromSlotStart: ((formData.get("fromSlotStart") as string | null) ?? "").trim(),
    fromSlotEnd: ((formData.get("fromSlotEnd") as string | null) ?? "").trim(),
  }

  const parsed = rideFormSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid ride details"
    return { success: false, error: firstError }
  }

  const {
    fromCity: fromCityName,
    toCity: toCityName,
    departureTime: departureTimeStr,
    arrivalTime: arrivalTimeStr,
    pricePerSeat: pricePerSeatStr,
    seatsTotal: seatsTotalStr,
    description,
    fromSlotStart,
    fromSlotEnd,
  } = parsed.data

  const departureTime = parseISTLocalDateTime(departureTimeStr)
  const arrivalTime = parseISTLocalDateTime(arrivalTimeStr)

  if (!departureTime) {
    return { success: false, error: "Invalid departure time" }
  }
  if (!arrivalTime) {
    return { success: false, error: "Invalid arrival time" }
  }
  if (departureTime.getTime() <= Date.now()) {
    return { success: false, error: "Departure time cannot be in the past" }
  }

  if (arrivalTime.getTime() <= departureTime.getTime()) {
    return { success: false, error: "Arrival time cannot be before departure time" }
  }

  const pricePerSeat = Number(pricePerSeatStr)
  const seatsTotal = Number(seatsTotalStr)
  const fromSlot =
    fromSlotStart && fromSlotEnd ? `${fromSlotStart} to ${fromSlotEnd}` : fromSlotStart || fromSlotEnd || null

  const fromCityData = CITIES.find(c => c.name === fromCityName && c.status)
  const toCityData = CITIES.find(c => c.name === toCityName && c.status)

  if (!fromCityData || !toCityData) {
    return { success: false, error: "Invalid city selection" }
  }

  try {
    const ride = await prisma.$transaction(async (tx) => {
      // Find or create locations
      let fromLocation = await tx.location.findFirst({
        where: { city: fromCityName }
      })

      if (!fromLocation) {
        fromLocation = await tx.location.create({
          data: {
            city: fromCityName,
            state: fromCityData.state,
            country: fromCityData.country,
            latitude: fromCityData.latitude,
            longitude: fromCityData.longitude,
          }
        })
      }

      let toLocation = await tx.location.findFirst({
        where: { city: toCityName }
      })

      if (!toLocation) {
        toLocation = await tx.location.create({
          data: {
            city: toCityName,
            state: toCityData.state,
            country: toCityData.country,
            latitude: toCityData.latitude,
            longitude: toCityData.longitude,
          }
        })
      }

      // Create ride
      return await tx.ride.create({
        data: {
          driverId: session.user!.id!,
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id,
          departureTime,
          arrivalTime,
          pricePerSeat,
          seatsTotal,
          seatsAvailable: seatsTotal,
          description,
          fromSlot,
          genderPreference: "NONE",
          status: "SCHEDULED"
        }
      })
    })

    revalidatePath("/dashboard")
    revalidatePath("/rides")
    revalidatePath("/search")

    return { success: true, rideId: ride.id }
  } catch (error) {
    console.error("Failed to create ride:", error)
    return { success: false, error: "Failed to create ride" }
  }
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

/** Only driver can delete; ride must be SCHEDULED and more than 2 hours before departure. Cancels the ride and all its bookings. */
export async function deleteRideAction(rideId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in" }
  }

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        driverId: true,
        status: true,
        departureTime: true,
        fromLocation: { select: { city: true } },
        toLocation: { select: { city: true } },
        bookings: {
          where: { status: { in: ["PENDING", "ACCEPTED"] } },
          select: { passengerId: true },
        },
      },
    })
    if (!ride) return { success: false, error: "Ride not found" }
    if (ride.driverId !== session.user.id) return { success: false, error: "Only the ride creator can delete this ride" }
    if (ride.status !== "SCHEDULED") return { success: false, error: "Only scheduled rides can be deleted" }
    if (new Date(ride.departureTime) <= new Date()) return { success: false, error: "Cannot delete a ride after departure time" }
    if (new Date(ride.departureTime).getTime() - Date.now() <= TWO_HOURS_MS) return { success: false, error: "Ride cannot be cancelled within 2 hours of departure" }

    await prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { rideId, status: { in: ["PENDING", "ACCEPTED"] } },
        data: { status: "CANCELLED" },
      })
      await tx.ride.update({
        where: { id: rideId },
        data: { status: "CANCELLED" },
      })
    })

    const passengerIds = ride.bookings.map((b) => b.passengerId)
    const route =
      ride.fromLocation && ride.toLocation
        ? `${ride.fromLocation.city} → ${ride.toLocation.city}`
        : "your ride"
    if (passengerIds.length > 0) {
      await createNotifications(
        passengerIds,
        "Ride cancelled",
        `The ride ${route} has been cancelled by the driver.`,
        "/bookings"
      )
    }

    revalidatePath("/dashboard")
    revalidatePath("/rides")
    revalidatePath("/rides/[id]", "page")
    revalidatePath("/bookings")
    revalidatePath("/search")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete ride:", error)
    return { success: false, error: "Failed to delete ride" }
  }
}

/** Only driver can update; ride must be SCHEDULED and before departure. */
export async function updateRideAction(rideId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")

  const ride = await prisma.ride.findUnique({
    where: { id: rideId },
    select: { driverId: true, status: true, departureTime: true, seatsTotal: true, seatsAvailable: true },
  })
  if (!ride) return { success: false, error: "Ride not found" }
  if (ride.driverId !== session.user.id) return { success: false, error: "Only the ride creator can edit this ride" }
  if (ride.status !== "SCHEDULED") return { success: false, error: "Only scheduled rides can be edited" }
  if (new Date(ride.departureTime) <= new Date()) return { success: false, error: "Cannot edit a ride after departure time" }

  const fromCityName = formData.get("fromCity") as string
  const toCityName = formData.get("toCity") as string
  const raw = {
    fromCity: fromCityName ?? "",
    toCity: toCityName ?? "",
    departureTime: (formData.get("departureTime") as string | null) ?? "",
    arrivalTime: (formData.get("arrivalTime") as string | null) ?? "",
    pricePerSeat: (formData.get("pricePerSeat") as string | null) ?? "",
    seatsTotal: (formData.get("seatsTotal") as string | null) ?? "",
    description: ((formData.get("description") as string | null) ?? "").trim(),
    fromSlotStart: ((formData.get("fromSlotStart") as string | null) ?? "").trim(),
    fromSlotEnd: ((formData.get("fromSlotEnd") as string | null) ?? "").trim(),
  }

  const parsed = rideFormSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid ride details"
    return { success: false, error: firstError }
  }

  const {
    departureTime: departureTimeStr,
    arrivalTime: arrivalTimeStr,
    pricePerSeat: pricePerSeatStr,
    seatsTotal: seatsTotalStr,
    description,
    fromSlotStart,
    fromSlotEnd,
  } = parsed.data

  const departureTime = parseISTLocalDateTime(departureTimeStr)
  const arrivalTime = parseISTLocalDateTime(arrivalTimeStr)

  if (!departureTime) {
    return { success: false, error: "Invalid departure time" }
  }
  if (!arrivalTime) {
    return { success: false, error: "Invalid arrival time" }
  }
  if (departureTime.getTime() <= Date.now()) {
    return { success: false, error: "Departure time cannot be in the past" }
  }

  const pricePerSeat = Number(pricePerSeatStr)
  const seatsTotal = Number(seatsTotalStr)
  const fromSlot = fromSlotStart && fromSlotEnd ? `${fromSlotStart} to ${fromSlotEnd}` : fromSlotStart || fromSlotEnd || null

  const fromCityData = CITIES.find(c => c.name === fromCityName && c.status)
  const toCityData = CITIES.find(c => c.name === toCityName && c.status)
  if (!fromCityData || !toCityData) return { success: false, error: "Invalid city selection" }

  const bookedSeats = ride.seatsTotal - ride.seatsAvailable
  if (seatsTotal < bookedSeats) {
    return { success: false, error: `Cannot set fewer than ${bookedSeats} seats (already booked)` }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      let fromLocation = await tx.location.findFirst({ where: { city: fromCityName } })
      if (!fromLocation) {
        fromLocation = await tx.location.create({
          data: {
            city: fromCityName,
            state: fromCityData.state,
            country: fromCityData.country,
            latitude: fromCityData.latitude,
            longitude: fromCityData.longitude,
          },
        })
      }
      let toLocation = await tx.location.findFirst({ where: { city: toCityName } })
      if (!toLocation) {
        toLocation = await tx.location.create({
          data: {
            city: toCityName,
            state: toCityData.state,
            country: toCityData.country,
            latitude: toCityData.latitude,
            longitude: toCityData.longitude,
          },
        })
      }
      return await tx.ride.update({
        where: { id: rideId },
        data: {
          fromLocationId: fromLocation.id,
          toLocationId: toLocation.id,
          departureTime,
          arrivalTime: arrivalTime ?? undefined,
          pricePerSeat,
          seatsTotal,
          seatsAvailable: seatsTotal - bookedSeats,
          description,
          fromSlot,
        },
      })
    })
    revalidatePath("/dashboard")
    revalidatePath("/rides")
    revalidatePath("/rides/[id]", "page")
    revalidatePath("/search")
    return { success: true, rideId: updated.id }
  } catch (error) {
    console.error("Failed to update ride:", error)
    return { success: false, error: "Failed to update ride" }
  }
}

const SEARCH_PAGE_SIZE = 10

export async function searchRidesAction(params: {
  fromCity?: string
  toCity?: string
  date?: string
  skip?: number
  take?: number
}) {
  const { fromCity, toCity, date, skip = 0, take = SEARCH_PAGE_SIZE } = params

  try {
    const rides = await prisma.ride.findMany({
      where: {
        status: "SCHEDULED",
        fromLocation: fromCity ? { city: { contains: fromCity, mode: 'insensitive' } } : undefined,
        toLocation: toCity ? { city: { contains: toCity, mode: 'insensitive' } } : undefined,
        departureTime: date ? {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        } : undefined
      },
      include: {
        driver: true,
        fromLocation: true,
        toLocation: true,
      },
      orderBy: [{ seatsAvailable: "desc" }, { departureTime: "asc" }],
      skip,
      take: take + 1
    })

    const hasMore = rides.length > take
    const page = hasMore ? rides.slice(0, take) : rides

    // Serialize for Client Components: Decimal and Date are not plain objects
    const serialized = page.map((ride) => ({
      ...ride,
      pricePerSeat: Number(ride.pricePerSeat),
      departureTime: ride.departureTime.toISOString(),
      arrivalTime: ride.arrivalTime?.toISOString() ?? null,
      createdAt: ride.createdAt.toISOString(),
      updatedAt: ride.updatedAt.toISOString(),
      deletedAt: ride.deletedAt?.toISOString() ?? null,
    }))

    return { success: true, rides: serialized, hasMore }
  } catch (error) {
    console.error("Failed to search rides:", error)
    return { success: false, error: "Failed to search rides" }
  }
}
