import { auth } from "@/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  IndianRupee,
  Clock,
  TicketCheck,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CancelBookingButton } from "@/components/rides/CancelBookingButton"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  CANCELLED: "outline",
  COMPLETED: "outline",
  NO_SHOW: "outline",
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Confirmed",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NO_SHOW: "No show",
}

export default async function BookingsPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) redirect("/login")

  const bookings = await prisma.booking.findMany({
    where: { passengerId: userId },
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

  const pending = bookings.filter((b) => b.status === "PENDING")
  const upcoming = bookings.filter(
    (b) => b.status === "ACCEPTED" && new Date(b.ride.departureTime) > new Date()
  )
  const past = bookings.filter(
    (b) =>
      b.status === "REJECTED" ||
      b.status === "CANCELLED" ||
      b.status === "COMPLETED" ||
      b.status === "NO_SHOW" ||
      (b.status === "ACCEPTED" && new Date(b.ride.departureTime) <= new Date())
  )

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">My Bookings</h2>
        <p className="text-muted-foreground mt-1">
          View and manage your ride booking requests
        </p>
      </div>

      {bookings.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <TicketCheck className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No bookings yet</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Search for a ride and book a seat. Your requests will appear here.
            </p>
            <Button asChild className="mt-4">
              <Link href="/search">Find a ride</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  Pending
                </CardTitle>
                <CardDescription>Waiting for driver approval</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {pending.map((b) => (
                  <BookingCard key={b.id} booking={b} showCancel />
                ))}
              </CardContent>
            </Card>
          )}

          {upcoming.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming
                </CardTitle>
                <CardDescription>Confirmed rides</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcoming.map((b) => (
                  <BookingCard key={b.id} booking={b} showCancel />
                ))}
              </CardContent>
            </Card>
          )}

          {past.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TicketCheck className="h-5 w-5 text-muted-foreground" />
                  Past
                </CardTitle>
                <CardDescription>Previous requests and rides</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {past.map((b) => (
                  <BookingCard key={b.id} booking={b} showCancel={false} />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </main>
  )
}

function BookingCard({
  booking,
  showCancel,
}: {
  booking: {
    id: string
    seats: number
    totalPrice: unknown
    status: string
    ride: {
      id: string
      departureTime: Date
      pricePerSeat: { toString: () => string }
      driver: { id: string; name: string | null; image: string | null }
      fromLocation: { city: string; state?: string | null }
      toLocation: { city: string; state?: string | null }
    }
  }
  showCancel: boolean
}) {
  const total = Number(booking.totalPrice ?? 0)
  const canCancel =
    showCancel && (booking.status === "PENDING" || booking.status === "ACCEPTED")

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/rides/${booking.ride.id}`}
            className="font-semibold text-primary hover:underline"
          >
            {booking.ride.fromLocation.city} → {booking.ride.toLocation.city}
          </Link>
          <Badge variant={statusVariant[booking.status] ?? "outline"}>
            {statusLabel[booking.status] ?? booking.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(booking.ride.departureTime).toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link
            href={`/profile/${booking.ride.driver.id}`}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={booking.ride.driver.image ?? ""} />
              <AvatarFallback className="text-[10px]">
                {booking.ride.driver.name?.[0] ?? "D"}
              </AvatarFallback>
            </Avatar>
            <span>{booking.ride.driver.name ?? "Driver"}</span>
          </Link>
          <span className="flex items-center gap-1">
            <IndianRupee className="h-3.5 w-3.5" />
            {total > 0 ? `₹${total.toLocaleString()}` : "—"} ({booking.seats} seat
            {booking.seats !== 1 ? "s" : ""})
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/rides/${booking.ride.id}`}>View ride</Link>
        </Button>
        {canCancel && <CancelBookingButton bookingId={booking.id} />}
      </div>
    </div>
  )
}
