import type { Metadata } from "next"
import { RideSearchForm } from "@/components/rides/RideSearchForm"
import { MapPin } from "lucide-react"

export const metadata: Metadata = {
  title: "Find a Ride",
  description: "Search for rides by route and date. Share trips and save with RydeGo.",
};

export default function SearchPage() {
  return (
    <main className="flex-1 min-h-0 flex flex-col items-center">
      {/* Short hero */}
      <section className="w-full max-w-3xl mx-auto relative overflow-hidden rounded-xl md:rounded-2xl mb-6 shadow-lg ring-1 ring-black/5">
        <div className="absolute inset-0 bg-linear-to-br from-[#0f766e] via-[#0d9488] to-[#059669]" />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative px-4 py-3 md:px-5 md:py-4 flex items-center gap-3 text-white">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight md:text-xl">Find a ride</h1>
            <p className="text-white/85 text-xs md:text-sm">Share trips, save money.</p>
          </div>
        </div>
      </section>

      {/* Centered search */}
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <RideSearchForm />
      </div>
    </main>
  )
}
