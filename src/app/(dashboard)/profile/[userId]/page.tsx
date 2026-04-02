import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { FileText, Car, ArrowLeft, Phone, Star } from "lucide-react"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { APP_NAME } from "@/lib/constants/brand"

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
)

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  )

const logoUrl = `${SITE_URL}/logo.png`

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
    description: `View ${name}'s driver profile, ratings, and ride history on ${APP_NAME}.`,
    alternates: {
      canonical: `/profile/${userId}`,
    },
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
      totalRides: true,
      ratingAverage: true,
      driverProfile: { select: { verified: true } },
    },
  })

  if (!user) notFound()

  const initials = user.name?.[0] ?? "U"
  const hasStats = user.totalRides > 0

  const formattedPhone = (() => {
    if (!user.phone) return null
    if (user.phone.startsWith("+91")) {
      const digits = user.phone.replace(/^\+91/, "")
      return `+91 ${digits}`
    }
    return user.phone
  })()
  const telHref = user.phone ? `tel:${user.phone}` : undefined
  const whatsappHref = user.phone ? `https://wa.me/${user.phone.replace(/[^0-9]/g, "")}` : undefined

  const canonicalProfileUrl = `${SITE_URL}/profile/${user.id}`
  const driverJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: user.name ?? "Driver",
    url: canonicalProfileUrl,
    image: user.image ?? undefined,
    jobTitle: user.driverProfile?.verified ? "Verified driver" : "Driver",
    worksFor: {
      "@type": "Organization",
      name: APP_NAME,
      url: SITE_URL,
      logo: logoUrl,
    },
  }

  return (
    <main className="flex-1 space-y-6 max-w-2xl">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(driverJsonLd) }}
      />
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
                {user?.ratingAverage > 0 && (
                  <Badge variant="outline" className="gap-1 font-medium bg-amber-500/10 text-amber-600 border-amber-500/20">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {user.ratingAverage}
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
          {user.totalRides > 0 && (
            <Card size="sm" className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Car className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-semibold tabular-nums">
                    {user.totalRides}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ride{user.totalRides !== 1 ? "s" : ""} given
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
          {formattedPhone && (
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none mb-1">Mobile</p>
                  <p className="text-sm font-semibold text-foreground">{formattedPhone}</p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <a
                  href={telHref}
                  title="Call"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "h-9 w-9 rounded-full transition-all hover:bg-primary hover:text-primary-foreground hover:border-primary shadow-sm"
                  )}
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="WhatsApp"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "h-9 w-9 rounded-full transition-all hover:bg-[#25D366] hover:text-white hover:border-[#25D366] shadow-sm group"
                  )}
                >
                  <WhatsAppIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                </a>
              </div>
            </div>
          )}
          <div className={cn("flex items-start gap-3 py-3", formattedPhone && "border-t border-border/60")}>
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
