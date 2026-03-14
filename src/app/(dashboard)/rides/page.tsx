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
import { Clock, ChevronRight, MapPin, Calendar, CheckCircle2, Loader2, User, Users } from "lucide-react"
import Link from "next/link"
import { RideStatus } from "@prisma/client"

const rideInclude = {
  driver: { select: { name: true, image: true, email: true } },
  fromLocation: { select: { city: true, state: true } },
  toLocation: { select: { city: true, state: true } },
}

type RideWithRelations = Awaited<
  ReturnType<typeof prisma.ride.findMany<{ include: typeof rideInclude }>>
>[number]

function RideRow({
  ride,
  userId,
  statusLabel,
  statusVariant,
}: {
  ride: RideWithRelations
  userId: string
  statusLabel: string
  statusVariant: "default" | "secondary" | "outline" | "destructive"
}) {
  const isDriver = ride.driverId === userId
  return (
    <Link
      href={`/rides/${ride.id}`}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors shadow-sm"
    >
      <div className="flex flex-1 min-w-0 gap-3">
        <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center text-sm font-bold truncate">
            <span className="truncate">{ride.fromLocation.city}</span>
            <ChevronRight className="h-3 w-3 mx-1 shrink-0 text-muted-foreground/50" />
            <span className="truncate">{ride.toLocation.city}</span>
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground font-medium mt-0.5">
            {new Date(ride.departureTime).toLocaleDateString("en-IN", {
              timeZone: "Asia/Kolkata",
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {ride.arrivalTime && (
              <span className="ml-1">→ Arrives {new Date(ride.arrivalTime).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}</span>
            )}
          </p>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {ride.driver.name ?? "Driver"}
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {ride.seatsAvailable} / {ride.seatsTotal} seats
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <p className="text-sm font-bold text-primary">₹{ride.pricePerSeat.toString()}/seat</p>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          <Badge variant={statusVariant} className="text-[9px] uppercase tracking-tighter">
            {statusLabel}
          </Badge>
          <span className="text-[9px] font-bold px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded uppercase tracking-tighter">
            {isDriver ? "Driving" : "Booked"}
          </span>
        </div>
      </div>
    </Link>
  )
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed rounded-xl bg-muted/30">
      <Clock className="h-10 w-10 text-muted-foreground/20 mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  )
}

export default async function RidesPage() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return null

  const now = new Date()

  const allRides = await prisma.ride.findMany({
    where: {
      status: { in: ["SCHEDULED", "STARTED", "COMPLETED"] },
      OR: [
        { driverId: userId },
        { bookings: { some: { passengerId: userId, status: "ACCEPTED" } } },
      ],
    },
    orderBy: { departureTime: "desc" },
    include: rideInclude,
  })

  const upcoming = allRides
    .filter(
      (r) => r.status === RideStatus.SCHEDULED && new Date(r.departureTime) > now
    )
    .sort(
      (a, b) =>
        new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime()
    )
  const inProgress = allRides.filter((r) => r.status === RideStatus.STARTED)
  const completed = allRides.filter((r) => r.status === RideStatus.COMPLETED)

  return (
    <main className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Rides</h2>
      </div>

      <div className="space-y-6">
        {/* Upcoming */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming
            </CardTitle>
            <CardDescription>Rides that haven’t started yet</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcoming.length > 0 ? (
              upcoming.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  userId={userId}
                  statusLabel="Scheduled"
                  statusVariant="secondary"
                />
              ))
            ) : (
              <EmptySection message="No upcoming rides" />
            )}
          </CardContent>
        </Card>

        {/* In progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Loader2 className="h-5 w-5 text-amber-500" />
              In progress
            </CardTitle>
            <CardDescription>Rides currently on the way</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {inProgress.length > 0 ? (
              inProgress.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  userId={userId}
                  statusLabel="Started"
                  statusVariant="default"
                />
              ))
            ) : (
              <EmptySection message="No rides in progress" />
            )}
          </CardContent>
        </Card>

        {/* Completed */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Completed
            </CardTitle>
            <CardDescription>Past rides</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {completed.length > 0 ? (
              completed.map((ride) => (
                <RideRow
                  key={ride.id}
                  ride={ride}
                  userId={userId}
                  statusLabel="Completed"
                  statusVariant="outline"
                />
              ))
            ) : (
              <EmptySection message="No completed rides yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
