import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { RideStatus } from "@prisma/client"
import { RidesFilterView } from "@/components/rides/RidesFilterView"
import { buttonVariants } from "@/components/ui"
import { PlusCircle } from "lucide-react"
import { APP_NAME } from "@/lib/constants/brand"

export const metadata: Metadata = {
  title: "My Rides",
  description: `View and manage your offered and taken rides on ${APP_NAME}.`,
  robots: {
    index: false,
    follow: false,
  },
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
  const isAdmin = session.user.role === "ADMIN"

  const params = await searchParams
  const filter: Filter = isValidFilter(params.filter ?? null) ? (params.filter as Filter) : "upcoming"
  const now = new Date()

  const baseWhere = {
    driverId: userId,
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
        : {
            ...baseWhere,
            OR: [
              { status: RideStatus.COMPLETED },
              // Older data can contain past rides still marked SCHEDULED.
              { status: RideStatus.SCHEDULED, departureTime: { lte: now } },
              { status: RideStatus.CANCELLED },
            ],
          }

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
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">My Rides</h2>
        {isAdmin && (
          <Link href="/publish" className={buttonVariants({ size: "sm" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Publish a ride
          </Link>
        )}
      </div>

      <RidesFilterView currentFilter={filter} rides={serialized} userId={userId} />
    </main>
  )
}
