import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { GoogleSignInButton } from "@/components/auth/google-auth-button"
import { LOGO_URL } from "@/lib/constants/brand"
import { auth } from "@/auth"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to RydeGo to find or offer rides and manage your trips.",
};

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const { callbackUrl } = await searchParams
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"
  if (session?.user) redirect(safeCallbackUrl)

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-primary/5 p-4 sm:p-6 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[45%] aspect-square bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-5 rounded-2xl bg-card/80 [&_img]:w-28 [&_img]:h-28 sm:[&_img]:w-32 sm:[&_img]:h-32">
            <Image
              src={LOGO_URL}
              alt="RydeGo"
              width={128}
              height={128}
              className="object-contain"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl drop-shadow-sm">
              Welcome to RydeGo
            </h1>
            <p className="text-muted-foreground text-lg max-w-xs mx-auto">
              Sign in to access your dashboard and find or offer rides.
            </p>
          </div>
        </div>

        {/* Sign-in card */}
        <div className="bg-card/95 p-8 sm:p-10 rounded-3xl border border-border/60 shadow-xl shadow-foreground/10 backdrop-blur-md transition-shadow hover:shadow-2xl hover:shadow-foreground/10">
          <div className="space-y-6">
            <GoogleSignInButton callbackUrl={safeCallbackUrl} />

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/60" aria-hidden />
              </div>
            </div>

            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              By continuing, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Powered by{" "}
          <span className="font-semibold text-foreground">RydeGo</span>
        </p>
      </div>
    </div>
  )
}
