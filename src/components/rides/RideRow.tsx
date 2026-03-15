import { Badge } from "@/components/ui/badge"
import { ChevronRight, MapPin, User, Users } from "lucide-react"
import Link from "next/link"
import { RideRowAction } from "@/components/rides/RideRowAction"

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
}: {
  ride: RideRowRide
  userId: string
  statusLabel: string
  statusVariant: "default" | "secondary" | "outline" | "destructive"
  action?: React.ReactNode
}) {
  const isDriver = ride.driverId === userId
  return (
    <Link
      href={`/rides/${ride.id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors shadow-sm"
    >
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
            {new Date(ride.departureTime).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {ride.arrivalTime && (
              <span className="ml-1">→ Arrives {new Date(ride.arrivalTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ride.driver.name ?? "Driver"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {ride.seatsAvailable} / {ride.seatsTotal} seats
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <p className="text-sm font-bold text-primary">₹{typeof ride.pricePerSeat === "number" ? ride.pricePerSeat : ride.pricePerSeat.toString()}/seat</p>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {action && <RideRowAction>{action}</RideRowAction>}
          <Badge variant={statusVariant} className="text-[9px] uppercase tracking-tighter">
            {statusLabel}
          </Badge>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded uppercase tracking-tighter">
            {isDriver ? "Driving" : "Booked"}
          </span>
        </div>
      </div>
    </Link>
  )
}
