"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
}

export function BookRideForm({
  rideId,
  seatsAvailable,
  pricePerSeat,
  instantBooking,
}: BookRideFormProps) {
  const router = useRouter()
  const [seats, setSeats] = useState(1)
  const [pickupNote, setPickupNote] = useState("")
  const [dropNote, setDropNote] = useState("")
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
        pickupNote: pickupNote.trim() || undefined,
        dropNote: dropNote.trim() || undefined,
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

      <div className="space-y-2">
        <Label htmlFor="pickupNote">Pickup note (optional)</Label>
        <Textarea
          id="pickupNote"
          placeholder="e.g. Near the main gate"
          value={pickupNote}
          onChange={(e) => setPickupNote(e.target.value)}
          rows={2}
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dropNote">Drop note (optional)</Label>
        <Textarea
          id="dropNote"
          placeholder="e.g. Drop at bus stop"
          value={dropNote}
          onChange={(e) => setDropNote(e.target.value)}
          rows={2}
          className="resize-none"
        />
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
              {instantBooking ? "Booking…" : "Sending request…"}
            </>
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
