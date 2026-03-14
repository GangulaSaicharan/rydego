import { OfferRideForm } from "@/components/rides/OfferRideForm"

export default function PublishPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Publish a Ride</h2>
      </div>
      <OfferRideForm />
    </main>
  )
}
