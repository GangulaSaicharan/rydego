"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { updateBookingStatusAction } from "@/lib/actions/booking"
import { toast } from "sonner"

interface CancelBookingButtonProps {
  bookingId: string
}

export function CancelBookingButton({ bookingId }: CancelBookingButtonProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCancel() {
    if (!confirm("Cancel this booking? Seats will be freed for others.")) return
    setIsSubmitting(true)
    try {
      const result = await updateBookingStatusAction(bookingId, "CANCELLED")
      if (result.success) {
        toast.success("Booking cancelled")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to cancel")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive hover:bg-destructive/10"
      onClick={handleCancel}
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <X className="h-4 w-4 mr-1" />
          Cancel
        </>
      )}
    </Button>
  )
}
