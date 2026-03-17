import type { Metadata } from "next"
import Link from "next/link"
import prisma from "@/lib/db"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  Car,
  TicketCheck,
  UserCheck,
  Star,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react"
import { formatDateShortIST, formatTimeIST } from "@/lib/date-time"

export const metadata: Metadata = {
  title: "Admin",
  description: "App owner dashboard – stats, users, and activity.",
}

export const dynamic = "force-dynamic"

export default async function AdminPage() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    totalRides,
    totalBookings,
    driversCount,
    totalReviews,
    newUsersLast7Days,
    recentUsers,
    recentRides,
    rideCountByStatus,
    bookingCountByStatus,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.ride.count({ where: { deletedAt: null } }),
    prisma.booking.count({ where: { deletedAt: null } }),
    prisma.driverProfile.count(),
    prisma.review.count(),
    prisma.user.count({
      where: { deletedAt: null, createdAt: { gte: sevenDaysAgo } },
    }),
    prisma.user.findMany({
      where: { deletedAt: null },
      take: 15,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        isBlocked: true,
        _count: { select: { rides: true, bookings: true } },
      },
    }),
    prisma.ride.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        driver: { select: { name: true, email: true } },
        fromLocation: { select: { city: true } },
        toLocation: { select: { city: true } },
      },
    }),
    prisma.ride.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    }),
    prisma.booking.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: true,
    }),
  ])

  const rideStatusCounts = Object.fromEntries(
    rideCountByStatus.map((r) => [r.status, r._count])
  )
  const bookingStatusCounts = Object.fromEntries(
    bookingCountByStatus.map((b) => [b.status, b._count])
  )

  const stats = [
    {
      title: "Total users",
      value: totalUsers,
      description: `+${newUsersLast7Days} in last 7 days`,
      icon: Users,
    },
    {
      title: "Total rides",
      value: totalRides,
      description: "All time",
      icon: Car,
    },
    {
      title: "Total bookings",
      value: totalBookings,
      description: "All time",
      icon: TicketCheck,
    },
    {
      title: "Drivers",
      value: driversCount,
      description: "With driver profile",
      icon: UserCheck,
    },
    {
      title: "Reviews",
      value: totalReviews,
      description: "All time",
      icon: Star,
    },
  ]

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">
              Owner dashboard
            </h1>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </div>

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            App overview
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((s) => (
              <Card key={s.title} size="sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {s.title}
                  </CardTitle>
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground">
                    {s.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Rides by status</CardTitle>
              <CardDescription>Current ride status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {(
                  [
                    "SCHEDULED",
                    "STARTED",
                    "COMPLETED",
                    "CANCELLED",
                  ] as const
                ).map((status) => (
                  <li
                    key={status}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="capitalize text-muted-foreground">
                      {status.toLowerCase()}
                    </span>
                    <span className="font-medium">
                      {rideStatusCounts[status] ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bookings by status</CardTitle>
              <CardDescription>Current booking status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5 text-sm">
                {(
                  [
                    "PENDING",
                    "ACCEPTED",
                    "REJECTED",
                    "CANCELLED",
                    "COMPLETED",
                    "NO_SHOW",
                  ] as const
                ).map((status) => (
                  <li
                    key={status}
                    className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                  >
                    <span className="capitalize text-muted-foreground">
                      {status.toLowerCase().replace("_", " ")}
                    </span>
                    <span className="font-medium">
                      {bookingStatusCounts[status] ?? 0}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Recent users</CardTitle>
            <CardDescription>Latest 15 registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Email</th>
                    <th className="pb-2 pr-4 font-medium">Role</th>
                    <th className="pb-2 pr-4 font-medium">Rides / Bookings</th>
                    <th className="pb-2 pr-4 font-medium">Joined</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 font-medium">{u.name ?? "—"}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u.email ?? "—"}
                      </td>
                      <td className="py-2 pr-4">
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : "secondary"}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {u._count.rides} / {u._count.bookings}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDateShortIST(u.createdAt)}
                      </td>
                      <td className="py-2">
                        {u.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <span className="text-muted-foreground">Active</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent rides</CardTitle>
            <CardDescription>Latest 10 rides created</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {recentRides.map((ride) => (
                <li
                  key={ride.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-sm"
                >
                  <div>
                    <span className="font-medium">
                      {ride.fromLocation.city} → {ride.toLocation.city}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {formatDateShortIST(ride.departureTime)}{" "}
                      {formatTimeIST(ride.departureTime)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">
                      {ride.driver.name ?? ride.driver.email ?? "—"}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {ride.status.toLowerCase()}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
