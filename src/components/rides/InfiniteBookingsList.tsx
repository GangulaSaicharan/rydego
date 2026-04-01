"use client"

import { useState, useRef, useCallback } from "react"
import { BookingCard, type BookingCardBooking } from "./BookingCard"
import { fetchBookings } from "@/lib/actions/ride"
import { Loader2, Search } from "lucide-react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui"

interface InfiniteBookingsListProps {
  initialBookings: BookingCardBooking[]
  onViewRide?: (rideId: string) => void
}

function EmptySection() {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Search className="h-10 w-10 text-muted-foreground/60" />
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-medium text-foreground">No bookings yet</p>
        <p className="text-sm text-muted-foreground">Search for a ride to get started.</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href="/search" className={buttonVariants({ size: "sm" })}>
          Search for a ride
        </Link>
      </div>
    </div>
  )
}

export function InfiniteBookingsList({ initialBookings, onViewRide }: InfiniteBookingsListProps) {
  const [bookings, setBookings] = useState<BookingCardBooking[]>(initialBookings)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialBookings.length === 5)
  const observer = useRef<IntersectionObserver | null>(null)

  const lastBookingElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMoreBookings()
        }
      })
      if (node) observer.current.observe(node)
    },
    [loading, hasMore]
  )

  const loadMoreBookings = async () => {
    setLoading(true)
    try {
      const nextBookings = await fetchBookings({ page, pageSize: 5 })
      if (nextBookings.length < 5) {
        setHasMore(false)
      }
      setBookings((prev) => [...prev, ...nextBookings])
      setPage((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to fetch more bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  if (bookings.length === 0) {
    return <EmptySection />
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking, index) => {
        if (bookings.length === index + 1) {
          return (
            <div ref={lastBookingElementRef} key={booking.id}>
              <BookingCard booking={booking} showCancel={false} onViewRide={onViewRide} />
            </div>
          )
        }
        return <BookingCard key={booking.id} booking={booking} showCancel={false} onViewRide={onViewRide} />
      })}
      {loading && (
        <div className="flex justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
