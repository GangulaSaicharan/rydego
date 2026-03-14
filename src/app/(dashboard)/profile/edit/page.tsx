import { auth } from "@/auth"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { EditProfileForm } from "./edit-profile-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

export default async function EditProfilePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, phone: true, bio: true },
  })
  if (!user) redirect("/login")

  return (
    <main className="flex-1 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Link href="/profile" aria-label="Back to profile">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit profile</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
          <CardDescription>Name and email are from your account and cannot be changed here.</CardDescription>
        </CardHeader>
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
