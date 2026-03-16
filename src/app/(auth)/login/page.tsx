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
}

const LINK_CLASS =
  "underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>
}

function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-linear-to-br from-background via-background to-primary/6">
      <div
        className="absolute top-[-12%] left-[-8%] w-[55%] aspect-square rounded-full bg-primary/15 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-[-18%] right-[-8%] w-[50%] aspect-square rounded-full bg-primary/12 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] aspect-square rounded-full bg-primary/4 blur-[100px] pointer-events-none"
        aria-hidden
      />
      <div className="w-full max-w-md space-y-8 relative z-10">{children}</div>
    </div>
  )
}

function LoginHeader() {
  return (
    <header className="text-center space-y-5">
      <div className="inline-flex items-center justify-center [&_img]:w-28 [&_img]:h-28 sm:[&_img]:w-32 sm:[&_img]:h-32">
        <Image
          src={LOGO_URL}
          alt="RydeGo"
          width={128}
          height={128}
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to RydeGo
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-[280px] mx-auto">
          Sign in to find rides.
        </p>
      </div>
    </header>
  )
}

function SignInBlock({
  callbackUrl,
  termsLinkClass,
}: {
  callbackUrl: string
  termsLinkClass: string
}) {
  return (
    <section
      className="space-y-6"
      aria-labelledby="sign-in-heading"
    >
      <h2 id="sign-in-heading" className="sr-only">
        Sign in options
      </h2>
      <GoogleSignInButton callbackUrl={callbackUrl} />
      <div className="relative py-1">
        <span
          className="absolute inset-0 flex items-center"
          aria-hidden
        >
          <span className="w-full border-t border-border/60" />
        </span>
      </div>
      <p className="text-center text-sm text-muted-foreground leading-relaxed">
        By continuing, you agree to our{" "}
        <Link href="/terms" className={termsLinkClass}>
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className={termsLinkClass}>
          Privacy Policy
        </Link>
        .
      </p>
    </section>
  )
}

function LoginFooter() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      Powered by <span className="font-semibold text-foreground">RydeGo</span>
    </p>
  )
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const { callbackUrl } = await searchParams
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"
  if (session?.user) redirect(safeCallbackUrl)

  return (
    <LoginLayout>
      <LoginHeader />
      <SignInBlock callbackUrl={safeCallbackUrl} termsLinkClass={LINK_CLASS} />
      <LoginFooter />
    </LoginLayout>
  )
}
