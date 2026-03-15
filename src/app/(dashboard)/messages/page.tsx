import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Messages",
  description: "Chat with drivers and passengers on RydeGo.",
};

export default function MessagesPage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Messages</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Your Conversations</CardTitle>
          <CardDescription>
            Chat with drivers and passengers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Messaging is coming soon!</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Communicate easily with other members of the RydeGo community.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
