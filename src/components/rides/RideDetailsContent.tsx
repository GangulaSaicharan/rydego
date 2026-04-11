"use client"

import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  MapPin,
  Calendar,
  User,
  Users,
  IndianRupee,
  FileText,
  ArrowLeft,
  Car,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookRideForm } from "@/components/rides/BookRideForm"
import { CancelRideButton } from "@/components/rides/CancelRideButton"
import { DriverBookingList } from "@/components/rides/DriverBookingList"
import { ShareRideWhatsAppButton } from "@/components/rides/ShareRideWhatsAppButton"
import { RideViewTracker } from "@/components/rides/RideViewTracker"
import { formatDateLongIST, formatTimeIST } from "@/lib/date-time"
import { RideStatus } from "@prisma/client"
import { cn } from "@/lib/utils"

const statusLabel: Record<RideStatus, string> = {
  SCHEDULED: "Upcoming",
  STARTED: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

interface RideDetailsContentProps {
  ride: any
  userBooking: any
  driverBookings: any[]
  acceptedBookings: any[]
  isDriver: boolean
  isAdmin: boolean
  isOwner: boolean
  canBook: boolean
  showRebook: boolean
  showBookPromptForGuest: boolean
  hasPendingBooking: boolean
  hasAcceptedBooking: boolean
  userId?: string | null
  backUrl?: string
  isModal?: boolean
  onClose?: () => void
  onActionSuccess?: () => void
}

export function RideDetailsContent({
  ride,
  userBooking,
  driverBookings,
  acceptedBookings,
  isDriver,
  isAdmin,
  isOwner,
  canBook,
  showRebook,
  showBookPromptForGuest,
  hasPendingBooking,
  hasAcceptedBooking,
  userId,
  backUrl,
  isModal,
  onClose,
  onActionSuccess,
}: RideDetailsContentProps) {
  const rideJsonLd = {
    "@context": "https://schema.org",
    "@type": "Trip",
    name: `Ride: ${ride.fromLocation.city} to ${ride.toLocation.city}`,
    description: `Ride details from ${ride.fromLocation.city} to ${ride.toLocation.city}.`,
    startDate: ride.departureTime,
    endDate: ride.arrivalTime,
    provider: {
      "@type": "Organization",
      name: "Rydego",
    },
    image: ride.driver.image ?? undefined,
    author: {
      "@type": "Person",
      name: ride.driver.name ?? "Driver",
      image: ride.driver.image ?? undefined,
    },
    offers: {
      "@type": "Offer",
      price: Number(ride.pricePerSeat),
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
    },
  }

  const acceptedPassengersSerialized = acceptedBookings
    .filter((b) => b.passengerId !== userId)
    .reduce((acc: any[], curr) => {
      if (!acc.find((a) => a.passengerId === curr.passengerId)) {
        acc.push({
          passengerId: curr.passengerId,
          seats: curr.seats,
          passenger: curr.passenger,
        })
      }
      return acc
    }, [])

  return (
    <div className="space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(rideJsonLd) }}
      />
      <RideViewTracker rideId={ride.id} />

      <div className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b pb-3 mb-2",
        isModal ? "sticky top-0 z-20 -mx-3 -mt-3 p-3 bg-background/95 backdrop-blur-sm md:-mx-6 md:-mt-6 md:p-6" : ""
      )}>
        <div className="flex items-center gap-2">
          {!isModal && backUrl && (
            <Button
              variant="ghost"
              size="icon"
              nativeButton={false}
              render={<Link href={backUrl} />}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          {isModal && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <h2 className="text-xl font-bold tracking-tight md:text-2xl line-clamp-1">Ride details</h2>
        </div>
        <ShareRideWhatsAppButton
          rideId={ride.id}
          fromCity={ride.fromLocation.city}
          toCity={ride.toLocation.city}
          stopsCities={ride.stops.map((s: any) => s.location.city)}
          departureTime={new Date(ride.departureTime)}
          seatsAvailable={ride.seatsAvailable}
          driverName={ride.driver.name}
          driverPhone={ride.driver.phone ?? null}
          vehicleInfo={
            ride.vehicle
              ? `${ride.vehicle.brand} ${ride.vehicle.model}`.trim()
              : null
          }
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                From
              </p>
              <p className="font-semibold text-lg">{ride.fromLocation.city}</p>
              {ride.fromLocation.state && (
                <p className="text-sm text-muted-foreground">
                  {ride.fromLocation.state}, {ride.fromLocation.country}
                </p>
              )}
            </div>
            {ride.stops.length > 0 && (
              <details className="space-y-3">
                <summary className="cursor-pointer select-none text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stops ({ride.stops.length})
                </summary>
                <div className="border-l-2 border-primary/30 pl-4 ml-2 space-y-3">
                  {ride.stops.map((stop: any) => (
                    <div key={stop.id}>
                      <p className="font-semibold text-lg">{stop.location.city}</p>
                    </div>
                  ))}
                </div>
              </details>
            )}
            <div className="border-l-2 border-primary/30 pl-4 ml-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                To
              </p>
              <p className="font-semibold text-lg">{ride.toLocation.city}</p>
              {ride.toLocation.state && (
                <p className="text-sm text-muted-foreground">
                  {ride.toLocation.state}, {ride.toLocation.country}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Date & time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatDateLongIST(new Date(ride.departureTime))}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Departs at {formatTimeIST(new Date(ride.departureTime))}
            </p>
            {ride.arrivalTime && (
              <p className="text-sm text-muted-foreground">
                Arrival: {formatTimeIST(new Date(ride.arrivalTime))}
              </p>
            )}
          </CardContent>
        </Card>

        {ride.vehicle && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-lg font-semibold">
                {ride.vehicle.brand} {ride.vehicle.model}
              </p>
              <p className="text-sm text-muted-foreground">
                {ride.vehicle.plateNumber}
                {ride.vehicle.color ? ` • ${ride.vehicle.color}` : ""} • {ride.vehicle.seats} seats
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Fare & seats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-2xl font-bold text-primary">
              ₹{ride.pricePerSeat.toString()}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                per seat
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              <Users className="h-4 w-4 inline mr-1" />
              {ride.seatsAvailable} of {ride.seatsTotal} seats available
            </p>
            {(isOwner || (isDriver && ride.status !== "CANCELLED" && ride.status !== "COMPLETED")) && (
              <p className="text-sm text-muted-foreground">
                <Eye className="h-4 w-4 inline mr-1" />
                {ride.views} views
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Driver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href={`/profile/${ride.driver.id}`}
              className="flex items-center gap-3 rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors"
            >
              <Avatar className="h-12 w-12">
                <AvatarImage
                  src={ride.driver.image ?? ""}
                  alt={ride.driver.name ?? "Driver"}
                />
                <AvatarFallback>
                  {ride.driver.name?.[0] ?? "D"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {ride.driver.name ?? "Driver"}
                </p>
                <p className="text-xs text-primary mt-1">View profile →</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {!isDriver && acceptedPassengersSerialized.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Booked passengers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {acceptedPassengersSerialized.map((b: any) => (
                <Link
                  key={b.passenger.id}
                  href={`/profile/${b.passenger.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 -m-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={b.passenger.image ?? ""}
                        alt={b.passenger.name ?? "Passenger"}
                      />
                      <AvatarFallback>
                        {b.passenger.name?.[0] ?? "P"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium leading-tight">
                        {b.passenger.name ?? "Passenger"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {b.seats} seat{b.seats === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-primary">View →</span>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {ride.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap font-bold">{ride.description}</p>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant={
            ride.status === "CANCELLED" ? "destructive" : "secondary"
          }
          className="text-sm"
        >
          {statusLabel[ride.status as RideStatus]}
        </Badge>
        {userId && (
          <span className="text-sm text-muted-foreground">
            {isDriver && "You are the driver"}
            {hasAcceptedBooking && !isDriver && "You're booked on this ride"}
            {hasPendingBooking && !isDriver && "Your request is pending"}
            {userBooking?.status === "REJECTED" &&
              "Your request was declined"}
            {userBooking?.status === "CANCELLED" && "Booking cancelled"}
          </span>
        )}
      </div>

      {showBookPromptForGuest && (
        <Card>
          <CardHeader>
            <CardTitle>Book this ride</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              size="lg"
              nativeButton={false}
              render={
                <Link
                  href={`/login?${new URLSearchParams({
                    callbackUrl: `/rides/${ride.id}`,
                  }).toString()}`}
                />
              }
            >
              Book now
            </Button>
          </CardContent>
        </Card>
      )}

      {canBook && (
        <Card>
          <CardHeader>
            <CardTitle>
              {showRebook ? "Rebook this ride" : "Book this ride"}
            </CardTitle>
            <CardDescription>
              {showRebook
                ? "Your previous booking was cancelled or declined. You can book again below."
                : ride.instantBooking
                  ? "Confirm your seats — booking is instant."
                  : "Send a request. The driver will accept or reject."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BookRideForm
              rideId={ride.id}
              seatsAvailable={ride.seatsAvailable}
              pricePerSeat={Number(ride.pricePerSeat)}
              instantBooking={ride.instantBooking}
              isRebook={showRebook}
              onSuccess={onActionSuccess}
            />
          </CardContent>
        </Card>
      )}

      {isDriver && (
        <Card>
          <CardHeader>
            <CardTitle>Booking requests</CardTitle>
            <CardDescription>
              Accept or reject passenger requests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DriverBookingList
              rideId={ride.id}
              bookings={driverBookings}
              onSuccess={onActionSuccess}
            />
            {ride.status === "SCHEDULED" &&
              new Date(ride.departureTime) > new Date() && (
                <div className="pt-2 border-t">
                  <CancelRideButton rideId={ride.id} onSuccess={onActionSuccess} />
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
