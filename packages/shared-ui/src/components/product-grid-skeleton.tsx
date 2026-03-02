interface ProductGridSkeletonProps {
  count?: number;
}

function CardSkeleton(): React.ReactElement {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border bg-white">
      <div className="aspect-square animate-pulse bg-gray-200" />
      <div className="flex flex-col gap-2 p-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
        <div className="mt-1 h-3 w-20 animate-pulse rounded bg-gray-200" />
        <div className="mt-auto h-6 w-16 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({
  count = 8,
}: ProductGridSkeletonProps): React.ReactElement {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
