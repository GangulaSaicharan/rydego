"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Loader2 } from "lucide-react"
import { updateBookingStatusAction } from "@/lib/actions/booking"
import { toast } from "sonner"
import Link from "next/link"

type BookingWithPassenger = {
  id: string
  seats: number
  totalPrice: number | null
  status: string
  pickupNote: string | null
  dropNote: string | null
  passenger: {
    id: string
    name: string | null
    image: string | null
    email: string | null
  }
}

interface DriverBookingListProps {
  rideId: string
  bookings: BookingWithPassenger[]
}

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PENDING: "secondary",
  ACCEPTED: "default",
  REJECTED: "destructive",
  CANCELLED: "destructive",
  COMPLETED: "outline",
}

export function DriverBookingList({ rideId, bookings }: DriverBookingListProps) {
  const router = useRouter()
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const pending = bookings.filter((b) => b.status === "PENDING")
  const others = bookings.filter((b) => b.status !== "PENDING")

  async function handleStatus(bookingId: string, status: "ACCEPTED" | "REJECTED" | "CANCELLED") {
    setUpdatingId(bookingId)
    try {
      const result = await updateBookingStatusAction(bookingId, status)
      if (result.success) {
        if (status === "ACCEPTED") toast.success("Request accepted")
        else if (status === "REJECTED") toast.success("Request rejected")
        else toast.success("Passenger removed from ride")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to update")
      }
    } finally {
      setUpdatingId(null)
    }
  }

  if (bookings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No booking requests yet.</p>
    )
  }

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Pending ({pending.length})
          </p>
          <ul className="space-y-3">
            {pending.map((b) => (
              <li
                key={b.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-muted/30"
              >
                <Link
                  href={`/profile/${b.passenger.id}`}
                  className="flex items-center gap-3 min-w-0 flex-1"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={b.passenger.image ?? ""} alt={b.passenger.name ?? ""} />
                    <AvatarFallback>{b.passenger.name?.[0] ?? "P"}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{b.passenger.name ?? "Passenger"}</p>
                    {b.passenger.email && (
                      <p className="text-xs text-muted-foreground truncate">{b.passenger.email}</p>
                    )}
                    <p className="text-xs text-primary">
                      {b.seats} seat{b.seats !== 1 ? "s" : ""} · ₹{b.totalPrice?.toLocaleString() ?? "—"}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => handleStatus(b.id, "ACCEPTED")}
                    disabled={updatingId !== null}
                  >
                    {updatingId === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStatus(b.id, "REJECTED")}
                    disabled={updatingId !== null}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {others.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Other bookings
          </p>
          <ul className="space-y-2">
            {others.map((b) => (
              <li
                key={b.id}
                className="flex items-center gap-3 p-2 rounded-lg border"
              >
                <Link href={`/profile/${b.passenger.id}`} className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={b.passenger.image ?? ""} alt={b.passenger.name ?? ""} />
                    <AvatarFallback>{b.passenger.name?.[0] ?? "P"}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium truncate">{b.passenger.name ?? "Passenger"}</span>
                </Link>
                <Badge variant={statusVariant[b.status] ?? "outline"} className="shrink-0">
                  {b.status}
                </Badge>
                {b.status === "ACCEPTED" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleStatus(b.id, "CANCELLED")}
                    disabled={updatingId !== null}
                  >
                    {updatingId === b.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
