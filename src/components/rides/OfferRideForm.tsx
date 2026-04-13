"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, ChevronRight, ChevronLeft, MapPin, Calendar, Car, ClipboardList, Info, Trash2 } from "lucide-react"

import { Textarea , Button, Input, Label, Card, CardContent, CardFooter, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/"
import { createRideAction, getCitiesAction } from "@/lib/actions/ride"
import { listMyVehiclesAction } from "@/lib/actions/vehicle"
import { PROFILE_EDIT_PATH } from "@/lib/constants/routes"
import { cn } from "@/lib/utils"
import { formatDateTimeShortIST, formatScheduleRangeIST } from "@/lib/date-time"
import { Stepper } from "./Stepper"
import { CityCombobox } from "../ui/city-combobox"

const VEHICLES_CACHE_KEY = "my-vehicles-v1"

function nowISTDateTimeLocalString(): string {
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

const STEPS = [
  { label: "Route", icon: <MapPin className="w-4 h-4" /> },
  { label: "Timing", icon: <Calendar className="w-4 h-4" /> },
  { label: "Vehicle", icon: <Car className="w-4 h-4" /> },
  { label: "Confirm", icon: <ClipboardList className="w-4 h-4" /> },
]

export function OfferRideForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [currentStep, setCurrentStep] = useState(1)
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
  
  // Form State
  const [vehicleId, setVehicleId] = useState<string>("")
  const [fromLocationId, setFromLocationId] = useState<string>("")
  const [toLocationId, setToLocationId] = useState<string>("")
  const [stopLocationIds, setStopLocationIds] = useState<string[]>([])
  const [departureTime, setDepartureTime] = useState<string>("")
  const [arrivalTime, setArrivalTime] = useState<string>("")
  const [seatsTotal, setSeatsTotal] = useState<string>("1")
  const [pricePerSeat, setPricePerSeat] = useState<string>("")
  const [description, setDescription] = useState<string>("")

  const MAX_STOPS = 3

  function addStop() {
    setStopLocationIds((prev) => (prev.length >= MAX_STOPS ? prev : [...prev, ""]))
  }

  function removeStop(idx: number) {
    setStopLocationIds((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateStop(idx: number, next: string) {
    setStopLocationIds((prev) => prev.map((v, i) => (i === idx ? next : v)))
  }

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
        } catch {}

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
          } catch {}
        }
      } finally {
        setVehiclesLoading(false)
      }
    }
    fetchVehicles()
  }, [])

  useEffect(() => {
    const update = () => setMinDateTime(nowISTDateTimeLocalString())
    update()
    const id = window.setInterval(update, 30_000)
    return () => window.clearInterval(id)
  }, [])

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!fromLocationId) return "Departure city is required"
      if (!toLocationId) return "Destination city is required"
      if (fromLocationId === toLocationId) return "Departure and destination cannot be the same"
      if (stopLocationIds.some(s => !s)) return "Please finish selecting your stops or remove empty ones"
    } else if (step === 2) {
      if (!departureTime) return "Departure time is required"
      if (!arrivalTime) return "Arrival time is required"
      if (new Date(arrivalTime) <= new Date(departureTime)) return "Arrival must be after departure"
    } else if (step === 3) {
      if (!vehicleId) return "Please select a vehicle"
      if (!seatsTotal || parseInt(seatsTotal) < 1) return "At least 1 seat is required"
      if (!pricePerSeat || parseFloat(pricePerSeat) < 0) return "Valid price is required"
      
      const v = vehicles.find(x => x.id === vehicleId)
      if (v && parseInt(seatsTotal) > v.seats) return `Capacity of selected vehicle is ${v.seats} seats`
    }
    return null
  }

  const handleNext = () => {
    const err = validateStep(currentStep)
    if (err) {
      toast.error(err)
      return
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    
    const finalErr = validateStep(currentStep)
    if (finalErr) {
      toast.error(finalErr)
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
        if (result.rideId) {
          router.push(`/rides/${result.rideId}`)
          router.refresh()
        } else {
          router.push("/dashboard")
        }
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

  const renderStep1 = () => (
    <div className={cn("space-y-6", currentStep !== 1 && "hidden")}>
      {!vehiclesLoading && vehicles.length === 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-2">
          <Car className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-destructive">Vehicle Required</p>
            <p className="text-xs text-destructive/80">
              You need to add a vehicle before you can offer a ride.{" "}
              <Link href="/settings/vehicles" className="underline font-bold">Add a vehicle now</Link>
            </p>
          </div>
        </div>
      )}
      <div className="space-y-4">
        <div className="relative">
          <div className="absolute left-4 top-10 bottom-10 w-0.5 bg-muted-foreground/20 md:left-4" />
          
          <div className="space-y-2 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center z-10">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <Label className="font-semibold text-base">Departure City</Label>
            </div>
            <CityCombobox
              name="fromLocationId"
              value={fromLocationId}
              onValueChange={setFromLocationId}
              cities={cities}
              loading={citiesLoading}
              placeholder="Where are you starting?"
              required={currentStep === 1}
              controlClassName="pl-10"
            />
          </div>

          <div className="py-4 space-y-4">
            {stopLocationIds.map((stopId, idx) => {
              const usedStopIds = new Set(stopLocationIds.filter((v, i) => i !== idx && v))
              const options = cities.filter((c) => {
                if (c.id === fromLocationId || c.id === toLocationId) return false
                if (usedStopIds.has(c.id) && c.id !== stopId) return false
                return true
              })

              return (
                <div key={idx} className="flex items-end gap-3 animate-in slide-in-from-left-2 transition-all">
                  <div className="flex-1 space-y-2 relative">
                     <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                        </div>
                        <Label className="text-sm font-medium">{`Stop ${idx + 1}`}</Label>
                      </div>
                    <CityCombobox
                      name="stopLocationIds"
                      value={stopId}
                      onValueChange={(v) => updateStop(idx, v)}
                      cities={options}
                      loading={citiesLoading}
                      placeholder="Select stop city"
                      controlClassName="pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeStop(idx)}
                    title="Remove stop"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}
            
            {stopLocationIds.length < MAX_STOPS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed py-6 hover:border-primary hover:text-primary transition-all"
                onClick={addStop}
              >
                + Add Intermediate Stop
              </Button>
            )}
          </div>

          <div className="space-y-2 relative">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center z-10">
                <MapPin className="w-4 h-4 text-primary-foreground" />
              </div>
              <Label className="font-semibold text-base">Destination City</Label>
            </div>
            <CityCombobox
              name="toLocationId"
              value={toLocationId}
              onValueChange={setToLocationId}
              cities={cities}
              loading={citiesLoading}
              placeholder="Where are you going?"
              required={currentStep === 1}
              controlClassName="pl-10"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4", currentStep !== 2 && "hidden")}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label className="text-base font-semibold block">Departure Day & Time</Label>
          <div className="relative">
            <Input
              id="departureTime"
              name="departureTime"
              type="datetime-local"
              min={minDateTime || undefined}
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              required={currentStep === 2}
              className="h-12 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">Pick when you'll start your journey.</p>
        </div>
        
        <div className="space-y-3">
          <Label className="text-base font-semibold block">Estimated Arrival</Label>
          <div className="relative">
            <Input
              id="arrivalTime"
              name="arrivalTime"
              type="datetime-local"
              min={departureTime || minDateTime || undefined}
              value={arrivalTime}
              onChange={(e) => setArrivalTime(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              required={currentStep === 2}
              className="h-12 cursor-pointer"
            />
          </div>
          <p className="text-xs text-muted-foreground">Approximate time of arrival at destination.</p>
        </div>
      </div>

      <div className="bg-primary/5 p-4 rounded-lg flex gap-3 items-start">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <p className="text-sm text-primary/80">
          Providing an accurate arrival time helps passengers plan their connection better.
        </p>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4", currentStep !== 3 && "hidden")}>
      <div className="space-y-3">
        <Label htmlFor="vehicleId" className="text-base font-semibold">Select Your Vehicle</Label>
        <Select name="vehicleId" required={currentStep === 3} value={vehicleId || undefined} onValueChange={(v) => setVehicleId(v ?? "")}>
          <SelectTrigger className="w-full h-12">
            {vehicleId ? (
              <span className="flex flex-1 text-left items-center gap-2">
                <Car className="w-4 h-4 text-primary" />
                {(() => {
                  const v = vehicles.find((x) => x.id === vehicleId)
                  return v ? `${v.brand} ${v.model} • ${v.plateNumber}` : "Selected vehicle"
                })()}
              </span>
            ) : (
              <span className="flex flex-1 text-left text-muted-foreground">
                {vehiclesLoading
                  ? "Loading vehicles..."
                  : vehicles.length === 0
                    ? "No vehicles found"
                    : "Choose a vehicle"}
              </span>
            )}
          </SelectTrigger>
          <SelectContent>
            {vehiclesLoading ? (
              <SelectItem value="loading" disabled>Loading vehicles...</SelectItem>
            ) : vehicles.length === 0 ? (
              <SelectItem value="none" disabled>Add a vehicle in Settings</SelectItem>
            ) : (
              vehicles.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  <div className="flex flex-col">
                    <span>{v.brand} {v.model}</span>
                    <span className="text-xs text-muted-foreground">{v.plateNumber} • {v.seats} max seats</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {!vehiclesLoading && vehicles.length === 0 && (
          <p className="text-sm text-destructive">
            You need to add a vehicle to publish a ride.{" "}
            <Link href="/settings/vehicles" className="underline font-medium">Add Vehicle</Link>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <Label htmlFor="seatsTotal" className="text-base font-semibold">Seats for Passengers</Label>
          <Input 
            id="seatsTotal" 
            name="seatsTotal" 
            type="number" 
            min="1" 
            max={vehicles.find(v => v.id === vehicleId)?.seats || 10} 
            value={seatsTotal}
            onChange={(e) => setSeatsTotal(e.target.value)}
            required={currentStep === 3}
            className="h-12 text-lg font-medium"
          />
          <p className="text-xs text-muted-foreground">How many people can you take?</p>
        </div>
        
        <div className="space-y-3">
          <Label htmlFor="pricePerSeat" className="text-base font-semibold">Price per Seat (INR)</Label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-muted-foreground font-medium">₹</span>
            <Input 
              id="pricePerSeat" 
              name="pricePerSeat" 
              type="number" 
              min="0" 
              step="1" 
              placeholder="0" 
              value={pricePerSeat}
              onChange={(e) => setPricePerSeat(e.target.value)}
              required={currentStep === 3}
              className="pl-8 h-12 text-lg font-medium"
            />
          </div>
          <p className="text-xs text-muted-foreground">Charge per passenger for the trip.</p>
        </div>
      </div>
    </div>
  )

  const renderStep4 = () => (
    <div className={cn("space-y-6 animate-in fade-in slide-in-from-right-4", currentStep !== 4 && "hidden")}>
      <div className="bg-muted/30 border border-border rounded-xl p-5 space-y-4">        
        <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Route</p>
            <p className="font-medium">
              {cities.find(c => c.id === fromLocationId)?.city} → {cities.find(c => c.id === toLocationId)?.city}
            </p>
            {stopLocationIds.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Via: {stopLocationIds.map(id => cities.find(c => c.id === id)?.city).join(", ")}
              </p>
            )}
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(1)} className="h-7 text-primary">Edit</Button>
        </div>

        <div className="flex justify-between items-start gap-4 pb-3 border-b border-border/50">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Schedule</p>
            <p className="font-medium">
              {departureTime && arrivalTime
                ? formatScheduleRangeIST(departureTime, arrivalTime)
                : departureTime
                  ? formatDateTimeShortIST(departureTime)
                  : "Not set"}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(2)} className="h-7 text-primary">Edit</Button>
        </div>

        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Details</p>
            <div className="flex gap-4 mt-1">
              <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full font-medium">
                {seatsTotal} Seats
              </span>
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
                ₹{pricePerSeat}/seat
              </span>
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => setCurrentStep(3)} className="h-7 text-primary">Edit</Button>
        </div>
      </div>

      <div className="space-y-3 mb-2">
        <Label htmlFor="description" className="text-base font-semibold">Additional Details (Optional)</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Smoking allowed, pets, luggage limits, etc." 
          className="min-h-24 resize-none"
        />
      </div>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-20 md:pb-10">
      <div className="mb-6">
        <Stepper currentStep={currentStep} steps={STEPS} />
      </div>

      <Card className="border-none shadow-none md:border md:shadow-sm">
        <CardHeader className="md:border-b bg-muted/5">
          <CardTitle className="flex items-center gap-2">
            {STEPS[currentStep - 1].icon}
            {STEPS[currentStep - 1].label} Details
          </CardTitle>
        </CardHeader>
        <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full">
          <CardContent className="pt-3 space-y-4">
            {error && !requiresProfile && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                <p>{error}</p>
              </div>
            )}

            {renderStep1()}
            {renderStep2()}
            {renderStep3()}
            {renderStep4()}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 mt-auto border-t pt-3 bg-background md:relative">
            <div className="flex w-full gap-3">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack} 
                  className="flex-1 h-12"
                  disabled={loading}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              
              {currentStep < STEPS.length ? (
                <Button
                  key="next-btn"
                  type="button"
                  onClick={handleNext}
                  className="flex-[2] h-12"
                  disabled={vehiclesLoading && currentStep === 3}
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              ) : (
                <Button
                  key="submit-btn"
                  type="submit"
                  className="flex-[2] h-12"
                  disabled={loading || (!vehiclesLoading && vehicles.length === 0)}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    "Publish Ride"
                  )}
                </Button>
              )}
            </div>
            
            {requiresProfile && (
              <p className="text-center text-sm w-full animate-bounce">
                <Link
                  href={PROFILE_EDIT_PATH}
                  className="text-primary font-bold underline underline-offset-4"
                >
                  Action Required: Add phone number in Profile
                </Link>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
