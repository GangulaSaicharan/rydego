import { auth } from "@/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pencil, Mail, Phone, FileText, Star, Car } from "lucide-react"

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      bio: true,
      ratingAverage: true,
      ratingCount: true,
      driverProfile: { select: { totalRides: true, verified: true } },
    },
  })
  if (!user) redirect("/login")

  const initials = user.name?.[0] ?? user.email?.[0] ?? "U"
  const hasStats = (user.ratingCount && user.ratingCount > 0) || (user.driverProfile && user.driverProfile.totalRides > 0)

  return (
    <main className="flex-1 space-y-6 max-w-2xl mx-auto">
      {/* Profile hero */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-muted/80 via-muted/40 to-background border border-border/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,var(--primary)/8%,transparent)]" />
        <div className="relative px-6 py-8 md:py-10">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left sm:gap-6">
            <Avatar className="h-24 w-24 shrink-0 border-4 border-background shadow-lg md:h-28 md:w-28">
              <AvatarImage src={user.image ?? ""} alt={user.name ?? "User"} />
              <AvatarFallback className="text-2xl font-semibold md:text-3xl">{initials}</AvatarFallback>
            </Avatar>
            <div className="mt-4 sm:mt-0 sm:flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                  {user.name ?? "No name"}
                </h1>
                {user.driverProfile?.verified && (
                  <Badge variant="secondary" className="gap-1 font-medium">
                    <Car className="h-3.5 w-3.5" />
                    Driver
                  </Badge>
                )}
              </div>
              {user.email && (
                <p className="mt-1 text-sm text-muted-foreground flex items-center justify-center gap-1.5 sm:justify-start">
                  <Mail className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate">{user.email}</span>
                </p>
              )}
              <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                <Link
                  href="/profile/edit"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}
                >
                  <Pencil className="h-4 w-4" />
                  Edit profile
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row (when relevant) */}
      {hasStats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {user.ratingCount && user.ratingCount > 0 && (
            <Card size="sm" className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums">{user.ratingAverage.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">{user.ratingCount} review{user.ratingCount !== 1 ? "s" : ""}</p>
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
                  <p className="text-lg font-semibold tabular-nums">{user.driverProfile.totalRides}</p>
                  <p className="text-xs text-muted-foreground">ride{user.driverProfile.totalRides !== 1 ? "s" : ""} given</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Details card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-start gap-3 py-3 first:pt-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Phone className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <p className="text-sm text-foreground">{user.phone ?? "Not set"}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border/60 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-muted-foreground">Bio</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{user.bio || "No bio yet."}</p>
            </div>
          </div>
          {(!user.phone || !user.bio) && (
            <p className="pt-2 text-xs text-muted-foreground">
              Add phone and bio in{" "}
              <Link href="/profile/edit" className="underline underline-offset-2 hover:text-foreground">
                Edit profile
              </Link>
              .
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
