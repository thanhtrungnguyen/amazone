"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_PRICE_CENTS = 100_000; // $1000 ceiling — adjust to your catalogue
const PRICE_STEP = 100; // 100 cents = $1

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "rating", label: "Best Rated" },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]["value"];

const RATING_OPTIONS = [
  { value: 4, label: "4★ & up" },
  { value: 3, label: "3★ & up" },
  { value: 2, label: "2★ & up" },
  { value: 1, label: "1★ & up" },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToDisplay(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

function parseIntParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function parseFloatParam(value: string | null): number | null {
  if (!value) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActiveFilters {
  minPriceCents: number | null;
  maxPriceCents: number | null;
  rating: number | null;
  inStock: boolean;
  sort: SortValue;
}

export function parseFilterParams(params: URLSearchParams): ActiveFilters {
  const minPriceCents = parseIntParam(params.get("minPrice"));
  const maxPriceCents = parseIntParam(params.get("maxPrice"));
  const rating = parseFloatParam(params.get("rating"));
  const inStock = params.get("inStock") === "1";
  const sortRaw = params.get("sort") ?? "featured";
  const sort = SORT_OPTIONS.some((o) => o.value === sortRaw)
    ? (sortRaw as SortValue)
    : "featured";

  return { minPriceCents, maxPriceCents, rating, inStock, sort };
}

function countActiveFilters(filters: ActiveFilters): number {
  let n = 0;
  if (filters.minPriceCents !== null || filters.maxPriceCents !== null) n++;
  if (filters.rating !== null) n++;
  if (filters.inStock) n++;
  if (filters.sort !== "featured") n++;
  return n;
}

// ─── Inner filter panel (used in both sidebar and sheet) ─────────────────────

interface FilterPanelProps {
  basePath: string;
  activeFilters: ActiveFilters;
  /** Whether we're inside the mobile Sheet (adds padding/close button area) */
  inSheet?: boolean;
}

function FilterPanel({
  basePath,
  activeFilters,
  inSheet = false,
}: FilterPanelProps): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Local slider state to avoid URL thrashing while dragging
  const [priceRange, setPriceRange] = useState<[number, number]>([
    activeFilters.minPriceCents ?? 0,
    activeFilters.maxPriceCents ?? MAX_PRICE_CENTS,
  ]);

  const buildParams = useCallback(
    (overrides: Record<string, string | null>): URLSearchParams => {
      const params = new URLSearchParams(searchParams.toString());
      // Reset cursor on every filter change
      params.delete("cursor");
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      return params;
    },
    [searchParams],
  );

  const navigate = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = buildParams(overrides);
      startTransition(() => {
        router.push(`${basePath}?${params.toString()}`);
      });
    },
    [buildParams, basePath, router],
  );

  function handlePriceCommit(values: number[]): void {
    const [min, max] = values as [number, number];
    navigate({
      minPrice: min === 0 ? null : String(min),
      maxPrice: max === MAX_PRICE_CENTS ? null : String(max),
    });
  }

  function handleRatingChange(value: number, checked: boolean): void {
    if (checked) {
      navigate({ rating: String(value) });
    } else if (activeFilters.rating === value) {
      navigate({ rating: null });
    }
  }

  function handleInStockChange(checked: boolean): void {
    navigate({ inStock: checked ? "1" : null });
  }

  function handleSortChange(value: string): void {
    navigate({ sort: value === "featured" ? null : value });
  }

  function handleClearAll(): void {
    // Keep non-filter params like search, category, q
    const params = new URLSearchParams(searchParams.toString());
    params.delete("minPrice");
    params.delete("maxPrice");
    params.delete("rating");
    params.delete("inStock");
    params.delete("sort");
    params.delete("cursor");
    setPriceRange([0, MAX_PRICE_CENTS]);
    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  const activeCount = countActiveFilters(activeFilters);

  return (
    <div className={cn("space-y-6", inSheet && "px-4 pb-6")}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
          Filters
        </span>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <Separator />

      {/* Sort */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Sort by</p>
        <Select
          value={activeFilters.sort}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Featured" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price range */}
      <div className="space-y-4">
        <p className="text-sm font-medium">Price range</p>
        <Slider
          min={0}
          max={MAX_PRICE_CENTS}
          step={PRICE_STEP}
          value={priceRange}
          onValueChange={(vals) => setPriceRange(vals as [number, number])}
          onValueCommit={handlePriceCommit}
          aria-label="Price range"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{centsToDisplay(priceRange[0])}</span>
          <span>{centsToDisplay(priceRange[1])}</span>
        </div>
      </div>

      <Separator />

      {/* Minimum rating */}
      <div className="space-y-3">
        <p className="text-sm font-medium">Customer rating</p>
        <div className="space-y-2">
          {RATING_OPTIONS.map((opt) => {
            const isChecked = activeFilters.rating === opt.value;
            const id = `rating-${opt.value}`;
            return (
              <div key={opt.value} className="flex items-center gap-2">
                <Checkbox
                  id={id}
                  checked={isChecked}
                  onCheckedChange={(checked) =>
                    handleRatingChange(opt.value, checked === true)
                  }
                />
                <Label
                  htmlFor={id}
                  className="flex cursor-pointer items-center gap-1 text-sm font-normal"
                >
                  {Array.from({ length: opt.value }, (_, i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                    />
                  ))}
                  <span className="ml-0.5 text-muted-foreground">& up</span>
                </Label>
              </div>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* In-stock toggle */}
      <div className="flex items-center justify-between">
        <Label htmlFor="in-stock-toggle" className="text-sm font-medium cursor-pointer">
          In stock only
        </Label>
        <Switch
          id="in-stock-toggle"
          checked={activeFilters.inStock}
          onCheckedChange={handleInStockChange}
        />
      </div>
    </div>
  );
}

// ─── Desktop sidebar (hidden on mobile) ──────────────────────────────────────

interface ProductFiltersSidebarProps {
  basePath: string;
  activeFilters: ActiveFilters;
}

export function ProductFiltersSidebar({
  basePath,
  activeFilters,
}: ProductFiltersSidebarProps): React.ReactElement {
  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
      <div className="sticky top-4 rounded-lg border bg-card p-4 shadow-xs">
        <FilterPanel basePath={basePath} activeFilters={activeFilters} />
      </div>
    </aside>
  );
}

// ─── Mobile trigger + sheet ───────────────────────────────────────────────────

interface ProductFiltersMobileProps {
  basePath: string;
  activeFilters: ActiveFilters;
}

export function ProductFiltersMobile({
  basePath,
  activeFilters,
}: ProductFiltersMobileProps): React.ReactElement {
  const activeCount = countActiveFilters(activeFilters);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 lg:hidden">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <Badge
              variant="default"
              className="ml-0.5 h-5 min-w-5 rounded-full px-1.5 text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader className="px-4 pt-4 pb-0">
          <SheetTitle>Filter products</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <FilterPanel
            basePath={basePath}
            activeFilters={activeFilters}
            inSheet
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
