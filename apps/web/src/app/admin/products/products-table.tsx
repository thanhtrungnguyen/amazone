"use client";

import {
  useOptimistic,
  useTransition,
  useState,
  useCallback,
  useId,
} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatPrice } from "@amazone/shared-utils";
import { Trash2, CheckCircle, XCircle, Download, Loader2 } from "lucide-react";
import {
  bulkDeleteProducts,
  bulkSetProductStatus,
  exportProductsCSV,
} from "./actions";
import { ProductToggles } from "./product-toggles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AdminProduct {
  id: string;
  name: string;
  seller: string;
  category: string | null;
  priceCents: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  createdDate: string;
}

type BulkAction = "delete" | "activate" | "deactivate" | "export";

type OptimisticProductAction =
  | { type: "delete"; ids: string[] }
  | { type: "setStatus"; ids: string[]; isActive: boolean };

// ---------------------------------------------------------------------------
// Floating action bar
// ---------------------------------------------------------------------------

interface ActionBarProps {
  selectedCount: number;
  pendingAction: BulkAction | null;
  onDelete: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onExport: () => void;
}

function BulkActionBar({
  selectedCount,
  pendingAction,
  onDelete,
  onActivate,
  onDeactivate,
  onExport,
}: ActionBarProps): React.ReactElement {
  const isPending = pendingAction !== null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-border bg-white px-5 py-3 shadow-2xl ring-1 ring-black/5"
    >
      <span className="min-w-[80px] text-sm font-medium text-gray-700">
        {selectedCount} selected
      </span>

      <div className="h-5 w-px bg-gray-200" aria-hidden />

      <Button
        variant="destructive"
        size="sm"
        onClick={onDelete}
        disabled={isPending}
        aria-label={`Delete ${selectedCount} selected products`}
        className="gap-1.5"
      >
        {pendingAction === "delete" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Trash2 className="size-3.5" aria-hidden />
        )}
        Delete
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onActivate}
        disabled={isPending}
        aria-label={`Set ${selectedCount} selected products to active`}
        className="gap-1.5"
      >
        {pendingAction === "activate" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <CheckCircle className="size-3.5 text-green-600" aria-hidden />
        )}
        Set Active
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onDeactivate}
        disabled={isPending}
        aria-label={`Set ${selectedCount} selected products to inactive`}
        className="gap-1.5"
      >
        {pendingAction === "deactivate" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <XCircle className="size-3.5 text-amber-600" aria-hidden />
        )}
        Set Inactive
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onExport}
        disabled={isPending}
        aria-label={`Export ${selectedCount} selected products as CSV`}
        className="gap-1.5"
      >
        {pendingAction === "export" ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <Download className="size-3.5" aria-hidden />
        )}
        Export CSV
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main table component
// ---------------------------------------------------------------------------

interface ProductsTableProps {
  initialProducts: AdminProduct[];
}

export function ProductsTable({
  initialProducts,
}: ProductsTableProps): React.ReactElement {
  const selectAllId = useId();

  // isPending from useTransition tells us a transition is in flight.
  // We track *which* bulk action is running via useState so the bar shows the
  // right spinner. pendingAction is set synchronously before the async server
  // action and cleared in the finally-equivalent path.
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  // Selection is plain local state — pure UI concern.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Optimistic product list: reflects deletes and status changes immediately.
  const [optimisticProducts, applyOptimistic] = useOptimistic<
    AdminProduct[],
    OptimisticProductAction
  >(initialProducts, (current, action) => {
    if (action.type === "delete") {
      const deleted = new Set(action.ids);
      return current.filter((p) => !deleted.has(p.id));
    }
    if (action.type === "setStatus") {
      const targeted = new Set(action.ids);
      return current.map((p) =>
        targeted.has(p.id) ? { ...p, isActive: action.isActive } : p
      );
    }
    return current;
  });

  // Derived selection state
  const allVisibleIds = optimisticProducts.map((p) => p.id);
  const selectedCount = selectedIds.size;
  const allSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.has(id));
  const someSelected = selectedCount > 0 && !allSelected;

  // ---------------------------------------------------------------------------
  // Selection handlers
  // ---------------------------------------------------------------------------

  const handleSelectAll = useCallback(
    (checked: boolean | "indeterminate") => {
      setSelectedIds(
        checked === true ? new Set(allVisibleIds) : new Set()
      );
    },
    // Recompute only when the set of visible ids changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [allVisibleIds.join(",")]
  );

  const handleRowSelect = useCallback(
    (id: string, checked: boolean | "indeterminate") => {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked === true) {
          next.add(id);
        } else {
          next.delete(id);
        }
        return next;
      });
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Bulk action handlers
  // ---------------------------------------------------------------------------

  function handleDelete(): void {
    const ids = [...selectedIds];
    setPendingAction("delete");
    startTransition(async () => {
      applyOptimistic({ type: "delete", ids });
      setSelectedIds(new Set());
      const result = await bulkDeleteProducts(ids);
      if (result.success) {
        toast.success(`${ids.length} product${ids.length > 1 ? "s" : ""} deleted`);
      } else {
        // Revert: re-add ids to selection so user can retry
        toast.error(result.error ?? "Failed to delete products");
        setSelectedIds(new Set(ids));
      }
      setPendingAction(null);
    });
  }

  function handleActivate(): void {
    const ids = [...selectedIds];
    setPendingAction("activate");
    startTransition(async () => {
      applyOptimistic({ type: "setStatus", ids, isActive: true });
      setSelectedIds(new Set());
      const result = await bulkSetProductStatus(ids, true);
      if (result.success) {
        toast.success(
          `${ids.length} product${ids.length > 1 ? "s" : ""} set to active`
        );
      } else {
        toast.error(result.error ?? "Failed to activate products");
        setSelectedIds(new Set(ids));
      }
      setPendingAction(null);
    });
  }

  function handleDeactivate(): void {
    const ids = [...selectedIds];
    setPendingAction("deactivate");
    startTransition(async () => {
      applyOptimistic({ type: "setStatus", ids, isActive: false });
      setSelectedIds(new Set());
      const result = await bulkSetProductStatus(ids, false);
      if (result.success) {
        toast.success(
          `${ids.length} product${ids.length > 1 ? "s" : ""} set to inactive`
        );
      } else {
        toast.error(result.error ?? "Failed to deactivate products");
        setSelectedIds(new Set(ids));
      }
      setPendingAction(null);
    });
  }

  function handleExport(): void {
    const ids = [...selectedIds];
    setPendingAction("export");
    startTransition(async () => {
      const result = await exportProductsCSV(ids);
      if (result.success && result.csv) {
        const blob = new Blob([result.csv], {
          type: "text/csv;charset=utf-8;",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(
          `Exported ${ids.length} product${ids.length > 1 ? "s" : ""}`
        );
      } else {
        toast.error(result.error ?? "Failed to export products");
      }
      setPendingAction(null);
    });
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                id={selectAllId}
                checked={
                  allSelected ? true : someSelected ? "indeterminate" : false
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all products"
                disabled={isPending || optimisticProducts.length === 0}
              />
            </TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Seller</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Price</TableHead>
            <TableHead className="text-right">Stock</TableHead>
            <TableHead>Status / Featured</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {optimisticProducts.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-sm text-muted-foreground"
              >
                No products found.
              </TableCell>
            </TableRow>
          )}
          {optimisticProducts.map((product) => {
            const isSelected = selectedIds.has(product.id);
            return (
              <TableRow
                key={product.id}
                data-selected={isSelected}
                className="data-[selected=true]:bg-blue-50/60"
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) =>
                      handleRowSelect(product.id, checked)
                    }
                    aria-label={`Select ${product.name}`}
                    disabled={isPending}
                  />
                </TableCell>
                <TableCell className="max-w-[220px] truncate font-medium">
                  {product.name}
                </TableCell>
                <TableCell>{product.seller}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.category ?? "Uncategorized"}
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(product.priceCents)}
                </TableCell>
                <TableCell className="text-right">
                  {product.stock.toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <ProductToggles
                      productId={product.id}
                      isActive={product.isActive}
                      isFeatured={product.isFeatured}
                    />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.createdDate}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedCount > 0 && (
        <BulkActionBar
          selectedCount={selectedCount}
          pendingAction={pendingAction}
          onDelete={handleDelete}
          onActivate={handleActivate}
          onDeactivate={handleDeactivate}
          onExport={handleExport}
        />
      )}
    </>
  );
}
