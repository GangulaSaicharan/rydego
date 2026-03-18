import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { APP_NAME } from "@/lib/constants/brand"

export const metadata: Metadata = {
  title: "Schedule",
  description: `Set up recurring trips and automate your commute with ${APP_NAME}.`,
};

export default function SchedulePage() {
  return (
    <main className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Schedule Recurring Trip</h2>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Set Up Frequent Trips</CardTitle>
          <CardDescription>
            Automate your daily commute or weekly travels.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-muted-foreground/20 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Scheduling is coming soon!</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-2">
            Set up your routine trips once and let us handle the rest.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
