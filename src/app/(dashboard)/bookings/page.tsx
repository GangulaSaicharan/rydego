import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import type { Prisma } from "@prisma/client"
import { BookingStatus, RideStatus } from "@prisma/client"
import { Card, CardContent } from "@/components/ui/card"
import { TicketCheck } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui"
import { cn } from "@/lib/utils"
import { BookingsFilterView } from "@/components/rides/BookingsFilterView"

export const metadata: Metadata = {
  title: "My Bookings",
  description: "View and manage your ride bookings on RydeGo.",
}

const bookingInclude = {
  ride: {
    include: {
      driver: { select: { id: true, name: true, image: true } },
      fromLocation: { select: { city: true, state: true } },
      toLocation: { select: { city: true, state: true } },
    },
  },
}

const validFilters = ["upcoming", "inProgress", "past"] as const
type Filter = (typeof validFilters)[number]

function isValidFilter(s: string | null): s is Filter {
  return s !== null && validFilters.includes(s as Filter)
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const params = await searchParams
  const filter: Filter = isValidFilter(params.filter ?? null) ? (params.filter as Filter) : "upcoming"
  const now = new Date()

  const where =
    filter === "upcoming"
      ? {
          passengerId: userId,
          status: "ACCEPTED" as const,
          ride: { departureTime: { gt: now } },
        }
      : filter === "inProgress"
        ? {
            passengerId: userId,
            status: "ACCEPTED" as const,
            ride: { status: RideStatus.STARTED },
          }
        : {
            passengerId: userId,
            OR: [
              { status: { in: ["REJECTED", "CANCELLED", "COMPLETED"] satisfies BookingStatus[] } },
              {
                status: "ACCEPTED" as const,
                ride: {
                  OR: [
                    { status: RideStatus.COMPLETED },
                    { status: RideStatus.CANCELLED },
                    { departureTime: { lte: now }, status: { not: RideStatus.STARTED } },
                  ],
                },
              },
            ],
          }

  type BookingWithRide = Prisma.BookingGetPayload<{
    include: typeof bookingInclude
  }>
  const bookings = await prisma.booking.findMany({
    where,
    include: bookingInclude,
    orderBy:
      filter === "past"
        ? { createdAt: "desc" }
        : { ride: { departureTime: "asc" } },
  }) as BookingWithRide[]

  const totalBookings = await prisma.booking.count({
    where: { passengerId: userId },
  })

  if (totalBookings === 0) {
    return (
      <main className="flex-1 space-y-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
          <p className="text-muted-foreground mt-1">
            View and manage your ride booking requests
          </p>
        </div>
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TicketCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Search for a ride and book a seat. Your requests will appear here.
            </p>
            <Link
              href="/search"
              className={cn(buttonVariants(), "mt-4")}
            >
              Find a ride
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  const serialized = bookings.map((b) => ({
    id: b.id,
    seats: b.seats,
    totalPrice: b.totalPrice == null ? null : Number(b.totalPrice),
    status: b.status,
    ride: {
      id: b.ride.id,
      departureTime: b.ride.departureTime.toISOString(),
      driver: b.ride.driver,
      fromLocation: b.ride.fromLocation,
      toLocation: b.ride.toLocation,
    },
  }))

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
      </div>

      <BookingsFilterView currentFilter={filter} bookings={serialized} />
    </main>
  )
}
