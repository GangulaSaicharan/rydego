import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { GoogleSignInButton } from "@/components/auth/google-auth-button"
import { LoginErrorToast } from "@/components/auth/login-error-toast"
import { APP_NAME, LOGO_URL } from "@/lib/constants/brand"
import { auth } from "@/auth"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Sign in",
  description: `Sign in to ${APP_NAME} to find or offer rides and manage your trips.`,
}

const LINK_CLASS =
  "underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded transition-colors"

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>
}


function LoginHeader() {
  return (
    <header className="text-center space-y-5">
      <div className="inline-flex items-center justify-center [&_img]:w-32 [&_img]:h-32 sm:[&_img]:w-36 sm:[&_img]:h-36">
        <Image
          src={LOGO_URL}
          alt={APP_NAME}
          width={136}
          height={136}
          className="object-contain"
          priority
        />
      </div>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Welcome to {APP_NAME}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-[280px] mx-auto">
          Sign in to find rides.
        </p>
      </div>
    </header>
  )
}

function mapErrorToMessage(error?: string): string | null {
  if (!error) return null
  switch (error) {
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Signin":
      return "There was a problem signing you in. Please try again."
    case "OAuthAccountNotLinked":
      return "This email is already linked with a different sign-in method."
    case "AccessDenied":
      return "Access was denied. Please use an allowed account."
    case "Configuration":
      return "Sign-in is temporarily unavailable. Please try again later."
    case "SessionRequired":
      return "Please sign in to continue."
    default:
      return "Something went wrong while signing you in. Please try again."
  }
}

function SignInBlock({
  callbackUrl,
  errorMessage,
}: {
  callbackUrl: string
  errorMessage?: string | null
}) {
  return (
    <section
      className="space-y-6"
      aria-labelledby="sign-in-heading"
    >
      <h2 id="sign-in-heading" className="sr-only">
        Sign in options
      </h2>
      {errorMessage && (
        <div
          className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {errorMessage}
        </div>
      )}
      <GoogleSignInButton callbackUrl={callbackUrl} />
      <p className="text-sm text-center text-muted-foreground leading-relaxed mb-4 max-w-xs mx-auto px-4">
        By signing in, you accept our <br /> Terms of Service and Privacy Policy.
      </p>
    </section>
  )
}


export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth()
  const { callbackUrl, error } = await searchParams
  const safeCallbackUrl =
    callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/"
  if (session?.user) redirect(safeCallbackUrl)

  const errorMessage = mapErrorToMessage(error)

  return (
    <div className="flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-linear-to-br from-background via-background to-primary/6">
      <div className="min-h-screen flex flex-col justify-center space-y-6">
        <LoginHeader />
        <LoginErrorToast message={errorMessage} />
        <SignInBlock
          callbackUrl={safeCallbackUrl}
          errorMessage={errorMessage}
        />
      </div>
      <SiteFooter
        linkClassName={LINK_CLASS}
        showDividers={false}
        className="py-2"
      />
    </div>

  )
}
