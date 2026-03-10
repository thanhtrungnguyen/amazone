"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Loader2 } from "lucide-react";

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserFilters(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get("search") ?? "";
  const currentRole = searchParams.get("role") ?? "all";

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filters change
      params.delete("page");

      startTransition(() => {
        router.push(`/admin/users?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const search = formData.get("search") as string;
    updateParams({ search });
  }

  function handleRoleChange(role: string): void {
    updateParams({ role });
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search form */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          name="search"
          type="search"
          placeholder="Search by name or email..."
          defaultValue={currentSearch}
          className="pl-9 pr-4"
          aria-label="Search users"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </form>

      {/* Role filter */}
      <Select value={currentRole} onValueChange={handleRoleChange}>
        <SelectTrigger
          className="w-full sm:w-[160px]"
          aria-label="Filter by role"
        >
          <SelectValue placeholder="All Roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="customer">Customer</SelectItem>
          <SelectItem value="seller">Seller</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
