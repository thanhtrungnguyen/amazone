import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function TrackingLoading(): React.ReactElement {
  return (
    <div>
      {/* Back link */}
      <Skeleton className="mb-6 h-8 w-44" />

      {/* Page header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Estimated delivery banner */}
      <Skeleton className="mb-6 h-16 w-full rounded-lg" />

      {/* Progress stepper */}
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          {/* Desktop horizontal stepper skeleton */}
          <div className="hidden md:block">
            <div className="flex items-center justify-between">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              ))}
            </div>
          </div>
          {/* Mobile vertical stepper skeleton */}
          <div className="block md:hidden">
            <div className="flex flex-col gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping info + Map */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-24 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="my-4 h-px w-full" />
              <Skeleton className="h-4 w-28" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full rounded-lg lg:h-full lg:min-h-48" />
          </CardContent>
        </Card>
      </div>

      {/* Timeline skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
