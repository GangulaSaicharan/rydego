import type { Metadata } from "next"
import Link from "next/link"
import { auth } from "@/auth"
import { buttonVariants } from "@/components/ui"
import { PlusCircle } from "lucide-react"
import { APP_NAME } from "@/lib/constants/brand"
import { RidesDashboardContent } from "@/components/rides/RidesDashboardContent"
import { fetchRides, fetchBookings } from "@/lib/actions/ride"

export const metadata: Metadata = {
  title: "My Rides & Bookings",
  description: `View and manage your offered rides and bookings on ${APP_NAME}.`,
  robots: {
    index: false,
    follow: false,
  },
}

export default async function RidesPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null
  const isAdmin = session.user.role === "ADMIN"

  // Fetch initial data
  const [rides, bookings] = await Promise.all([
    fetchRides({ page: 0, pageSize: 5 }),
    fetchBookings({ page: 0, pageSize: 5 }),
  ])

  return (
    <main className="flex-1 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-3xl font-bold tracking-tight">My Rides</h2>
        {isAdmin && (
          <Link href="/publish" className={buttonVariants({ size: "sm" })}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Publish a ride
          </Link>
        )}
      </div>

      <RidesDashboardContent 
        initialRides={rides as any} 
        initialBookings={bookings as any} 
        userId={userId} 
      />
    </main>
  )
}
