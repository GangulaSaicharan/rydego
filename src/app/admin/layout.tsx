import { auth } from "@/auth"
import { isSuperAdmin } from "@/lib/super-admin"
import { redirect } from "next/navigation"

/**
 * Owner-only admin area. Access is restricted to emails listed in
 * ADMIN_DASHBOARD_ALLOWED_EMAILS — not to users with ADMIN role.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  if (!isSuperAdmin(session)) {
    redirect("/dashboard")
  }

  return <>{children}</>
}
