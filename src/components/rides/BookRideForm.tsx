"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { IndianRupee, Loader2 } from "lucide-react"

import { createBookingAction } from "@/lib/actions/booking"
import { PROFILE_EDIT_PATH } from "@/lib/constants/routes"
import {
  Button, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui"

interface BookRideFormProps {
  rideId: string
  seatsAvailable: number
  pricePerSeat: number
  instantBooking: boolean
  /** Show "Rebook" instead of "Book" when passenger had a cancelled/declined booking */
  isRebook?: boolean
  onSuccess?: () => void
}

export function BookRideForm({
  rideId,
  seatsAvailable,
  pricePerSeat,
  instantBooking,
  isRebook = false,
  onSuccess,
}: BookRideFormProps) {
  const router = useRouter()
  const [seats, setSeats] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [profileError, setProfileError] = useState<boolean>(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const total = pricePerSeat * seats
  const maxSeats = Math.min(seatsAvailable, 10)

  async function handleConfirmBooking() {
    if (seats < 1 || seats > seatsAvailable) return
    setIsSubmitting(true)
    setProfileError(false)
    setIsConfirmOpen(false)
    try {
      const result = await createBookingAction({
        rideId,
        seats,
      })
      if (result.success) {
        toast.success(result.message ?? "Booking request sent")
        if (onSuccess) onSuccess()
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (seats < 1 || seats > seatsAvailable) return
    setIsConfirmOpen(true)
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

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="border-primary/10 shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">Confirm Booking</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 pt-2">
              <div className="space-y-2">
                <p>Are you sure you want to proceed with this booking?</p>
              </div>

              {instantBooking ? (
                <div className="flex flex-col gap-2 p-2 rounded-md bg-green-500/5 text-green-600 border border-green-500/10 text-xs">
                  <span className="font-semibold">Instant Booking:</span>
                  <span>Your seats will be reserved immediately.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 p-2 rounded-md bg-blue-500/5 text-blue-600 border border-blue-500/10 text-xs">
                  <span className="font-semibold">Booking Request:</span>
                  <span>The driver will review and confirm your request.</span>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBooking}>
              Confirm Booking
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  )
}
