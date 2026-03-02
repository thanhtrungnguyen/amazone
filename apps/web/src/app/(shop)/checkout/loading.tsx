import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Skeleton className="mb-6 h-8 w-40" />

      {/* Title */}
      <Skeleton className="mb-8 h-9 w-36" />

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Shipping form card */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-6 w-40" />
            <div className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 sm:max-w-[200px]">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
          </div>

          {/* Items card */}
          <div className="mt-6 rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-6 w-28" />
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-6 w-32" />
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-px w-full" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
            <Skeleton className="mt-6 h-10 w-full rounded-md" />
            <Skeleton className="mx-auto mt-3 h-3 w-48" />
          </div>
        </div>
      </div>
    </div>
  );
}
