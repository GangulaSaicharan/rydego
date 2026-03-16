"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buttonVariants } from "@/components/ui"
import { Calendar, Search, TicketCheck, Loader2 } from "lucide-react"
import { BookingCard, type BookingCardBooking } from "./BookingCard"

const emptyMessages: Record<string, string> = {
  upcoming: "No upcoming bookings",
  inProgress: "No bookings in progress",
  past: "No past bookings",
}

const filters = ["upcoming", "inProgress", "past"] as const
type Filter = (typeof filters)[number]

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <Search className="h-10 w-10 text-muted-foreground/60" />
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link href="/search" className={buttonVariants({ size: "sm" })}>
        Search rides
      </Link>
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
          <EmptySection message={emptyMessages[currentFilter] ?? "No bookings"} />
        )}
      </TabsContent>
    </Tabs>
  )
}
