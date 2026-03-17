import type { Metadata } from "next"
import Link from "next/link"
import prisma from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { updateUserRoleOwnerAction } from "@/lib/actions/owner-users"

// export const metadata: Metadata = {
//   title: "Users • Owner dashboard",
//   description: "Manage user roles and access.",
// }

export const dynamic = "force-dynamic"

const PAGE_SIZE = 10

function pageToSkip(page: number) {
  return (page - 1) * PAGE_SIZE
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const sp = (await searchParams) ?? {}
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page
  const page = Math.max(1, Number(pageRaw ?? 1) || 1)

  const [total, users] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ createdAt: "desc" }],
      skip: pageToSkip(page),
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isBlocked: true,
        createdAt: true,
      },
    }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-sm text-muted-foreground">
          Toggle a user between <span className="font-medium">USER</span> and{" "}
          <span className="font-medium">ADMIN</span>.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">All users</CardTitle>
          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{page}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span> •{" "}
            <span className="font-medium text-foreground">{total}</span> total
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Mobile</th>
                  <th className="pb-2 pr-4 font-medium">Role</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const nextRole = u.role === "ADMIN" ? "USER" : "ADMIN"
                  return (
                    <tr key={u.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-medium">
                        {u.name ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {u.email ?? "—"}
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {u.phone ?? "—"}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge
                          variant={u.role === "ADMIN" ? "default" : "secondary"}
                        >
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        {u.isBlocked ? (
                          <Badge variant="destructive">Blocked</Badge>
                        ) : (
                          <span className="text-muted-foreground">Active</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <form
                          action={async () => {
                            "use server"
                            await updateUserRoleOwnerAction({
                              userId: u.id,
                              role: nextRole,
                            })
                          }}
                          className="inline-flex"
                        >
                          <Button
                            type="submit"
                            variant="outline"
                            size="sm"
                            disabled={!u.email}
                          >
                            Make {nextRole}
                          </Button>
                        </form>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <Link
              href={`/admin/users?page=${Math.max(1, page - 1)}`}
              aria-disabled={!canPrev}
              tabIndex={canPrev ? 0 : -1}
              className={[
                "inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !canPrev ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              Previous
            </Link>

            <div className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {users.length ? pageToSkip(page) + 1 : 0}
              </span>{" "}
              –{" "}
              <span className="font-medium text-foreground">
                {pageToSkip(page) + users.length}
              </span>
            </div>

            <Link
              href={`/admin/users?page=${page + 1}`}
              aria-disabled={!canNext}
              tabIndex={canNext ? 0 : -1}
              className={[
                "inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                !canNext ? "pointer-events-none opacity-50" : "",
              ].join(" ")}
            >
              Next
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

