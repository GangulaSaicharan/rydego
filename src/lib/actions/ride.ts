"use server"

import prisma from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { GenderPreference } from "@prisma/client"
import { CITIES } from "@/lib/constants/locations"

export async function getCitiesAction() {
  try {
    const cities = await prisma.location.findMany({
      select: {
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
      },
      distinct: ['city'],
      orderBy: {
        city: 'asc'
      }
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

  const fromCityName = formData.get("fromCity") as string
  const toCityName = formData.get("toCity") as string
  const departureTime = new Date(formData.get("departureTime") as string)
  const arrivalTimeRaw = formData.get("arrivalTime") as string | null
  const arrivalTime = arrivalTimeRaw ? new Date(arrivalTimeRaw) : null
  const pricePerSeat = parseFloat(formData.get("pricePerSeat") as string)
  const seatsTotal = parseInt(formData.get("seatsTotal") as string)
  const description = formData.get("description") as string
  const genderPreference = (formData.get("genderPreference") as GenderPreference) || "NONE"

  const fromCityData = CITIES.find(c => c.name === fromCityName)
  const toCityData = CITIES.find(c => c.name === toCityName)

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
          genderPreference,
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
        seatsAvailable: { gt: 0 },
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
      orderBy: {
        departureTime: 'asc'
      },
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
