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
      const isLoggedIn = !!auth?.user;
      const isHomePage = nextUrl.pathname === "/";
      
      if (isHomePage) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      return true;
    },
  },
  pages: {
    signIn: "/login",
    // Redirect auth errors (e.g. OAuth state mismatch after back button) to login so user can retry
    error: "/login",
  },
} satisfies NextAuthConfig
