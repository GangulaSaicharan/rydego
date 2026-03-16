"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Timer } from "lucide-react"
import { differenceInMinutes } from "date-fns"
import { formatDateTimeShortIST, formatTimeIST, formatTimeToDepartureIST } from "@/lib/date-time"

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
  const isFull = ride.seatsAvailable <= 0
  const href = `/rides/${ride.id}${backToSearchQuery ? `?${backToSearchQuery}` : ""}`
  const departureDate = new Date(ride.departureTime)
  const arrivalDate = ride.arrivalTime ? new Date(ride.arrivalTime) : null
  const durationMinutes =
    arrivalDate ? Math.max(0, differenceInMinutes(arrivalDate, departureDate)) : null
  const price =
    typeof ride.pricePerSeat === "string"
      ? parseFloat(ride.pricePerSeat).toFixed(0)
      : ride.pricePerSeat.toFixed(0)
  const timeToDeparture = formatTimeToDepartureIST(departureDate)

  return (
    <Card
      className={[
        "group overflow-hidden border shadow-sm transition-all duration-200 pb-0",
        isFull ? "opacity-60" : "hover:shadow-md hover:border-primary/20",
      ].join(" ")}
    >
      {isFull ? (
        <div className="block">
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
                          {formatDateTimeShortIST(departureDate)}
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
                            {formatTimeIST(arrivalDate)}
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

              {/* Driver name (truncated) + cost adjacent */}
              <div className="flex justify-between items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto p-3 sm:px-5 sm:py-4 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/30 sm:bg-muted/40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                    <AvatarImage src={ride.driver.image ?? ""} alt={ride.driver.name ?? ""} />
                    <AvatarFallback className="text-[10px] sm:text-xs">{ride.driver.name?.[0] ?? "D"}</AvatarFallback>
                  </Avatar>
                  <span className="truncate min-w-0 text-sm font-medium text-foreground" title={ride.driver.name ?? undefined}>
                    {ride.driver.name ?? "Driver"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-base sm:text-lg font-bold text-primary">₹{price}</span>
                  <span className="text-xs font-semibold text-destructive">Seats full</span>
                  {timeToDeparture && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="h-3 w-3 shrink-0" />
                      {timeToDeparture}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      ) : (
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
                          {formatDateTimeShortIST(departureDate)}
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
                            {formatTimeIST(arrivalDate)}
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

              {/* Driver name (truncated) + cost adjacent */}
              <div className="flex justify-between items-center gap-2 sm:gap-3 min-w-0 w-full sm:w-auto p-3 sm:px-5 sm:py-4 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/30 sm:bg-muted/40">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                    <AvatarImage src={ride.driver.image ?? ""} alt={ride.driver.name ?? ""} />
                    <AvatarFallback className="text-[10px] sm:text-xs">{ride.driver.name?.[0] ?? "D"}</AvatarFallback>
                  </Avatar>
                  <span className="truncate min-w-0 text-sm font-medium text-foreground" title={ride.driver.name ?? undefined}>
                    {ride.driver.name ?? "Driver"}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-base sm:text-lg font-bold text-primary">₹{price}</span>
                  <span className="text-xs text-muted-foreground">
                    {ride.seatsAvailable} seat{ride.seatsAvailable === 1 ? "" : "s"} left
                  </span>
                  {timeToDeparture && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Timer className="h-3 w-3 shrink-0" />
                      {timeToDeparture}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Link>
      )}
    </Card>
  )
}
