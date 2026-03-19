"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IndianRupee, Loader2 } from "lucide-react"
import { createBookingAction } from "@/lib/actions/booking"
import { PROFILE_EDIT_PATH } from "@/lib/constants/routes"
import { toast } from "sonner"

interface BookRideFormProps {
  rideId: string
  seatsAvailable: number
  pricePerSeat: number
  instantBooking: boolean
  /** Show "Rebook" instead of "Book" when passenger had a cancelled/declined booking */
  isRebook?: boolean
}

export function BookRideForm({
  rideId,
  seatsAvailable,
  pricePerSeat,
  instantBooking,
  isRebook = false,
}: BookRideFormProps) {
  const router = useRouter()
  const [seats, setSeats] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<boolean>(false)

  const total = pricePerSeat * seats
  const maxSeats = Math.min(seatsAvailable, 10)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (seats < 1 || seats > seatsAvailable) return
    setIsSubmitting(true)
    setProfileError(false)
    try {
      const result = await createBookingAction({
        rideId,
        seats,
      })
      if (result.success) {
        toast.success(result.message ?? "Booking request sent")
        router.refresh()
      } else {
        if ("requiresProfile" in result && result.requiresProfile) {
          setProfileError(true)
        }
        toast.error(result.error ?? "Failed to book")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="seats">Number of seats</Label>
        <Select
          value={seats.toString()}
          onValueChange={(v) => { if (v != null) setSeats(parseInt(v, 10)) }}
        >
          <SelectTrigger id="seats">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: maxSeats }, (_, i) => i + 1).map((n) => (
              <SelectItem key={n} value={n.toString()}>
                {n} seat{n > 1 ? "s" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 text-lg font-bold text-primary pt-2">
        <IndianRupee className="h-5 w-5" />
        Total: ₹{total.toLocaleString()}
      </div>

      <div className="space-y-2">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isRebook
                ? instantBooking
                  ? "Rebooking…"
                  : "Sending rebook request…"
                : instantBooking
                  ? "Booking…"
                  : "Sending request…"}
            </>
          ) : isRebook ? (
            instantBooking ? "Rebook now" : "Request to rebook"
          ) : instantBooking ? (
            "Book now"
          ) : (
            "Request to book"
          )}
        </Button>
        {profileError && (
          <p className="text-center text-sm">
            <Link
              href={PROFILE_EDIT_PATH}
              className="text-primary font-medium underline underline-offset-2 hover:no-underline"
            >
              Add your phone number in Edit profile →
            </Link>
          </p>
        )}
      </div>
    </form>
  )
}
