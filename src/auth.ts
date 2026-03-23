import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "@/lib/db"
import { authConfig } from "./auth.config"

const prismaAdapter = PrismaAdapter(prisma)
const adapterCreateUser = prismaAdapter.createUser?.bind(prismaAdapter)

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...prismaAdapter,
    async createUser(data) {
      if (!adapterCreateUser) {
        throw new Error("Adapter createUser is unavailable")
      }
      return adapterCreateUser({
        ...data,
        role: "ADMIN",
      } as typeof data)
    },
  },
  session: { strategy: "jwt" },
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, phone: true },
        })
        token.role = dbUser?.role ?? "USER"
        ;(token as any).phone = dbUser?.phone ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string
        session.user.role = token.role as "USER" | "ADMIN"
        ;(session.user as any).phone = (token as any).phone ?? null
      }
      return session
    },
  },
})
