import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { VehiclesManager } from "@/components/vehicles/VehiclesManager"

export const metadata: Metadata = {
  title: "Vehicles",
  description: "Manage vehicles for publishing rides.",
}

export default async function VehiclesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isBlocked: true },
  })
  if (!dbUser || dbUser.isBlocked) redirect("/dashboard")
  if (dbUser.role !== "ADMIN") redirect("/dashboard")

  const vehicles = await prisma.vehicle.findMany({
    where: { ownerId: session.user.id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      brand: true,
      model: true,
      color: true,
      plateNumber: true,
      seats: true,
      createdAt: true,
    },
  })

  const serializedVehicles = vehicles.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }))

  return (
    <main className="flex-1 space-y-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Vehicles</h2>
        <p className="text-sm text-muted-foreground">
          Add and manage the vehicles you can select while publishing a ride.
        </p>
      </div>

      <VehiclesManager initialVehicles={serializedVehicles} />
    </main>
  )
}

