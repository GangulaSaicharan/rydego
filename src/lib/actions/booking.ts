"use server"

import prisma from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { BookingStatus } from "@prisma/client"
import { requireMobile } from "@/lib/require-mobile"
import { createNotification } from "@/lib/notifications"
import { bookingCreateSchema } from "@/lib/validation"

export async function createBookingAction(params: {
  rideId: string
  seats: number
  pickupNote?: string
  dropNote?: string
}) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in to book a ride" }
  }

  const mobileError = await requireMobile(session.user.id, "book")
  if (mobileError) return mobileError

  const { rideId, seats, pickupNote, dropNote } = bookingCreateSchema.parse(params)

  try {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      select: {
        id: true,
        driverId: true,
        seatsAvailable: true,
        pricePerSeat: true,
        instantBooking: true,
        status: true,
        departureTime: true,
      },
    })

    if (!ride) {
      return { success: false, error: "Ride not found" }
    }

    if (ride.driverId === session.user.id) {
      return { success: false, error: "You cannot book your own ride" }
    }

    if (ride.status !== "SCHEDULED") {
      return { success: false, error: "This ride is no longer available for booking" }
    }

    if (new Date(ride.departureTime) <= new Date()) {
      return { success: false, error: "Ride has already started" }
    }

    if (ride.seatsAvailable < seats) {
      return { success: false, error: `Only ${ride.seatsAvailable} seat(s) available` }
    }

    const existingActive = await prisma.booking.findFirst({
      where: {
        rideId,
        passengerId: session.user.id,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    })

    if (existingActive) {
      return {
        success: false,
        error:
          existingActive.status === "PENDING"
            ? "You already have a pending request for this ride"
            : "You are already booked on this ride",
      }
    }

    const pricePerSeat = Number(ride.pricePerSeat)
    const totalPrice = pricePerSeat * seats

    const existingCancelledOrRejected = await prisma.booking.findFirst({
      where: {
        rideId,
        passengerId: session.user.id,
        status: { in: ["CANCELLED", "REJECTED"] },
      },
      orderBy: { createdAt: "desc" },
    })

    const booking = await prisma.$transaction(async (tx) => {
      if (existingCancelledOrRejected) {
        const newStatus: BookingStatus = ride.instantBooking ? "ACCEPTED" : "PENDING"
        const updated = await tx.booking.update({
          where: { id: existingCancelledOrRejected.id },
          data: {
            seats,
            totalPrice,
            status: newStatus,
            pickupNote: pickupNote || null,
            dropNote: dropNote || null,
          },
        })

        await tx.user.update({
          where: { id: session.user!.id! },
          data: { totalBookings: { increment: 1 } },
          select: { id: true },
        })

        if (ride.instantBooking) {
          await tx.ride.update({
            where: { id: rideId },
            data: { seatsAvailable: { decrement: seats } },
          })
          await tx.bookingEvent.create({
            data: { bookingId: updated.id, type: "AUTO_ACCEPTED" },
          })
        } else {
          await tx.bookingEvent.create({
            data: { bookingId: updated.id, type: "REQUESTED" },
          })
        }
        return updated
      }

      const newBooking = await tx.booking.create({
        data: {
          rideId,
          passengerId: session.user!.id!,
          seats,
          totalPrice,
          status: ride.instantBooking ? "ACCEPTED" : "PENDING",
          pickupNote: pickupNote || null,
          dropNote: dropNote || null,
        },
      })

      await tx.user.update({
        where: { id: session.user!.id! },
        data: { totalBookings: { increment: 1 } },
        select: { id: true },
      })

      if (ride.instantBooking) {
        await tx.ride.update({
          where: { id: rideId },
          data: { seatsAvailable: { decrement: seats } },
        })
        await tx.bookingEvent.create({
          data: { bookingId: newBooking.id, type: "AUTO_ACCEPTED" },
        })
      } else {
        await tx.bookingEvent.create({
          data: { bookingId: newBooking.id, type: "REQUESTED" },
        })
      }

      return newBooking
    })

    revalidatePath("/rides")
    revalidatePath("/rides/[id]", "page")
    revalidatePath("/dashboard")
    revalidatePath("/bookings")

    // Notifications (fire-and-forget)
    const rideForNotification = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        fromLocation: { select: { city: true } },
        toLocation: { select: { city: true } },
        driver: { select: { name: true } },
      },
    })
    const route =
      rideForNotification?.fromLocation && rideForNotification?.toLocation
        ? `${rideForNotification.fromLocation.city} → ${rideForNotification.toLocation.city}`
        : "your ride"
    const passengerName = session.user.name ?? "A passenger"

    const rideUrl = `/rides/${rideId}`
    console.info("[booking] Ride booked; sending notifications | rideId=", rideId, "| instant=", ride.instantBooking, "| driverId=", ride.driverId, "| passengerId=", session.user.id)
    if (ride.instantBooking) {
      await createNotification(
        ride.driverId,
        "New booking",
        `${passengerName} booked ${seats} seat(s) on ${route}.`,
        rideUrl
      )
      await createNotification(
        session.user.id,
        "Booking confirmed",
        `You're booked on ${route}. The ride is confirmed.`,
        rideUrl
      )
    } else {
      await createNotification(
        ride.driverId,
        "New booking request",
        `${passengerName} requested ${seats} seat(s) on ${route}.`,
        rideUrl
      )
      await createNotification(
        session.user.id,
        "Request sent",
        `Your booking request for ${route} was sent. The driver will confirm shortly.`,
        rideUrl
      )
    }

    return {
      success: true,
      bookingId: booking.id,
      status: booking.status,
      message: ride.instantBooking
        ? "You're booked! The ride is confirmed."
        : "Request sent. The driver will confirm shortly.",
    }
  } catch (error) {
    console.error("Failed to create booking:", error)
    return { success: false, error: "Failed to create booking" }
  }
}

export async function getMyBookingsAction() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized", bookings: [] }
  }

  try {
    const bookings = await prisma.booking.findMany({
      where: { passengerId: session.user.id },
      include: {
        ride: {
          include: {
            driver: { select: { id: true, name: true, image: true } },
            fromLocation: { select: { city: true, state: true } },
            toLocation: { select: { city: true, state: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })


    const serialized = bookings.map((b) => ({
      ...b,
      totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
      ride: {
        ...b.ride,
        pricePerSeat: Number(b.ride.pricePerSeat),
        departureTime: b.ride.departureTime.toISOString(),
        arrivalTime: b.ride.arrivalTime?.toISOString() ?? null,
      },
    }))

    return { success: true, bookings: serialized }
  } catch (error) {
    console.error("Failed to fetch bookings:", error)
    return { success: false, error: "Failed to fetch bookings", bookings: [] }
  }
}

export async function getBookingsForRideAction(rideId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized", bookings: [] }
  }

  try {
    const ride = await prisma.ride.findFirst({
      where: { id: rideId, driverId: session.user.id },
    })
    if (!ride) {
      return { success: false, error: "Not authorized to view this ride's bookings", bookings: [] }
    }

    const bookings = await prisma.booking.findMany({
      where: { rideId },
      include: {
        passenger: { select: { id: true, name: true, image: true, email: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    })

    const serialized = bookings.map((b) => ({
      ...b,
      totalPrice: b.totalPrice ? Number(b.totalPrice) : null,
    }))

    return { success: true, bookings: serialized }
  } catch (error) {
    console.error("Failed to fetch ride bookings:", error)
    return { success: false, error: "Failed to fetch bookings", bookings: [] }
  }
}

export async function updateBookingStatusAction(
  bookingId: string,
  status: BookingStatus
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" }
  }

  const allowedStatuses: BookingStatus[] = ["ACCEPTED", "REJECTED", "CANCELLED"]
  if (!allowedStatuses.includes(status)) {
    return { success: false, error: "Invalid status" }
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        ride: {
          include: {
            fromLocation: { select: { city: true } },
            toLocation: { select: { city: true } },
          },
        },
        passenger: { select: { name: true } },
      },
    })

    if (!booking) {
      return { success: false, error: "Booking not found" }
    }

    const isDriver = booking.ride.driverId === session.user.id
    const isPassenger = booking.passengerId === session.user.id

    if (status === "CANCELLED") {
      if (!isDriver && !isPassenger) {
        return { success: false, error: "Not authorized to cancel this booking" }
      }
    } else {
      if (!isDriver) {
        return { success: false, error: "Only the driver can accept or reject requests" }
      }
    }

    if (booking.status !== "PENDING" && status !== "CANCELLED") {
      return { success: false, error: "Booking is no longer pending" }
    }

    if (booking.status === "CANCELLED" || booking.status === "REJECTED") {
      return { success: false, error: "This booking is already closed" }
    }

    // Driver can only cancel/reject a passenger's booking before departure time
    if (status === "CANCELLED" || status === "REJECTED") {
      if (new Date(booking.ride.departureTime) <= new Date()) {
        return { success: false, error: "Cannot cancel or remove a booking after departure time" }
      }
    }

    await prisma.$transaction(async (tx) => {
      if (status === "ACCEPTED") {
        if (booking.ride.seatsAvailable < booking.seats) {
          throw new Error("Not enough seats available")
        }
        await tx.ride.update({
          where: { id: booking.rideId },
          data: { seatsAvailable: { decrement: booking.seats } },
        })
        await tx.bookingEvent.create({
          data: { bookingId, type: "ACCEPTED" },
        })
      }

      if (status === "CANCELLED" || status === "REJECTED") {
        if (booking.status === "ACCEPTED") {
          await tx.ride.update({
            where: { id: booking.rideId },
            data: { seatsAvailable: { increment: booking.seats } },
          })
        }
        await tx.bookingEvent.create({
          data: { bookingId, type: status },
        })
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status },
      })

      if (status === "CANCELLED" || status === "REJECTED") {
        await tx.user.update({
          where: { id: booking.passengerId },
          data: { totalBookings: { decrement: 1 } },
        })
      }
    })

    revalidatePath("/rides")
    revalidatePath("/rides/[id]", "page")
    revalidatePath("/dashboard")
    revalidatePath("/bookings")

    const route =
      booking.ride.fromLocation && booking.ride.toLocation
        ? `${booking.ride.fromLocation.city} → ${booking.ride.toLocation.city}`
        : "the ride"
    const rideUrl = `/rides/${booking.rideId}`

    if (status === "ACCEPTED") {
      await createNotification(
        booking.passengerId,
        "Booking accepted",
        `Your booking for ${route} was accepted by the driver.`,
        rideUrl
      )
    } else if (status === "REJECTED") {
      await createNotification(
        booking.passengerId,
        "Booking declined",
        `Your booking request for ${route} was declined.`,
        rideUrl
      )
    } else if (status === "CANCELLED") {
      if (isPassenger) {
        const passengerName = booking.passenger.name ?? "A passenger"
        await createNotification(
          booking.ride.driverId,
          "Booking cancelled",
          `${passengerName} cancelled their booking on ${route}.`,
          rideUrl
        )
      } else {
        await createNotification(
          booking.passengerId,
          "Booking cancelled",
          `Your booking for ${route} was cancelled by the driver.`,
          rideUrl
        )
      }
    }

    return { success: true, message: "Booking updated" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update booking"
    console.error("Failed to update booking:", error)
    return { success: false, error: message }
  }
}

export async function getBookingForRideByUserAction(rideId: string) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: true, booking: null }
  }

  try {
    const booking = await prisma.booking.findFirst({
      where: {
        rideId,
        passengerId: session.user.id,
      },
      include: {
        ride: {
          include: {
            driver: { select: { id: true, name: true, image: true } },
            fromLocation: true,
            toLocation: true,
          },
        },
      },
    })

    if (!booking) return { success: true, booking: null }

    return {
      success: true,
      booking: {
        ...booking,
        totalPrice: booking.totalPrice ? Number(booking.totalPrice) : null,
        ride: {
          ...booking.ride,
          pricePerSeat: Number(booking.ride.pricePerSeat),
          departureTime: booking.ride.departureTime.toISOString(),
          arrivalTime: booking.ride.arrivalTime?.toISOString() ?? null,
        },
      },
    }
  } catch (error) {
    console.error("Failed to fetch user booking for ride:", error)
    return { success: true, booking: null }
  }
}
