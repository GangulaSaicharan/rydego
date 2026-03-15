import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, IndianRupee } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui"
import { cn } from "@/lib/utils"
import { CancelBookingButton } from "@/components/rides/CancelBookingButton"

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
  ride: {
    id: string
    departureTime: Date | string
    driver: { id: string; name: string | null; image: string | null }
    fromLocation: { city: string; state?: string | null }
    toLocation: { city: string; state?: string | null }
  }
}

export function BookingCard({
  booking,
  showCancel,
}: {
  booking: BookingCardBooking
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
        <Link
          href={`/rides/${booking.ride.id}`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          View ride
        </Link>
        {canCancel && <CancelBookingButton bookingId={booking.id} />}
      </div>
    </div>
  )
}
