import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  trustHost: true, // required for ngrok / preview URLs (middleware uses this config)
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const { pathname } = nextUrl

      // Public pages (guest-accessible)
      if (
        pathname === "/" ||
        pathname === "/login" ||
        pathname.startsWith("/search") ||
        pathname.startsWith("/rides") ||
        pathname.startsWith("/profile") ||
        pathname.startsWith("/privacy") ||
        pathname.startsWith("/terms")
      ) {
        return true
      }

      // Lock down API routes (except /api/auth which is excluded by middleware matcher)
      if (pathname.startsWith("/api")) {
        return isLoggedIn
      }

      // Everything else requires login
      return isLoggedIn
    },
  },
  pages: {
    signIn: "/login",
    // Redirect auth errors (e.g. OAuth state mismatch after back button) to login so user can retry
    error: "/login",
  },
} satisfies NextAuthConfig
