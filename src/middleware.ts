import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export default NextAuth(authConfig).auth

export const config = {
  // Matcher ignoring `/_next/` and `/api/auth/`
  // Ignore `/api/cron/*`: secured by CRON_SECRET in the route; cron has no session cookie.
  // Also ignore common public/static assets (e.g. /logo.png).
  // Otherwise NextAuth middleware runs for those requests and can break image optimization.
  matcher: [
    "/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|manifest.json|.*\\..*).*)",
  ],
}
