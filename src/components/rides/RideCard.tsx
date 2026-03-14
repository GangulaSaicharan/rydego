"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, ChevronRight, Timer } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { differenceInMinutes } from "date-fns"

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

interface RideCardProps {
  ride: {
    id: string
    departureTime: string | Date
    arrivalTime?: string | Date | null
    pricePerSeat: string | number
    seatsAvailable: number
    seatsTotal: number
    fromLocation: { city: string; state?: string | null }
    toLocation: { city: string; state?: string | null }
    driver: { id: string; name: string | null; image: string | null }
  }
  /** When set, appended to ride detail URL so Back from details returns to search results */
  backToSearchQuery?: string
}

export function RideCard({ ride, backToSearchQuery }: RideCardProps) {
  const href = `/rides/${ride.id}${backToSearchQuery ? `?${backToSearchQuery}` : ""}`
  const departureDate = new Date(ride.departureTime)
  const arrivalDate = ride.arrivalTime ? new Date(ride.arrivalTime) : null
  const durationMinutes =
    arrivalDate ? Math.max(0, differenceInMinutes(arrivalDate, departureDate)) : null
  const price =
    typeof ride.pricePerSeat === "string"
      ? parseFloat(ride.pricePerSeat).toFixed(0)
      : ride.pricePerSeat.toFixed(0)

  return (
    <Card className="group overflow-hidden border shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 pb-0">
      <Link href={href} className="block">
        <CardContent className="p-0">
          <div className="flex flex-col sm:flex-row">
            {/* Route: line with duration between locations */}
            <div className="flex-1 flex items-stretch gap-3 p-2 sm:p-3 min-h-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex flex-col items-center shrink-0">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/10" />
                  {durationMinutes !== null ? (
                    <>
                      <div className="w-0.5 min-h-[10px] bg-linear-to-b from-primary to-primary/50 rounded-full" />
                      <div className="flex items-center justify-center gap-1 py-0.5 text-muted-foreground text-xs whitespace-nowrap">
                        <Timer className="h-3 w-3 shrink-0" />
                        {formatDuration(durationMinutes)}
                      </div>
                      <div className="w-0.5 flex-1 min-h-[10px] bg-linear-to-b from-primary/50 to-primary/30 rounded-full" />
                    </>
                  ) : (
                    <div className="w-0.5 flex-1 min-h-[20px] bg-linear-to-b from-primary to-primary/30 rounded-full my-0.5" />
                  )}
                  <div className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/10" />
                </div>
                <div className="flex flex-col justify-between gap-2 min-w-0 py-0.5">
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm leading-tight">
                        {ride.fromLocation.city}
                      </p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(departureDate, "EEE, d MMM · h:mm a")}
                      </span>
                    </div>
                    {ride.fromLocation.state && (
                      <p className="text-xs text-muted-foreground">
                        {ride.fromLocation.state}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <p className="font-semibold text-foreground text-sm leading-tight">
                        {ride.toLocation.city}
                      </p>
                      {arrivalDate && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(arrivalDate, "h:mm a")}
                        </span>
                      )}
                    </div>
                    {ride.toLocation.state && (
                      <p className="text-xs text-muted-foreground">
                        {ride.toLocation.state}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price, seats & CTA */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 sm:gap-3 p-3 sm:p-4 border-t sm:border-t-0 sm:border-l bg-muted/30">
              <div className="flex items-center gap-4 sm:flex-col sm:gap-2 sm:items-end">
                <div className="flex justify-between">
                  <p className="text-xl font-bold text-primary">₹{price}</p>
                  <p className="text-xs text-muted-foreground ml-1">per seat</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{ride.seatsAvailable} seat{ride.seatsAvailable !== 1 ? "s" : ""} left</span>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center justify-center gap-1 rounded-md text-sm font-medium h-9 px-4 shrink-0",
                  "bg-primary text-primary-foreground shadow hover:bg-primary/90"
                )}
              >
                Details
                <ChevronRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Link>
    </Card>
  )
}
