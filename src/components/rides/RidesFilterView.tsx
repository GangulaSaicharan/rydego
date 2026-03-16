"use client"

import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { buttonVariants } from "@/components/ui"
import { Calendar, CheckCircle2, Loader2, PlusCircle } from "lucide-react"
import { CancelRideButton } from "@/components/rides/CancelRideButton"
import { RideRow, type RideRowRide } from "./RideRow"

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

const emptyMessages: Record<string, string> = {
  upcoming: "No upcoming rides",
  inProgress: "No rides in progress",
  completed: "No completed rides yet",
}

const filters = ["upcoming", "inProgress", "completed"] as const
type Filter = (typeof filters)[number]

export function RidesFilterView({
  currentFilter,
  rides,
  userId,
}: {
  currentFilter: Filter
  rides: RideRowRide[]
  userId: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const setFilter = (value: string) => {
    const next = new URLSearchParams(searchParams)
    next.set("filter", value)
    router.push(`/rides?${next.toString()}`)
  }

  return (
    <Tabs
      value={currentFilter}
      onValueChange={(v) => setFilter(v)}
      className="w-full"
    >
      <TabsList className="mb-4">
        <TabsTrigger value="upcoming" className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" />
          Upcoming
        </TabsTrigger>
        <TabsTrigger value="inProgress" className="flex items-center gap-1.5">
          <Loader2 className="h-4 w-4 text-amber-500" />
          In progress
        </TabsTrigger>
        <TabsTrigger value="completed" className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Completed
        </TabsTrigger>
      </TabsList>
      <TabsContent value={currentFilter} className="mt-0">
        <span className="sr-only">
          {currentFilter === "upcoming" && "Rides that haven't started yet"}
          {currentFilter === "inProgress" && "Rides currently on the way"}
          {currentFilter === "completed" && "Past rides"}
        </span>
        {rides.length > 0 ? (
          <div className="space-y-3">
            {rides.map((ride) => (
              <RideRow
                key={ride.id}
                ride={ride}
                userId={userId}
                statusLabel={
                  currentFilter === "upcoming"
                    ? "Scheduled"
                    : currentFilter === "inProgress"
                      ? "Started"
                      : "Completed"
                }
                statusVariant={
                  currentFilter === "upcoming"
                    ? "secondary"
                    : currentFilter === "inProgress"
                      ? "default"
                      : "outline"
                }
                action={
                  currentFilter === "upcoming" && ride.driverId === userId ? (
                    <CancelRideButton rideId={ride.id} size="icon" compact />
                  ) : undefined
                }
              />
            ))}
          </div>
        ) : (
          <EmptySection message={emptyMessages[currentFilter] ?? "No rides"} />
        )}
      </TabsContent>
    </Tabs>
  )
}
