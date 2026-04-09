"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { X } from "lucide-react"
import { updateBookingStatusAction } from "@/lib/actions/booking"
import { toast } from "sonner"

interface CancelBookingButtonProps {
  bookingId: string
  onSuccess?: () => void
}

export function CancelBookingButton({ bookingId, onSuccess }: CancelBookingButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirmCancel() {
    setLoading(true)
    try {
      const result = await updateBookingStatusAction(bookingId, "CANCELLED")
      if (result.success) {
        toast.success("Booking cancelled")
        setOpen(false)
        if (onSuccess) onSuccess()
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to cancel")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </>
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Seats will be freed for others. You can request again if the ride is still available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep booking</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={loading}
            >
              {loading ? "..." : "Yes, cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
