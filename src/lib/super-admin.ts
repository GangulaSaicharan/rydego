import type { Session } from "next-auth"

/**
 * Comma-separated list of emails allowed to access the owner/admin dashboard.
 * Not related to the USER/ADMIN role — only these emails can open /admin.
 * Example: ADMIN_DASHBOARD_ALLOWED_EMAILS=you@example.com,other@example.com
 */
const ALLOWED_EMAILS = (process.env.ADMIN_DASHBOARD_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

export function isSuperAdmin(session: Session | null): boolean {
  if (!session?.user?.email) return false
  const email = session.user.email.trim().toLowerCase()
  return ALLOWED_EMAILS.includes(email)
}

export function getSuperAdminEmails(): string[] {
  return [...ALLOWED_EMAILS]
}
