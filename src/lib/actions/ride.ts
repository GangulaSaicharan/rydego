"use server"

import prisma from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath, revalidateTag, unstable_cache } from "next/cache"
import { requireMobile } from "@/lib/require-mobile"
import { createNotifications } from "@/lib/notifications"
import { parseISTLocalDateTime } from "@/lib/date-time"
import { rideFormSchema, rideSearchSchema } from "@/lib/validation"

const CITIES_CACHE_TAG = "cities"

async function fetchActiveCities() {
  return prisma.location.findMany({
    where: { status: true },
    select: { id: true, city: true },
    orderBy: { city: "asc" },
  })
}

const getCachedCities = unstable_cache(fetchActiveCities, ["locations", "cities", "active", "v1"], {
  tags: [CITIES_CACHE_TAG],
})

export async function getCitiesAction() {
  try {
    const cities =
      process.env.NODE_ENV === "development" ? await fetchActiveCities() : await getCachedCities()
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
  // Always trust DB for authorization (session can be stale).
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser) {
    return { success: false, error: "User not found." }
  }
  if (dbUser.isBlocked) {
    return { success: false, error: "Your account is blocked." }
  }
  if (dbUser.role !== "ADMIN") {
    return { success: false, error: "Only admins can publish rides." }
  }

  const mobileError = await requireMobile(session.user.id, "create_ride")
  if (mobileError) return mobileError
  const raw = {
    vehicleId: (formData.get("vehicleId") as string | null) ?? "",
    fromLocationId: (formData.get("fromLocationId") as string | null) ?? "",
    toLocationId: (formData.get("toLocationId") as string | null) ?? "",
    departureTime: (formData.get("departureTime") as string | null) ?? "",
    arrivalTime: (formData.get("arrivalTime") as string | null) ?? "",
    pricePerSeat: (formData.get("pricePerSeat") as string | null) ?? "",
    seatsTotal: (formData.get("seatsTotal") as string | null) ?? "",
    description: (formData.get("description") as string | null) ?? "",
    fromSlotStart: ((formData.get("fromSlotStart") as string | null) ?? "").trim(),
    fromSlotEnd: ((formData.get("fromSlotEnd") as string | null) ?? "").trim(),
    stopLocationIds: formData
      .getAll("stopLocationIds")
      .map((v) => (typeof v === "string" ? v : ""))
      .map((v) => v.trim())
      .filter(Boolean),
  }

  const parsed = rideFormSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid ride details"
    return { success: false, error: firstError }
  }

  const {
    vehicleId,
    fromLocationId,
    toLocationId,
    departureTime: departureTimeStr,
    arrivalTime: arrivalTimeStr,
    pricePerSeat: pricePerSeatStr,
    seatsTotal: seatsTotalStr,
    description,
    fromSlotStart,
    fromSlotEnd,
    stopLocationIds,
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

  if (fromLocationId === toLocationId) {
    return { success: false, error: "From and To city cannot be the same" }
  }

  const uniqueStops = Array.from(new Set(stopLocationIds ?? []))
  if (uniqueStops.length !== (stopLocationIds ?? []).length) {
    return { success: false, error: "Duplicate stops are not allowed" }
  }
  if (uniqueStops.some((id) => id === fromLocationId || id === toLocationId)) {
    return { success: false, error: "Stops cannot be the same as from/to city" }
  }

  try {
    const ride = await prisma.$transaction(async (tx) => {
      const [fromLocation, toLocation, vehicle] = await Promise.all([
        tx.location.findFirst({ where: { id: fromLocationId, status: true }, select: { id: true} }),
        tx.location.findFirst({ where: { id: toLocationId, status: true }, select: { id: true } }),
        tx.vehicle.findFirst({
          where: { id: vehicleId, ownerId: session.user!.id!, deletedAt: null },
          select: { id: true, seats: true },
        }),
      ])
      if (!fromLocation || !toLocation) {
        throw new Error("Invalid location selection")
      }
      if (!vehicle) {
        throw new Error("Invalid vehicle selection")
      }
      if (seatsTotal > vehicle.seats) {
        throw new Error(`Seats cannot exceed vehicle capacity (${vehicle.seats})`)
      }

      // Create ride
      const created = await tx.ride.create({
        data: {
          driverId: session.user!.id!,
          vehicleId: vehicle.id,
          fromLocationId,
          toLocationId,
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

      // Create intermediate stops (optional)
      if (uniqueStops.length > 0) {
        const stopLocations = await tx.location.findMany({
          where: { id: { in: uniqueStops }, status: true },
          select: { id: true },
        })
        const found = new Set(stopLocations.map((l) => l.id))
        const missing = uniqueStops.filter((id) => !found.has(id))
        if (missing.length > 0) {
          throw new Error("Invalid stop selection")
        }

        await tx.rideStop.createMany({
          data: uniqueStops.map((locationId, i) => ({
            rideId: created.id,
            order: i + 1,
            locationId,
          })),
        })
      }

      await tx.user.update({
        where: { id: session.user!.id! },
        data: { totalRides: { increment: 1 } },
        select: { id: true },
      })

      return created
    })

    revalidatePath("/dashboard")
    revalidatePath("/rides")
    revalidatePath("/search")

    return { success: true, rideId: ride.id }
  } catch (error) {
    console.error("Failed to create ride:", error)
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to create ride"
    return { success: false, error: message }
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
    
    if (new Date(ride.departureTime).getTime() - Date.now() <= TWO_HOURS_MS) {
      if (ride?.bookings?.length > 0) {
        return { success: false, error: "Ride cannot be cancelled within 2 hours of departure if there are bookings" }
      }
    }
    const passengerIds = Array.from(new Set(ride.bookings.map((b) => b.passengerId)))

    await prisma.$transaction(async (tx) => {
      await tx.booking.updateMany({
        where: { rideId, status: { in: ["PENDING", "ACCEPTED"] } },
        data: { status: "CANCELLED" },
      })

      if (passengerIds.length > 0) {
        await Promise.all(
          passengerIds.map((passengerId) =>
            tx.user.update({
              where: { id: passengerId },
              data: { totalBookings: { decrement: 1 } },
            })
          )
        )
      }

      await tx.ride.update({
        where: { id: rideId },
        data: { status: "CANCELLED" },
      })

      await tx.user.update({
        where: { id: ride.driverId },
        data: { totalRides: { decrement: 1 } },
      })
    })

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
    select: {
      driverId: true,
      status: true,
      departureTime: true,
      seatsTotal: true,
      seatsAvailable: true,
      vehicleId: true,
      pricePerSeat: true,
      fromLocationId: true,
      toLocationId: true,
      arrivalTime: true,
      description: true,
      fromSlot: true,
    },
  })
  if (!ride) return { success: false, error: "Ride not found" }
  if (ride.driverId !== session.user.id) return { success: false, error: "Only the ride creator can edit this ride" }
  if (ride.status !== "SCHEDULED") return { success: false, error: "Only scheduled rides can be edited" }
  if (new Date(ride.departureTime) <= new Date()) return { success: false, error: "Cannot edit a ride after departure time" }

  const activeBookingsCount = await prisma.booking.count({
    where: { rideId, status: { in: ["PENDING", "ACCEPTED"] } },
  })

  const bookedSeats = ride.seatsTotal - ride.seatsAvailable

  // If there are any active bookings, only seats can be changed.
  if (activeBookingsCount > 0) {
    const nextSeatsTotalStr = (formData.get("seatsTotal") as string | null) ?? ""
    const parsedSeats = rideFormSchema.shape.seatsTotal.safeParse(nextSeatsTotalStr)
    if (!parsedSeats.success) {
      const firstError = parsedSeats.error.issues[0]?.message ?? "Invalid seats"
      return { success: false, error: firstError }
    }
    const seatsTotal = Number(parsedSeats.data)
    if (seatsTotal < bookedSeats) {
      return { success: false, error: `Cannot set fewer than ${bookedSeats} seats (already booked)` }
    }
    if (!ride.vehicleId) {
      return { success: false, error: "Ride has no vehicle assigned" }
    }
    const vehicleId = ride.vehicleId!

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const vehicle = await tx.vehicle.findFirst({
          where: { id: vehicleId, ownerId: session.user!.id!, deletedAt: null },
          select: { id: true, seats: true },
        })
        if (!vehicle) throw new Error("Invalid vehicle selection")
        if (seatsTotal > vehicle.seats) {
          throw new Error(`Seats cannot exceed vehicle capacity (${vehicle.seats})`)
        }
        return await tx.ride.update({
          where: { id: rideId },
          data: {
            seatsTotal,
            seatsAvailable: seatsTotal - bookedSeats,
          },
        })
      })
      revalidatePath("/dashboard")
      revalidatePath("/rides")
      revalidatePath("/rides/[id]", "page")
      revalidatePath("/search")
      return { success: true, rideId: updated.id }
    } catch (error) {
      console.error("Failed to update ride seats:", error)
      const message = error instanceof Error && error.message ? error.message : "Failed to update ride"
      return { success: false, error: message }
    }
  }

  // No active bookings: allow full edit (time, locations, notes, etc.)
  const raw = {
    vehicleId: (formData.get("vehicleId") as string | null) ?? ride.vehicleId ?? "",
    fromLocationId: (formData.get("fromLocationId") as string | null) ?? "",
    toLocationId: (formData.get("toLocationId") as string | null) ?? "",
    departureTime: (formData.get("departureTime") as string | null) ?? "",
    arrivalTime: (formData.get("arrivalTime") as string | null) ?? "",
    pricePerSeat: (formData.get("pricePerSeat") as string | null) ?? "",
    seatsTotal: (formData.get("seatsTotal") as string | null) ?? "",
    description: ((formData.get("description") as string | null) ?? "").trim(),
    fromSlotStart: ((formData.get("fromSlotStart") as string | null) ?? "").trim(),
    fromSlotEnd: ((formData.get("fromSlotEnd") as string | null) ?? "").trim(),
    stopLocationIds: formData
      .getAll("stopLocationIds")
      .map((v) => (typeof v === "string" ? v : ""))
      .map((v) => v.trim())
      .filter(Boolean),
  }

  const parsed = rideFormSchema.safeParse(raw)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid ride details"
    return { success: false, error: firstError }
  }

  const {
    vehicleId,
    fromLocationId,
    toLocationId,
    departureTime: departureTimeStr,
    arrivalTime: arrivalTimeStr,
    pricePerSeat: pricePerSeatStr,
    seatsTotal: seatsTotalStr,
    description,
    fromSlotStart,
    fromSlotEnd,
    stopLocationIds,
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
  const fromSlot =
    fromSlotStart && fromSlotEnd ? `${fromSlotStart} to ${fromSlotEnd}` : fromSlotStart || fromSlotEnd || null

  if (fromLocationId === toLocationId) {
    return { success: false, error: "From and To city cannot be the same" }
  }

  const uniqueStops = Array.from(new Set(stopLocationIds ?? []))
  if (uniqueStops.length !== (stopLocationIds ?? []).length) {
    return { success: false, error: "Duplicate stops are not allowed" }
  }
  if (uniqueStops.some((id) => id === fromLocationId || id === toLocationId)) {
    return { success: false, error: "Stops cannot be the same as from/to city" }
  }

  if (seatsTotal < bookedSeats) {
    return { success: false, error: `Cannot set fewer than ${bookedSeats} seats (already booked)` }
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const [fromLocation, toLocation, vehicle] = await Promise.all([
        tx.location.findFirst({ where: { id: fromLocationId, status: true } }),
        tx.location.findFirst({ where: { id: toLocationId, status: true } }),
        tx.vehicle.findFirst({
          where: { id: vehicleId, ownerId: session.user!.id!, deletedAt: null },
          select: { id: true, seats: true },
        }),
      ])
      if (!fromLocation || !toLocation) {
        throw new Error("Invalid location selection")
      }
      if (!vehicle) {
        throw new Error("Invalid vehicle selection")
      }
      if (seatsTotal > vehicle.seats) {
        throw new Error(`Seats cannot exceed vehicle capacity (${vehicle.seats})`)
      }

      // Replace stops (RideStop.order is based on form order)
      await tx.rideStop.deleteMany({ where: { rideId } })

      if (uniqueStops.length > 0) {
        const stopLocations = await tx.location.findMany({
          where: { id: { in: uniqueStops }, status: true },
          select: { id: true },
        })
        const found = new Set(stopLocations.map((l) => l.id))
        const missing = uniqueStops.filter((id) => !found.has(id))
        if (missing.length > 0) {
          throw new Error("Invalid stop selection")
        }

        await tx.rideStop.createMany({
          data: uniqueStops.map((locationId, i) => ({
            rideId,
            order: i + 1,
            locationId,
          })),
        })
      }

      return await tx.ride.update({
        where: { id: rideId },
        data: {
          vehicleId: vehicle.id,
          fromLocationId,
          toLocationId,
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
    const message = error instanceof Error && error.message ? error.message : "Failed to update ride"
    return { success: false, error: message }
  }
}

const SEARCH_PAGE_SIZE = 10

export async function searchRidesAction(params: {
  fromLocationId?: string
  toLocationId?: string
  date?: string
  sort?: "soonest" | "cheapest" | "most_seats"
  skip?: number
  take?: number
}) {
  const parsed = rideSearchSchema.safeParse({
    ...params,
    sort: params.sort ?? "soonest",
    skip: params.skip ?? 0,
    take: params.take ?? SEARCH_PAGE_SIZE,
  })
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid search"
    return { success: false, error: firstError }
  }

  const { fromLocationId, toLocationId, date, sort } = parsed.data
  const skip = parsed.data.skip ?? 0
  const take = parsed.data.take ?? SEARCH_PAGE_SIZE

  try {
    const now = new Date()
    const orderBy = (() => {
      switch (sort) {
        case "cheapest":
          return [{ pricePerSeat: "asc" as const }, { departureTime: "asc" as const }]
        case "most_seats":
          return [{ seatsAvailable: "desc" as const }, { departureTime: "asc" as const }]
        case "soonest":
        default:
          return [{ departureTime: "asc" as const }]
      }
    })()

    const rides = await prisma.ride.findMany({
      where: {
        status: "SCHEDULED",
        AND: [
          // Hide rides that already completed their trip:
          // - if arrivalTime is present, ensure arrivalTime >= now
          // - if arrivalTime is missing, fall back to departureTime >= now
          {
            OR: [
              { arrivalTime: { gte: now } },
              { arrivalTime: null, departureTime: { gte: now } },
            ],
          },
          // If user-selected cities appear as intermediate stops, still include the ride.
          {
            OR: [
              { fromLocationId },
              { stops: { some: { locationId: fromLocationId } } },
            ],
          },
          {
            OR: [
              { toLocationId },
              { stops: { some: { locationId: toLocationId } } },
            ],
          },
        ],
        departureTime: date
          ? {
          gte: new Date(date),
          lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
          : undefined
      },
      include: {
        driver: true,
        fromLocation: true,
        toLocation: true,
      },
      orderBy,
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
