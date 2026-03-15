import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FileText, Star, Car, ArrowLeft, Phone } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

type Props = { params: Promise<{ userId: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
  if (!user) return { title: "Profile" }
  const name = user.name || "Driver"
  return {
    title: `${name}'s Profile`,
    description: `View ${name}'s driver profile, ratings, and ride history on RydeGo.`,
  }
}

export default async function DriverProfilePage({ params }: Props) {
  const { userId } = await params
  const session = await auth()

  // Own profile: redirect to main profile page
  if (session?.user?.id === userId) {
    redirect("/profile")
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      image: true,
      phone: true,
      bio: true,
      ratingAverage: true,
      ratingCount: true,
      driverProfile: { select: { totalRides: true, verified: true } },
    },
  })

  if (!user) notFound()

  const initials = user.name?.[0] ?? "U"
  const hasStats =
    (user.ratingCount && user.ratingCount > 0) ||
    (user.driverProfile && user.driverProfile.totalRides > 0)

  return (
    <main className="flex-1 space-y-6 max-w-2xl mx-auto">
      <Link
        href="/search"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-2 -ml-2")}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to search
      </Link>

      {/* Profile hero - public driver view */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-muted/80 via-muted/40 to-background border border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/8%,transparent)]" />
        <div className="relative px-6 py-8 md:py-10">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
            <Avatar className="h-24 w-24 shrink-0 border-4 border-background shadow-lg md:h-28 md:w-28">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? "Driver"} />
              <AvatarFallback className="text-2xl font-semibold md:text-3xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0 sm:flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {user.name ?? "Driver"}
                </h1>
                {user.driverProfile?.verified && (
                  <Badge variant="secondary" className="gap-1 font-medium">
                    <Car className="h-3.5 w-3.5" />
                    Verified driver
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {user.ratingCount && user.ratingCount > 0 && (
            <Card size="sm" className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {user.ratingAverage.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.ratingCount} review{user.ratingCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          {user.driverProfile && user.driverProfile.totalRides > 0 && (
            <Card size="sm" className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {user.driverProfile.totalRides}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ride{user.driverProfile.totalRides !== 1 ? "s" : ""} given
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Contact & About card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {user.phone && (
            <div className="flex items-center gap-3 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Mobile</p>
                <a href={`tel:${user.phone}`} className="text-sm text-foreground underline underline-offset-2 hover:text-primary">
                  {user.phone}
                </a>
              </div>
            </div>
          )}
          <div className={cn("flex items-start gap-3 py-3", user.phone && "border-t border-border/60")}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">About</p>
              <p className="text-sm text-foreground whitespace-pre-wrap mt-0.5">
                {user.bio || "No bio provided."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
