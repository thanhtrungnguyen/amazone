import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading() {
  return (
    <div className="w-full max-w-md space-y-4 rounded-lg border p-6">
      <div className="flex flex-col items-center gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="space-y-4 pt-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
