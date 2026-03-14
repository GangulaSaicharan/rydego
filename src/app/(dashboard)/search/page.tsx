import { RideSearchForm } from "@/components/rides/RideSearchForm"
import { MapPin } from "lucide-react"

export default function SearchPage() {
  return (
    <main className="flex-1 min-h-0">
      {/* Hero search section */}
      <section className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground p-6 md:p-10 mb-8 shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#fff_1px,transparent_1px),linear-gradient(to_bottom,#fff_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-foreground/90 mb-1">
            <MapPin className="h-4 w-4" />
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
              Find a ride
            </h1>
          </div>
          <p className="mt-2 text-primary-foreground/80 text-sm md:text-base max-w-xl">
            Share trips, save money, and meet fellow travellers. Search by route and date.
          </p>
        </div>
      </section>

      <div className="space-y-6">
        <RideSearchForm />
      </div>
    </main>
  )
}
