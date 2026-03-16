import type { UserRole } from "@prisma/client"

declare module "next-auth" {
  interface User {
    id?: string
    role?: UserRole
  }
  interface Session {
    user: {
      id: string
      role?: UserRole
      name?: string | null
      email?: string | null
      image?: string | null
      phone?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    role?: UserRole
    phone?: string | null
  }
}
