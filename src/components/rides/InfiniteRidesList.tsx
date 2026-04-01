"use client"

import { useState, useRef, useCallback } from "react"
import { RideRow, type RideRowRide } from "./RideRow"
import { fetchRides } from "@/lib/actions/ride"
import { Loader2, PlusCircle } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui"
import { RideStatus } from "@prisma/client"

interface InfiniteRidesListProps {
  initialRides: (RideRowRide & { status: RideStatus })[]
  userId: string
  onViewDetails?: (rideId: string) => void
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <PlusCircle className="h-10 w-10 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/publish" className={buttonVariants({ size: "sm" })}>
        Publish a ride
      </Link>
    </div>
  )
}

export function InfiniteRidesList({ initialRides, userId, onViewDetails }: InfiniteRidesListProps) {
  const [rides, setRides] = useState<(RideRowRide & { status: RideStatus })[]>(initialRides)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialRides.length === 5)
  const observer = useRef<IntersectionObserver | null>(null)

  const lastRideElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreRides()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  const loadMoreRides = async () => {
    setLoading(true)
    try {
      const nextRides = await fetchRides({ page, pageSize: 5 })
      if (nextRides.length < 5) {
        setHasMore(false)
      }
      setRides((prev) => [...prev, ...nextRides])
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to fetch more rides:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: RideStatus) => {
    switch (status) {
      case RideStatus.STARTED:
        return { label: "Started", variant: "default" as const }
      case RideStatus.COMPLETED:
        return { label: "Completed", variant: "outline" as const }
      case RideStatus.CANCELLED:
        return { label: "Cancelled", variant: "destructive" as const }
      case RideStatus.SCHEDULED:
      default:
        return { label: "Scheduled", variant: "secondary" as const }
    }
  }

  if (rides.length === 0) {
    return <EmptySection message="No rides found" />
  }

  return (
    <div className="space-y-3">
      {rides.map((ride, index) => {
        const { label, variant } = getStatusInfo(ride.status)
        
        if (rides.length === index + 1) {
          return (
            <div ref={lastRideElementRef} key={ride.id}>
              <RideRow
                ride={ride}
                userId={userId}
                statusLabel={label}
                statusVariant={variant}
                onViewDetails={onViewDetails}
              />
            </div>
          )
        }
        return (
          <RideRow
            key={ride.id}
            ride={ride}
            userId={userId}
            statusLabel={label}
            statusVariant={variant}
            onViewDetails={onViewDetails}
          />
        )
      })}
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
