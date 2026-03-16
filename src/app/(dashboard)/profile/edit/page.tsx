import type { Metadata } from "next"
import { auth } from "@/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"

import { EditProfileForm } from "./edit-profile-form"
import { Card, CardContent,  buttonVariants} from "@/components/ui"
import { cn } from "@/lib/utils"
import { ArrowLeft } from "lucide-react"

export const metadata: Metadata = {
  title: "Edit Profile",
  description: "Update your name, phone, and bio on RydeGo.",
};

export default async function EditProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, phone: true, bio: true },
  })
  if (!user) redirect("/login")

  return (
    <main className="flex-1 space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/profile"
          aria-label="Back to profile"
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "shrink-0 -ml-1")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            Edit profile
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Update your phone and bio. Name and email are managed by your account.
          </p>
        </div>
      </div>

      {/* Account info (read-only) */}
      <Card>
        <CardContent>
          <EditProfileForm
            defaultBio={user.bio ?? ""}
            defaultPhone={user.phone ?? ""}
            name={user.name ?? ""}
            email={user.email ?? ""}
          />
        </CardContent>
      </Card>
    </main>
  )
}
