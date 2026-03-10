"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface UserPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

export function UserPagination({
  currentPage,
  totalPages,
  totalCount,
}: UserPaginationProps): React.ReactElement {
  const searchParams = useSearchParams();

  function buildHref(page: number): string {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    return `/admin/users?${params.toString()}`;
  }

  const startItem = (currentPage - 1) * 10 + 1;
  const endItem = Math.min(currentPage * 10, totalCount);

  return (
    <div className="flex items-center justify-between border-t pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {startItem}–{endItem} of {totalCount} users
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          asChild={currentPage > 1}
          aria-label="Previous page"
        >
          {currentPage > 1 ? (
            <Link href={buildHref(currentPage - 1)}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </span>
          )}
        </Button>

        {/* Page numbers */}
        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              // Show first, last, and pages near current
              return (
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
              );
            })
            .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
              if (idx > 0) {
                const prev = arr[idx - 1];
                if (page - prev > 1) {
                  acc.push("ellipsis");
                }
              }
              acc.push(page);
              return acc;
            }, [])
            .map((item, idx) =>
              item === "ellipsis" ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-1 text-sm text-muted-foreground"
                >
                  ...
                </span>
              ) : (
                <Button
                  key={item}
                  variant={item === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-8 w-8 p-0"
                  asChild={item !== currentPage}
                  aria-label={`Page ${item}`}
                  aria-current={item === currentPage ? "page" : undefined}
                >
                  {item === currentPage ? (
                    <span>{item}</span>
                  ) : (
                    <Link href={buildHref(item)}>{item}</Link>
                  )}
                </Button>
              )
            )}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          asChild={currentPage < totalPages}
          aria-label="Next page"
        >
          {currentPage < totalPages ? (
            <Link href={buildHref(currentPage + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
