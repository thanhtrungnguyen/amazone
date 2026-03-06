"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface ProductSearchProps {
  defaultSearch?: string;
  defaultSort?: string;
}

export function ProductSearch({
  defaultSearch,
  defaultSort,
}: ProductSearchProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState(defaultSearch ?? "");

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset cursor when filters change — the old cursor is invalid
      params.delete("cursor");
      startTransition(() => {
        router.push(`/products?${params.toString()}`);
      });
    },
    [router, searchParams, startTransition],
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams("search", search);
  };

  return (
    <div className="flex gap-2">
      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="w-64 pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={isPending}
        />
      </form>
      <Select
        defaultValue={defaultSort ?? "newest"}
        onValueChange={(value) => updateParams("sort", value)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="price_asc">Price: Low</SelectItem>
          <SelectItem value="price_desc">Price: High</SelectItem>
          <SelectItem value="rating">Top Rated</SelectItem>
          <SelectItem value="name">Name</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
