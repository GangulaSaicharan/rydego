import { Badge } from "@/components/ui/badge"
import { ChevronRight, MapPin, User, Users } from "lucide-react"
import Link from "next/link"
import { RideRowAction } from "@/components/rides/RideRowAction"
import { formatDateTimeIST, formatTimeIST } from "@/lib/date-time"

export type RideRowRide = {
  id: string
  driverId: string
  departureTime: Date | string
  arrivalTime: Date | string | null
  pricePerSeat: { toString(): string } | number
  seatsAvailable: number
  seatsTotal: number
  driver: { name: string | null }
  fromLocation: { city: string; state: string | null }
  toLocation: { city: string; state: string | null }
}

export function RideRow({
  ride,
  userId,
  statusLabel,
  statusVariant,
  action,
  onViewDetails,
}: {
  ride: RideRowRide
  userId: string
  statusLabel: string
  statusVariant: "default" | "secondary" | "outline" | "destructive"
  action?: React.ReactNode
  onViewDetails?: (rideId: string) => void
}) {
  const isDriver = ride.driverId === userId
  const content = (
    <>
      <div className="flex flex-1 min-w-0 gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center text-sm font-bold truncate">
            <span className="truncate">{ride.fromLocation.city}</span>
            <ChevronRight className="h-3 w-3 mx-1 shrink-0 text-muted-foreground/50" />
            <span className="truncate">{ride.toLocation.city}</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">
            {formatDateTimeIST(ride.departureTime)}
            {ride.arrivalTime && (
              <span className="ml-1">→ Arrives {formatTimeIST(ride.arrivalTime)}</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <p className="text-sm font-bold text-primary">₹{typeof ride.pricePerSeat === "number" ? ride.pricePerSeat : ride.pricePerSeat.toString()}/seat</p>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {action && <RideRowAction>{action}</RideRowAction>}
          <Badge variant={statusVariant} className="text-[9px] uppercase tracking-tighter">
            {statusLabel}
          </Badge>
        </div>
      </div>
    </>
  )

  const containerClass = "flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors shadow-sm"

  if (onViewDetails) {
    return (
      <button
        onClick={() => onViewDetails(ride.id)}
        className={containerClass + " w-full text-left"}
      >
        {content}
      </button>
    )
  }

  return (
    <Link
      href={`/rides/${ride.id}`}
      className={containerClass}
    >
      {content}
    </Link>
  )
}
