"use client"

import { useEffect } from "react"
import { incrementRideViewAction } from "@/lib/actions/ride"

interface RideViewTrackerProps {
  rideId: string
}

export function RideViewTracker({ rideId }: RideViewTrackerProps) {
  useEffect(() => {
    const trackView = async () => {
      try {
        await incrementRideViewAction(rideId)
      } catch (error) {
        console.error("Failed to track ride view:", error)
      }
    }
    
    trackView()
  }, [rideId])

  return null
}
