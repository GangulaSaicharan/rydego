"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InfiniteRidesList } from "./InfiniteRidesList"
import { InfiniteBookingsList } from "./InfiniteBookingsList"
import { RideDetailsModal } from "./RideDetailsModal"
import { RideStatus } from "@prisma/client"
import { RideRowRide } from "./RideRow"
import { BookingCardBooking } from "./BookingCard"

interface RidesDashboardContentProps {
  initialRides: (RideRowRide & { status: RideStatus })[]
  initialBookings: BookingCardBooking[]
  userId: string
}

export function RidesDashboardContent({
  initialRides,
  initialBookings,
  userId,
}: RidesDashboardContentProps) {
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)

  return (
    <>
      <Tabs defaultValue="offered" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="offered">Offered Rides</TabsTrigger>
          <TabsTrigger value="booked">My Bookings</TabsTrigger>
        </TabsList>
        <TabsContent value="offered" className="mt-6">
          <InfiniteRidesList 
            initialRides={initialRides} 
            userId={userId} 
            onViewDetails={setSelectedRideId}
          />
        </TabsContent>
        <TabsContent value="booked" className="mt-6">
          <InfiniteBookingsList 
            initialBookings={initialBookings} 
            onViewRide={setSelectedRideId}
          />
        </TabsContent>
      </Tabs>

      <RideDetailsModal 
        rideId={selectedRideId} 
        onClose={() => setSelectedRideId(null)} 
      />
    </>
  )
}
