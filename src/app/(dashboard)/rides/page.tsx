import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { RideStatus } from "@prisma/client"
import { RidesFilterView } from "@/components/rides/RidesFilterView"

export const metadata: Metadata = {
  title: "My Rides",
  description: "View and manage your offered and taken rides on RydeGo.",
}

const rideInclude = {
  driver: { select: { name: true, image: true, email: true } },
  fromLocation: { select: { city: true, state: true } },
  toLocation: { select: { city: true, state: true } },
}

const validFilters = ["upcoming", "inProgress", "completed"] as const
type Filter = (typeof validFilters)[number]

function isValidFilter(s: string | null): s is Filter {
  return s !== null && validFilters.includes(s as Filter)
}

export default async function RidesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const params = await searchParams
  const filter: Filter = isValidFilter(params.filter ?? null) ? (params.filter as Filter) : "upcoming"
  const now = new Date()

  const baseWhere = {
    OR: [
      { driverId: userId },
      { bookings: { some: { passengerId: userId, status: "ACCEPTED" as const } } },
    ],
  }

  const where =
    filter === "upcoming"
      ? {
          ...baseWhere,
          status: RideStatus.SCHEDULED,
          departureTime: { gt: now },
        }
      : filter === "inProgress"
        ? { ...baseWhere, status: RideStatus.STARTED }
        : { ...baseWhere, status: RideStatus.COMPLETED }

  type RideWithInclude = Awaited<
    ReturnType<typeof prisma.ride.findMany<{ include: typeof rideInclude }>>
  >[number]
  const rides = await prisma.ride.findMany({
    where,
    orderBy:
      filter === "upcoming"
        ? { departureTime: "asc" }
        : { departureTime: "desc" },
    include: rideInclude,
  }) as RideWithInclude[]

  const serialized = rides.map((r) => {
    const pricePerSeat = r.pricePerSeat
    const price =
      typeof pricePerSeat === "number"
        ? pricePerSeat
        : Number(String(pricePerSeat))
    return {
      id: r.id,
      driverId: r.driverId,
      status: r.status,
      departureTime: r.departureTime.toISOString(),
      arrivalTime: r.arrivalTime?.toISOString() ?? null,
      pricePerSeat: price,
      seatsAvailable: r.seatsAvailable,
      seatsTotal: r.seatsTotal,
      driver: r.driver,
      fromLocation: r.fromLocation,
      toLocation: r.toLocation,
    }
  })

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Rides</h2>
      </div>

      <RidesFilterView
        currentFilter={filter}
        rides={serialized}
        userId={userId}
      />
    </main>
  )
}
