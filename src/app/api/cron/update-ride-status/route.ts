import { NextResponse } from "next/server"
import prisma from "@/lib/db"
import { RideStatus } from "@prisma/client"

export const dynamic = "force-dynamic"
export const maxDuration = 60

/**
 * Cron endpoint: updates ride and booking statuses by time.
 * Rides:
 *   - SCHEDULED → STARTED when departureTime <= now (ACCEPTED bookings then show as "in progress")
 *   - STARTED → COMPLETED when arrivalTime has passed (or departureTime + 12h if no arrivalTime)
 * Bookings:
 *   - When ride completes: ACCEPTED on that ride → COMPLETED
 *
 * Secure with CRON_SECRET: caller must send Authorization: Bearer <CRON_SECRET>
 * Vercel Cron sends this automatically when CRON_SECRET is set in env.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const now = new Date()
  const started: string[] = []
  const completed: string[] = []
  let bookingsCompleted = 0

  try {
    // 1) SCHEDULED → STARTED: departure time has passed (ACCEPTED bookings show as in progress)
    const toStart = await prisma.ride.findMany({
      where: {
        status: RideStatus.SCHEDULED,
        departureTime: { lte: now },
      },
      select: { id: true },
    })

    if (toStart.length > 0) {
      const toStartIds = toStart.map((r) => r.id)
      await prisma.ride.updateMany({
        where: { id: { in: toStartIds } },
        data: { status: RideStatus.STARTED },
      })
      started.push(...toStartIds)
    }

    // 2) STARTED → COMPLETED: arrivalTime passed, or no arrivalTime and departure + 12h passed
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000)
    const withArrival = await prisma.ride.findMany({
      where: {
        status: RideStatus.STARTED,
        arrivalTime: { not: null, lte: now },
      },
      select: { id: true },
    })
    const withoutArrival = await prisma.ride.findMany({
      where: {
        status: RideStatus.STARTED,
        arrivalTime: null,
        departureTime: { lte: twelveHoursAgo },
      },
      select: { id: true },
    })
    const completedRideIds = [...withArrival.map((r) => r.id), ...withoutArrival.map((r) => r.id)]

    for (const rideId of completedRideIds) {
      const [completedBookingsResult] = await prisma.$transaction([
        prisma.booking.updateMany({
          where: { rideId, status: "ACCEPTED" },
          data: { status: "COMPLETED" },
        }),
        prisma.ride.update({
          where: { id: rideId },
          data: { status: RideStatus.COMPLETED },
        }),
      ])
      bookingsCompleted += completedBookingsResult.count
      completed.push(rideId)
    }

    return NextResponse.json({
      ok: true,
      started: started.length,
      completed: completed.length,
      bookings: { completed: bookingsCompleted },
      rideIds: { started, completed },
    })
  } catch (err) {
    console.error("[cron/update-ride-status]", err)
    return NextResponse.json(
      { error: "Failed to update ride statuses" },
      { status: 500 }
    )
  }
}
