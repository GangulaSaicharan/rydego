import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RideCardSkeleton() {
  return (
    <Card className="overflow-hidden border shadow-sm pb-0">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="flex-1 flex items-stretch gap-3 p-2 sm:p-3 min-h-0">
            <div className="flex items-start gap-3 min-w-0 flex-1 w-full">
              <div className="flex flex-col items-center shrink-0 gap-1 pt-1">
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
                <Skeleton className="w-0.5 flex-1 min-h-[20px] my-0.5" />
                <Skeleton className="h-2.5 w-2.5 rounded-full" />
              </div>
              <div className="flex flex-col justify-between gap-3 min-w-0 py-0.5 flex-1">
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center gap-3 min-w-0 w-full sm:w-48 p-3 sm:px-5 sm:py-4 border-t sm:border-t-0 sm:border-l border-border/50 bg-muted/30 sm:bg-muted/40">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Skeleton className="h-5 w-5 sm:h-6 sm:w-6 rounded-full shrink-0" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-12 shrink-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function RideRowSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border bg-card shadow-sm">
      <div className="flex flex-1 min-w-0 gap-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      </div>
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-14" />
      </div>
    </div>
  )
}

export function BookingCardSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border bg-card">
      <div className="flex-1 min-w-0 space-y-2.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-44" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-full shrink-0" />
    </div>
  )
}

export function RideDetailsSkeleton() {
  return (
    <div className="space-y-6 p-3 md:p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b pb-3 mb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-md shrink-0" />
          <Skeleton className="h-7 w-32 md:w-48" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-12 md:w-24 shrink-0" />
          <Skeleton className="h-9 w-12 md:w-28 shrink-0" />
        </div>
      </div>

      {/* Grid of Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              {i === 0 && <Skeleton className="h-4 w-1/2" />}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
