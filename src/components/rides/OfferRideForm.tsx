"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { createRideAction, getCitiesAction } from "@/lib/actions/ride"
import { listMyVehiclesAction } from "@/lib/actions/vehicle"
import { PROFILE_EDIT_PATH } from "@/lib/constants/routes"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"


const VEHICLES_CACHE_KEY = "my-vehicles-v1"

function nowISTDateTimeLocalString(): string {
  // `datetime-local` expects "YYYY-MM-DDTHH:mm" without timezone.
  // We show/validate this form in IST, regardless of the viewer's system timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ""

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`
}

export function OfferRideForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresProfile, setRequiresProfile] = useState(false)
  const [cities, setCities] = useState<{ id: string; city: string }[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)
  const [vehicles, setVehicles] = useState<
    { id: string; brand: string; model: string; color: string | null; plateNumber: string; seats: number }[]
  >([])
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [minDateTime, setMinDateTime] = useState<string>("")
  const [vehicleId, setVehicleId] = useState<string>("")
  const [fromLocationId, setFromLocationId] = useState<string>("")
  const [toLocationId, setToLocationId] = useState<string>("")

  useEffect(() => {
    async function fetchCities() {
      const result = await getCitiesAction()
      if (result.success && result.cities) {
        setCities(result.cities)
      }
      setCitiesLoading(false)
    }
    fetchCities()
  }, [])

  useEffect(() => {
    async function fetchVehicles() {
      try {
        // Prefer cached vehicles to avoid refetching every time.
        try {
          const cached = sessionStorage.getItem(VEHICLES_CACHE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached) as typeof vehicles
            if (Array.isArray(parsed)) {
              setVehicles(parsed)
              setVehiclesLoading(false)
              return
            }
          }
        } catch {
          // ignore cache parse errors
        }

        const result = await listMyVehiclesAction()
        if (result.success && result.vehicles) {
          const next = result.vehicles.map((v) => ({
            id: v.id,
            brand: v.brand,
            model: v.model,
            color: v.color ?? null,
            plateNumber: v.plateNumber,
            seats: v.seats,
          }))
          setVehicles(next)
          try {
            sessionStorage.setItem(VEHICLES_CACHE_KEY, JSON.stringify(next))
          } catch {
            // ignore
          }
        }
      } finally {
        setVehiclesLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    // Keep min reasonably fresh for users leaving the form open.
    const update = () => setMinDateTime(nowISTDateTimeLocalString())
    update()
    const id = window.setInterval(update, 30_000)
    return () => window.clearInterval(id)
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!vehiclesLoading && vehicles.length === 0) {
      toast.error("Add a vehicle to create a ride")
      return
    }
    setLoading(true)
    setError(null)
    setRequiresProfile(false)

    const formData = new FormData(event.currentTarget)
    
    try {
      const result = await createRideAction(formData)
      if (result.success) {
        toast.success("Ride published successfully")
        router.push("/dashboard")
      } else {
        setError(result.error || "Failed to create ride")
        setRequiresProfile("requiresProfile" in result && result.requiresProfile === true)
        toast.error(result.error ?? "Failed to create ride")
      }
    } catch {
      setError("An unexpected error occurred")
      toast.error("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ride Details</CardTitle>
        <CardDescription>Enter the details of the ride you&apos;re offering.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          {error && !requiresProfile && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <p>{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="vehicleId">Vehicle</Label>
            <Select name="vehicleId" required value={vehicleId || null} onValueChange={(v) => setVehicleId(v ?? "")}>
              <SelectTrigger className="w-full">
                {vehicleId ? (
                  <span className="flex flex-1 text-left">
                    {(() => {
                      const v = vehicles.find((x) => x.id === vehicleId)
                      return v ? `${v.brand} ${v.model} • ${v.plateNumber} • ${v.seats} seats` : "Selected vehicle"
                    })()}
                  </span>
                ) : (
                  <span className="flex flex-1 text-left text-muted-foreground">
                    {vehiclesLoading
                      ? "Loading vehicles..."
                      : vehicles.length === 0
                        ? "No vehicles found"
                        : "Select vehicle"}
                  </span>
                )}
              </SelectTrigger>
              <SelectContent>
                {vehiclesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading vehicles...
                  </SelectItem>
                ) : vehicles.length === 0 ? (
                  <SelectItem value="none" disabled>
                    Add a vehicle in Settings → Vehicles
                  </SelectItem>
                ) : (
                  vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.brand} {v.model} • {v.plateNumber} • {v.seats} seats
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!vehiclesLoading && vehicles.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You need to add a vehicle first.{" "}
                <Link href="/settings/vehicles" className="underline underline-offset-2">
                  manage vehicles
                </Link>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromCity">From City</Label>
              <Select
                name="fromLocationId"
                required
                value={fromLocationId || null}
                onValueChange={(v) => setFromLocationId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  {fromLocationId ? (
                    <span className="flex flex-1 text-left">
                      {cities.find((c) => c.id === fromLocationId)?.city ?? "Selected city"}
                    </span>
                  ) : (
                    <span className="flex flex-1 text-left text-muted-foreground">Select departure city</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCity">To City</Label>
              <Select
                name="toLocationId"
                required
                value={toLocationId || null}
                onValueChange={(v) => setToLocationId(v ?? "")}
              >
                <SelectTrigger className="w-full">
                  {toLocationId ? (
                    <span className="flex flex-1 text-left">
                      {cities.find((c) => c.id === toLocationId)?.city ?? "Selected city"}
                    </span>
                  ) : (
                    <span className="flex flex-1 text-left text-muted-foreground">Select destination city</span>
                  )}
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>From Slot</Label>
            <div className="flex items-center gap-2">
              <Input
                id="fromSlotStart"
                name="fromSlotStart"
                type="text"
                placeholder="e.g. 5am"
                className="flex-1"
              />
              <span className="shrink-0 text-sm text-muted-foreground font-medium">to</span>
              <Input
                id="fromSlotEnd"
                name="fromSlotEnd"
                type="text"
                placeholder="e.g. 6am"
                className="flex-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="departureTime">Departure Time</Label>
              <Input
                id="departureTime"
                name="departureTime"
                type="datetime-local"
                min={minDateTime || undefined}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Arrival Time</Label>
              <Input
                id="arrivalTime"
                name="arrivalTime"
                type="datetime-local"
                min={minDateTime || undefined}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seatsTotal">Available Seats</Label>
              <Input id="seatsTotal" name="seatsTotal" type="number" min="1" max="10" defaultValue="1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pricePerSeat">Price (INR)</Label>
              <Input id="pricePerSeat" name="pricePerSeat" type="number" min="0" step="0.01" placeholder="0.00" required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details</Label>
            <Textarea id="description" name="description" placeholder="Smoking allowed, pets, luggage limits, etc." />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button type="submit" className="w-full" disabled={loading || (!vehiclesLoading && vehicles.length === 0)}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Ride
          </Button>
          {requiresProfile && (
            <p className="text-center text-sm w-full">
              <Link
                href={PROFILE_EDIT_PATH}
                className="text-primary font-medium underline underline-offset-2 hover:no-underline"
              >
                Add your phone number in Edit profile →
              </Link>
            </p>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}
