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
import { Trash2 } from "lucide-react"
import { deleteRideAction } from "@/lib/actions/ride"
import { toast } from "sonner"

interface CancelRideButtonProps {
  rideId: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  /** If true, show icon-only label for compact use (e.g. in list rows) */
  compact?: boolean
}

export function CancelRideButton({
  rideId,
  variant = "ghost",
  size = "sm",
  className,
  compact = false,
}: CancelRideButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  function handleOpenDialog(e?: React.MouseEvent) {
    e?.preventDefault()
    e?.stopPropagation()
    setOpen(true)
  }

  async function handleConfirmCancel() {
    setLoading(true)
    try {
      const result = await deleteRideAction(rideId)
      if (result.success) {
        toast.success("Ride cancelled")
        setOpen(false)
        router.push("/rides")
        router.refresh()
      } else {
        toast.error(result.error ?? "Failed to cancel ride")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={"text-destructive hover:text-destructive hover:bg-destructive/10 " + (compact ? "shrink-0 " : "") + (className ?? "")}
        onClick={handleOpenDialog}
      >
        {compact ? (
          <Trash2 className="h-4 w-4" aria-label="Cancel ride" />
        ) : (
          <>
            <Trash2 className="h-4 w-4 mr-1" />
            Cancel ride
          </>
        )}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel ride?</AlertDialogTitle>
            <AlertDialogDescription>
              All bookings will be cancelled. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep ride</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={loading}
            >
              {loading ? "..." : "Yes, cancel ride"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
