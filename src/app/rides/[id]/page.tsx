import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/db"
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
  Settings as SettingsIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { notFound } from "next/navigation"
import { RideStatus } from "@prisma/client"
import { BookRideForm } from "@/components/rides/BookRideForm"
import { CancelRideButton } from "@/components/rides/CancelRideButton"
import { DriverBookingList } from "@/components/rides/DriverBookingList"
import { ShareRideWhatsAppButton } from "@/components/rides/ShareRideWhatsAppButton"
import { formatDateLongIST, formatTimeIST } from "@/lib/date-time"
import { LOGO_URL } from "@/lib/constants/brand"
import { HeaderUserMenu } from "@/components/header-user-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppBottomNav } from "@/components/app-bottom-nav"

export const dynamic = "force-dynamic"

const statusLabel: Record<RideStatus, string> = {
  SCHEDULED: "Upcoming",
  STARTED: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
}

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ fromCity?: string; toCity?: string; date?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      fromLocation: { select: { city: true } },
      toLocation: { select: { city: true } },
    },
  })
  if (!ride) return { title: "Ride" }
  const route = `${ride.fromLocation.city} → ${ride.toLocation.city}`
  return {
    title: `Ride: ${route}`,
    description: `View ride details: ${route}. Date & time, driver, price on RydeGo.`,
  }
}

export default async function RideDetailPage({ params, searchParams }: Props) {
  const session = await auth()
  const userId = session?.user?.id
  const isAdmin = session?.user?.role === "ADMIN"

  const { id } = await params
  const sp = await searchParams
  const backToSearch =
    sp?.fromCity && sp?.toCity && sp?.date
      ? `/search?${new URLSearchParams({ fromCity: sp.fromCity, toCity: sp.toCity, date: sp.date }).toString()}`
      : "/rides"

  const ride = await prisma.ride.findUnique({
    where: { id },
    include: {
      driver: { select: { id: true, name: true, image: true, email: true, phone: true } },
      fromLocation: true,
      toLocation: true,
      vehicle: { select: { brand: true, model: true } },
    },
  })

  if (!ride) notFound()

  const isDriver = userId ? ride.driverId === userId : false

  let userBooking: Awaited<ReturnType<typeof prisma.booking.findFirst>> = null
  let driverBookings: Awaited<ReturnType<typeof prisma.booking.findMany>> = []

  if (userId) {
    const [booking, dBookings] = await Promise.all([
      prisma.booking.findFirst({
        where: { rideId: id, passengerId: userId },
        orderBy: { createdAt: "desc" },
      }),
      isDriver
        ? prisma.booking.findMany({
            where: { rideId: id },
            include: {
              passenger: { select: { id: true, name: true, image: true, email: true } },
            },
            orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          })
        : [],
    ])
    userBooking = booking
    driverBookings = dBookings
  }

  const hasActiveBooking = userBooking && userBooking.status !== "CANCELLED" && userBooking.status !== "REJECTED"
  const rideIsBookable =
    ride.status === "SCHEDULED" &&
    ride.seatsAvailable > 0 &&
    !hasActiveBooking
  const canBook =
    !!userId &&
    !isDriver &&
    rideIsBookable
  const showRebook =
    canBook &&
    !!userBooking &&
    (userBooking.status === "CANCELLED" || userBooking.status === "REJECTED")
  /** Show "Book now" → sign in for any guest who is not the driver */
  const showBookPromptForGuest = !userId && !isDriver

  const hasPendingBooking = userBooking?.status === "PENDING"
  const hasAcceptedBooking = userBooking?.status === "ACCEPTED"

  type DriverBookingItem = {
  id: string
  seats: number
  status: string
  pickupNote: string | null
  dropNote: string | null
  totalPrice: number | null
  passenger: { id: string; name: string | null; image: string | null; email: string | null }
}
  const driverBookingsSerialized: DriverBookingItem[] = driverBookings.map((b) => {
    const withPassenger = b as typeof b & { passenger: { id: string; name: string | null; image: string | null; email: string | null } }
    return {
      id: withPassenger.id,
      seats: withPassenger.seats,
      status: withPassenger.status,
      pickupNote: withPassenger.pickupNote,
      dropNote: withPassenger.dropNote,
      totalPrice: withPassenger.totalPrice ? Number(withPassenger.totalPrice) : null,
      passenger: withPassenger.passenger,
    }
  })

  const isLoggedIn = !!session?.user
  const sidebarUser =
    session?.user ?? {
      name: "Guest",
      email: "Sign in to save trips",
      image: null,
    }

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            nativeButton={false}
            render={<Link href={backToSearch} />}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">Ride details</h2>
        </div>
        <ShareRideWhatsAppButton
          rideId={ride.id}
          fromCity={ride.fromLocation.city}
          toCity={ride.toLocation.city}
          departureTime={ride.departureTime}
          fromSlot={ride.fromSlot}
          seatsAvailable={ride.seatsAvailable}
          driverName={ride.driver.name}
          driverPhone={ride.driver.phone}
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
            <CardDescription>From and to</CardDescription>
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
            <CardDescription>Departure and arrival</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {formatDateLongIST(ride.departureTime)}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Departs at {formatTimeIST(ride.departureTime)}
            </p>
            {ride.arrivalTime && (
              <p className="text-sm text-muted-foreground">
                Arrival: {formatTimeIST(ride.arrivalTime)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary" />
              Fare & seats
            </CardTitle>
            <CardDescription>Price and availability</CardDescription>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Driver
            </CardTitle>
            <CardDescription>Who&apos;s driving</CardDescription>
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
                {ride.driver.email && (
                  <p className="text-sm text-muted-foreground">
                    {ride.driver.email}
                  </p>
                )}
                <p className="text-xs text-primary mt-1">View profile →</p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {ride.description && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Notes
            </CardTitle>
            <CardDescription>Ride description</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{ride.description}</p>
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
          {statusLabel[ride.status]}
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
              bookings={driverBookingsSerialized}
            />
            {ride.status === "SCHEDULED" &&
              new Date(ride.departureTime) > new Date() && (
                <div className="pt-2 border-t">
                  <CancelRideButton rideId={ride.id} />
                </div>
              )}
          </CardContent>
        </Card>
      )}
    </>
  )

  return (
    <SidebarProvider>
      <AppSidebar user={sidebarUser} isAdmin={isAdmin} />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border/60 bg-background/95 px-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80 md:h-16 md:gap-4 md:px-6">
          <span className="hidden md:inline-flex">
            <SidebarTrigger className="-ml-1 size-9 rounded-md hover:bg-accent hover:text-accent-foreground" />
          </span>
          <Separator
            orientation="vertical"
            className="mr-1 hidden h-5 shrink-0 opacity-60 md:mr-2 md:block"
          />
          <Link
            href="/search"
            className="flex items-center gap-2 rounded-md outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Image
              src={LOGO_URL}
              alt="RydeGo"
              width={32}
              height={32}
              className="size-8 object-contain md:size-9"
            />
            <span className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
              RydeGo
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-1">
            {isLoggedIn ? (
              <>
                <Link
                  href="/settings"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors md:h-10 md:w-10"
                  aria-label="Settings"
                >
                  <SettingsIcon className="h-4 w-4 md:h-5 md:w-5" />
                </Link>
                <HeaderUserMenu user={session.user} />
              </>
            ) : (
              <Link
                href={`/login?${new URLSearchParams({
                  callbackUrl: `/rides/${ride.id}`,
                }).toString()}`}
                className="px-3 py-1.5 text-sm font-medium rounded-full border border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                Log in
              </Link>
            )}
          </div>
        </header>
        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4 pb-20 pt-3 md:p-6 md:pb-6 md:pt-4">
          {content}
        </main>
      </SidebarInset>
      <AppBottomNav isAdmin={isAdmin} />
    </SidebarProvider>
  )
}
