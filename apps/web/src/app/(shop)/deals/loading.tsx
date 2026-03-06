import { Skeleton } from "@/components/ui/skeleton";

export default function DealsLoading(): React.ReactElement {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero skeleton */}
      <Skeleton className="mb-10 h-40 w-full rounded-xl" />

      {/* Deal of the Day skeleton */}
      <Skeleton className="mb-4 h-8 w-48" />
      <Skeleton className="mb-12 h-72 w-full rounded-lg" />

      {/* Products on Sale skeleton */}
      <Skeleton className="mb-4 h-8 w-40" />
      <div className="mb-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square" />
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Lightning Deals skeleton */}
      <Skeleton className="mb-4 h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col overflow-hidden rounded-lg border">
            <Skeleton className="aspect-square" />
            <div className="flex flex-col gap-2 p-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
