"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createRideAction, getCitiesAction } from "@/lib/actions/ride"
import { PROFILE_EDIT_PATH } from "@/lib/constants/routes"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function OfferRideForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [requiresProfile, setRequiresProfile] = useState(false)
  const [cities, setCities] = useState<{ city: string }[]>([])
  const [citiesLoading, setCitiesLoading] = useState(true)

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
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
    } catch (err) {
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
        <CardDescription>Enter the details of the ride you're offering.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && !requiresProfile && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              <p>{error}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromCity">From City</Label>
              <Select name="fromCity" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select departure city" />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.city} value={city.city}>
                        {city.city}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="toCity">To City</Label>
              <Select name="toCity" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select destination city" />
                </SelectTrigger>
                <SelectContent>
                  {citiesLoading ? (
                    <SelectItem value="loading" disabled>Loading cities...</SelectItem>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.city} value={city.city}>
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
              <Input id="departureTime" name="departureTime" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="arrivalTime">Arrival Time</Label>
              <Input id="arrivalTime" name="arrivalTime" type="datetime-local" />
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
          <Button type="submit" className="w-full" disabled={loading}>
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
