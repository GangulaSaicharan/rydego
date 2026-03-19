import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Car,
  Users,
  Star,
  MapPin,
  Calendar,
  ChevronRight,
  PlusCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateShortIST, formatTimeIST } from "@/lib/date-time"
import { APP_NAME } from "@/lib/constants/brand"

export const metadata: Metadata = {
  title: "Dashboard",
  description: `Your ${APP_NAME} overview – stats, quick actions, and recent activity.`,
};

export default async function DashboardPage() {
  const session = await auth()
  const userId = session?.user?.id
  const isAdmin = session?.user?.role === "ADMIN"

  if (!userId) return null

  const now = new Date()

  // Fetch stats and data in parallel (skip publishedRidesCount for non-admin)
  const [
    user,
    ridesOfferedCount,
    bookingsMadeCount,
    upcomingRides,
    pendingBookingsCount,
    recentRides
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { ratingAverage: true, ratingCount: true },
    }),
    prisma.ride.count({
      where: { driverId: userId },
    }),
    prisma.booking.count({
      where: { passengerId: userId, status: "ACCEPTED" },
    }),
    prisma.ride.findMany({
      where: {
        departureTime: { gt: now },
        OR: [
          { driverId: userId },
          { bookings: { some: { passengerId: userId, status: "ACCEPTED" } } },
        ],
      },
      take: 3,
      orderBy: { departureTime: "asc" },
      include: {
        driver: { select: { name: true, image: true } },
        fromLocation: { select: { city: true } },
        toLocation: { select: { city: true } },
      },
    }),
    prisma.booking.count({
      where: {
        ride: { driverId: userId },
        status: "PENDING",
      },
    }),
    prisma.ride.findMany({
      where: {
        OR: [
          { driverId: userId },
          { bookings: { some: { passengerId: userId, status: "ACCEPTED" } } },
        ],
      },
      take: 5,
      orderBy: { departureTime: "desc" },
      include: {
        driver: { select: { name: true, image: true } },
        fromLocation: { select: { city: true } },
        toLocation: { select: { city: true } },
      },
    }),
  ])

  const stats = [
    {
      title: "Rides offered",
      value: ridesOfferedCount.toString(),
      description: "You are the driver",
      icon: Car,
      color: "text-blue-500",
    },
    {
      title: "Bookings made",
      value: bookingsMadeCount.toString(),
      description: "You are the passenger",
      icon: Users,
      color: "text-violet-500",
    },
    ...(isAdmin
      ? [
          {
            title: "Active Requests",
            value: pendingBookingsCount.toString(),
            description: "Pending approvals",
            icon: AlertCircle,
            color: (pendingBookingsCount > 0 ? "text-orange-500" : "text-muted-foreground") as string,
          },
        ]
      : []),
    {
      title: "Avg. Rating",
      value: user?.ratingAverage.toFixed(1) ?? "0.0",
      description: `From ${user?.ratingCount ?? 0} reviews`,
      icon: Star,
      color: "text-yellow-500",
    },
  ]

  const firstName = session?.user?.name?.split(" ")[0] ?? "there"

  return (
    <main className="flex-1 space-y-5 md:space-y-6 p-0 md:p-0">
      {/* Mobile-first app header */}
      <section className="space-y-1">
        <p className="text-sm text-muted-foreground">Welcome back to {APP_NAME}</p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Hi, {firstName}
        </h1>
      </section>

      {/* Stats - app-style cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={stat.title} className={cn("overflow-hidden rounded-2xl border shadow-sm", index === stats.length - 1 && stats.length === 3 && "col-span-2 lg:col-span-1")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-1">
              <CardTitle className="text-[10px] md:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={cn("h-4 w-4 md:h-5 md:w-5", stat.color)} />
            </CardHeader>
            <CardContent className="p-4 pt-0 pb-4">
              <div className="text-xl md:text-2xl font-bold tabular-nums">{stat.value}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground leading-none mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-7">
        {/* Upcoming Rides Section */}
        <Card className="lg:col-span-4 rounded-2xl border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between px-4 md:px-6">
            <div className="space-y-0.5">
              <CardTitle className="text-base md:text-lg">Upcoming Rides</CardTitle>
              <CardDescription className="text-xs">Your next trips</CardDescription>
            </div>
            <Link href="/rides" className="text-xs text-primary font-medium hover:underline flex items-center active:opacity-80">
              View all <ChevronRight className="h-3 w-3 ml-0.5" />
            </Link>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4">
            <div className="space-y-3">
              {upcomingRides.length > 0 ? (
                upcomingRides.map((ride) => (
                  <Link
                    key={ride.id}
                    href={`/rides/${ride.id}`}
                    className="flex items-center p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 active:bg-muted/70 transition-colors"
                  >
                    <div className="h-9 w-9 shrink-0 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center text-sm font-bold truncate">
                        <span className="truncate">{ride.fromLocation.city}</span>
                        <ChevronRight className="h-3 w-3 mx-1 shrink-0 text-muted-foreground/50" />
                        <span className="truncate">{ride.toLocation.city}</span>
                      </div>
                      <p className="text-[10px] md:text-xs text-muted-foreground font-medium">
                        {formatDateShortIST(ride.departureTime)} {formatTimeIST(ride.departureTime)}
                        {ride.arrivalTime && (
                          <span className="ml-1">→ Arrives {formatTimeIST(ride.arrivalTime)}</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p className="text-sm font-bold text-primary">₹{ride.pricePerSeat.toString()}</p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded uppercase tracking-tighter">
                        {ride.driverId === userId ? "Driving" : "Booked"}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl bg-card">
                  <Calendar className="h-10 w-10 text-muted-foreground/20 mb-3" />
                  <p className="text-sm font-medium text-muted-foreground">No upcoming rides</p>
                  <Link 
                    href="/search" 
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }), "mt-4 rounded-full")}
                  >
                    Find a ride
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - app-style primary actions */}
        <Card className="lg:col-span-3 rounded-2xl border shadow-sm">
          <CardHeader className="px-4 md:px-6">
            <CardTitle className="text-base md:text-lg">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Take the next step</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 px-4 md:px-6 pb-4">
            <Link 
              href="/search" 
              className={cn(buttonVariants({ variant: "outline" }), "justify-start h-14 md:h-14 rounded-xl border-primary/20 hover:border-primary/50 bg-primary/5 transition-all active:scale-[0.98]")}
            >
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center mr-3 shrink-0">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col items-start leading-none text-left min-w-0">
                <span className="text-sm font-bold">Find a Ride</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">Browse available trips</span>
              </div>
            </Link>
            {isAdmin && (
              <Link 
                href="/publish" 
                className={cn(buttonVariants({ variant: "outline" }), "justify-start h-14 md:h-14 rounded-xl border-green-500/20 hover:border-green-500/50 bg-green-500/5 transition-all active:scale-[0.98]")}
              >
                <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center mr-3 shrink-0">
                  <PlusCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex flex-col items-start leading-none text-left min-w-0">
                  <span className="text-sm font-bold text-green-700">Publish a Ride</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5">Share your plan</span>
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Section */}
        <Card className="lg:col-span-7">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Recent History</CardTitle>
              <CardDescription className="text-xs">Your last 5 activities</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRides.length > 0 ? (
                recentRides.map((ride) => (
                  <div key={ride.id} className="flex items-center justify-between group py-1">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={ride.driver.image ?? ""} alt={ride.driver.name ?? "User"} />
                        <AvatarFallback className="text-xs">{ride.driver.name?.[0] ?? "U"}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate flex items-center">
                          {ride.fromLocation.city}
                          <ChevronRight className="h-3 w-3 mx-1 text-muted-foreground" />
                          {ride.toLocation.city}
                        </p>
                        <p className="text-[10px] font-medium text-muted-foreground">
                          {formatDateShortIST(ride.departureTime)}
                          {ride.arrivalTime && ` → ${formatTimeIST(ride.arrivalTime)}`}
                          {" • "}{ride.driverId === userId ? "You drove" : `With ${ride.driver.name}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black">₹{ride.pricePerSeat.toString()}</div>
                      <Link href={`/rides/${ride.id}`} className="text-[10px] font-bold text-primary hover:underline">
                        Details
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-accent/20 rounded-xl border border-dashed">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">No history yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
