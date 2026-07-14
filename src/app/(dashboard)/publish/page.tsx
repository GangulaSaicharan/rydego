import type { Metadata } from "next"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button-variants"
import { OfferRideForm } from "@/components/rides/OfferRideForm"
import { APP_NAME } from "@/lib/constants/brand"

export const metadata: Metadata = {
  title: "Publish a Ride",
  description: `Offer a ride on ${APP_NAME}. Set route, date, time, and price.`,
};

export default async function PublishPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  if (session.user.role !== "ADMIN") {
    return (
      <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Publish a Ride</h2>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>
              You don&apos;t have permission to publish a ride.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ShieldAlert className="h-12 w-12 text-muted-foreground/20 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              Only allowed users can offer rides
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-6">
              <Link
                href="/contact"
                className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"
              >
                Contact Us
              </Link>{" "}
              for access.
            </p>
            <Link href="/dashboard" className={buttonVariants({ variant: "default" })}>
              Go to dashboard
            </Link>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex-1 space-y-4 p-2 md:p-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Publish a Ride</h2>
      </div>
      <OfferRideForm />
    </main>
  )
}
