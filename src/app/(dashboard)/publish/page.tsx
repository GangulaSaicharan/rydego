import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { OfferRideForm } from "@/components/rides/OfferRideForm"

export const metadata: Metadata = {
  title: "Publish a Ride",
  description: "Offer a ride on RydeGo. Set route, date, time, and price.",
};

export default async function PublishPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Publish a Ride</h2>
      </div>
      <OfferRideForm />
    </main>
  )
}
