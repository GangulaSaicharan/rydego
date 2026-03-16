"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buttonVariants } from "@/components/ui"
import { Calendar, Search, TicketCheck, Loader2 } from "lucide-react"
import { BookingCard, type BookingCardBooking } from "./BookingCard"

const filters = ["upcoming", "inProgress", "past"] as const
type Filter = (typeof filters)[number]

function EmptySection({ filter }: { filter: Filter }) {
  const title =
    filter === "upcoming"
      ? "No upcoming rides yet"
      : filter === "inProgress"
        ? "No rides in progress"
        : "No past rides yet"

  const body =
    filter === "upcoming"
      ? "You don't have any upcoming rides. Search for a ride to get started."
      : filter === "inProgress"
        ? "When your driver starts the trip, it will appear here so you can track it in real time."
        : "Once you complete rides, they'll show up here so you can review your past trips."

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <Search className="h-10 w-10 text-muted-foreground/60" />
      <div className="space-y-1 max-w-md">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Link href="/search" className={buttonVariants({ size: "sm" })}>
          {filter === "upcoming" ? "Search or create a ride" : "Search rides"}
        </Link>
      </div>
      {filter === "inProgress" && (
        <p className="text-xs text-muted-foreground">
          Track your ride on this screen once it starts.
        </p>
      )}
      {filter === "past" && (
        <p className="text-xs text-muted-foreground">
          Want to share your experience? <span className="underline underline-offset-2">Leave
          feedback</span> (coming soon).
        </p>
      )}
    </div>
  )
}

export function BookingsFilterView({
  currentFilter,
  bookings,
}: {
  currentFilter: Filter
  bookings: BookingCardBooking[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setFilter = (value: string) => {
    if (!filters.includes(value as Filter)) return
    const next = new URLSearchParams(searchParams)
    next.set("filter", value)
    router.push(`/bookings?${next.toString()}`)
  }

  return (
    <Tabs
      value={currentFilter}
      onValueChange={(v) => setFilter(v)}
      className="w-full"
    >
      <TabsList className="mb-4 mx-auto w-fit justify-center">
        <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="inProgress" className="flex items-center gap-1.5">
          <Loader2 className="h-4 w-4 text-amber-500" />
          In progress
        </TabsTrigger>
        <TabsTrigger value="past" className="flex items-center gap-1.5">
          <TicketCheck className="h-4 w-4 text-green-600" />
          Past
        </TabsTrigger>
      </TabsList>
      <TabsContent value={currentFilter} className="mt-0">
        <span className="sr-only">
          {currentFilter === "upcoming" && "Confirmed rides"}
          {currentFilter === "inProgress" && "Rides currently on the way"}
          {currentFilter === "past" && "Previous requests and rides"}
        </span>
        {bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} showCancel={false} />
            ))}
          </div>
        ) : (
          <EmptySection filter={currentFilter} />
        )}
      </TabsContent>
    </Tabs>
  )
}
