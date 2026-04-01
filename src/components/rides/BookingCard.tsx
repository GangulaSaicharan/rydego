import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, IndianRupee, MessageCircle } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui"
import { cn } from "@/lib/utils"
import { CancelBookingButton } from "@/components/rides/CancelBookingButton"
import {
  formatDateTimeIST,
  formatRelativeTimeIST,
  formatTimeToDepartureIST,
} from "@/lib/date-time"
import { ShareRideWhatsAppButton } from "@/components/rides/ShareRideWhatsAppButton"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  COMPLETED: "outline",
}

const statusLabel: Record<string, string> = {
  PENDING: "Pending",
  ACCEPTED: "Confirmed",
  REJECTED: "Declined",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
}

export type BookingCardBooking = {
  id: string
  seats: number
  totalPrice: number | null
  status: string
  createdAt: string
  ride: {
    id: string
    departureTime: Date | string
    status?: string
    driver: { id: string; name: string | null; image: string | null }
    fromLocation: { city: string; state?: string | null }
    toLocation: { city: string; state?: string | null }
  }
}

export function BookingCard({
  booking,
  showCancel,
  onViewRide,
}: {
  booking: BookingCardBooking
  showCancel: boolean
  onViewRide?: (rideId: string) => void
}) {
  const total = Number(booking.totalPrice ?? 0)
  const canCancel =
    showCancel && (booking.status === "PENDING" || booking.status === "ACCEPTED")
  const isInProgress =
    booking.status === "ACCEPTED" && booking.ride.status === "STARTED"
  const timeToDeparture = formatTimeToDepartureIST(booking.ride.departureTime)
  const createdAgo = formatRelativeTimeIST(booking.createdAt)

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {onViewRide ? (
            <button
              onClick={() => onViewRide(booking.ride.id)}
              className="font-semibold text-primary hover:underline text-left"
            >
              {booking.ride.fromLocation.city} → {booking.ride.toLocation.city}
            </button>
          ) : (
            <Link
              href={`/rides/${booking.ride.id}`}
              className="font-semibold text-primary hover:underline"
            >
              {booking.ride.fromLocation.city} → {booking.ride.toLocation.city}
            </Link>
          )}
          <Badge variant={isInProgress ? "default" : statusVariant[booking.status] ?? "outline"}>
            {isInProgress ? "In progress" : statusLabel[booking.status] ?? booking.status}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <p className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDateTimeIST(booking.ride.departureTime)}
          </p>
          {timeToDeparture && (
            <span className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              {timeToDeparture}
            </span>
          )}
        </div>
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
        <p className="text-xs text-muted-foreground">
          Booked {createdAgo}
        </p>
      </div>
      <div className="flex justify-between items-center gap-2">
          {onViewRide ? (
            <button
              onClick={() => onViewRide(booking.ride.id)}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
            >
              View ride
            </button>
          ) : (
            <Link
              href={`/rides/${booking.ride.id}`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
            >
              View ride
            </Link>
          )}
          <ShareRideWhatsAppButton
            rideId={booking.ride.id}
            fromCity={booking.ride.fromLocation.city}
            toCity={booking.ride.toLocation.city}
            departureTime={new Date(booking.ride.departureTime)}
            seatsAvailable={booking.seats}
            driverName={booking.ride.driver.name}
            driverPhone={null}
            vehicleInfo={null}
          />
      </div>
    </div>
  )
}
