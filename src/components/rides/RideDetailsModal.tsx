"use client"

import { useState, useEffect } from "react"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui"
import { getRideDetailAction } from "@/lib/actions/ride"
import { RideDetailsContent } from "./RideDetailsContent"
import { Loader2 } from "lucide-react"

interface RideDetailsModalProps {
  rideId: string | null
  userId?: string
  onClose: () => void
}

export function RideDetailsModal({ rideId, userId, onClose }: RideDetailsModalProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (rideId) {
      setLoading(true)
      setError(null)
      setData(null)
      getRideDetailAction(rideId)
        .then((res) => {
          if (res.success) {
            setData(res)
          } else {
            setError(res.error || "Failed to load ride details")
          }
        })
        .catch(() => {
          setError("An unexpected error occurred")
        })
        .finally(() => setLoading(false))
    } else {
      setData(null)
      setError(null)
      setLoading(false)
    }
  }, [rideId])

  return (
    <AlertDialog open={!!rideId} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border-none shadow-2xl bg-background">
        <AlertDialogHeader className="sr-only">
          <AlertDialogTitle>Ride Details</AlertDialogTitle>
          <AlertDialogDescription>
            Detailed information about the selected ride.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs z-50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Loading ride details...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-4">
                <p className="text-destructive font-bold text-xl">!</p>
              </div>
              <h3 className="text-lg font-semibold mb-2">Error loading details</h3>
              <p className="text-muted-foreground mb-6 max-w-xs">{error}</p>
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
              >
                Close
              </button>
            </div>
          )}

          {data && (
            <div className="p-4 md:p-8">
              <RideDetailsContent 
                {...data} 
                isModal 
                onClose={onClose} 
                userId={userId} 
              />
            </div>
          )}
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
