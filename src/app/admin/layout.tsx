import { auth } from "@/auth"
import { isSuperAdmin } from "@/lib/super-admin"
import { redirect } from "next/navigation"
import { OwnerDashboardSidebar } from "@/components/owner-dashboard/OwnerDashboardSidebar"

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

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl gap-6 p-4 md:p-6">
        <OwnerDashboardSidebar />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
