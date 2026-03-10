import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CouponFormDialog } from "./coupon-form";
import { CouponActionsCell } from "./coupon-actions-cell";

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata = {
  title: "Coupons - Admin | Amazone",
  description: "Create, edit, and manage discount coupons.",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminCoupon {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderCents: number | null;
  maxUsages: number | null;
  usageCount: number;
  expiresAt: Date | null;
  isActive: boolean;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Data fetcher
// ---------------------------------------------------------------------------

async function getCoupons(): Promise<AdminCoupon[]> {
  try {
    const { db, coupons } = await import("@amazone/db");
    const { desc } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: coupons.id,
        code: coupons.code,
        discountType: coupons.discountType,
        discountValue: coupons.discountValue,
        minOrderCents: coupons.minOrderCents,
        maxUsages: coupons.maxUsages,
        usageCount: coupons.usageCount,
        expiresAt: coupons.expiresAt,
        isActive: coupons.isActive,
        createdAt: coupons.createdAt,
      })
      .from(coupons)
      .orderBy(desc(coupons.createdAt));

    return rows;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDiscountValue(
  type: "percentage" | "fixed",
  value: number
): string {
  return type === "percentage" ? `${value}%` : `$${(value / 100).toFixed(2)}`;
}

function formatCents(cents: number | null): string {
  if (cents == null) return "--";
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(date: Date | null): string {
  if (!date) return "--";
  return date.toISOString().slice(0, 10);
}

function getCouponStatus(
  coupon: AdminCoupon
): { label: string; variant: "active" | "inactive" | "expired" } {
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return { label: "Expired", variant: "expired" };
  }
  if (!coupon.isActive) {
    return { label: "Inactive", variant: "inactive" };
  }
  if (coupon.maxUsages !== null && coupon.usageCount >= coupon.maxUsages) {
    return { label: "Exhausted", variant: "inactive" };
  }
  return { label: "Active", variant: "active" };
}

function statusBadgeClasses(variant: "active" | "inactive" | "expired"): string {
  switch (variant) {
    case "active":
      return "bg-green-100 text-green-800 border-green-200";
    case "inactive":
      return "bg-gray-100 text-gray-600 border-gray-200";
    case "expired":
      return "bg-red-100 text-red-700 border-red-200";
  }
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function AdminCouponsPage(): Promise<React.ReactElement> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/");
  }

  const couponList = await getCoupons();

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Coupons</h1>
          <p className="text-muted-foreground">
            Create, edit, and manage discount coupons.
          </p>
        </div>
        <CouponFormDialog
          dialogTitle="Create Coupon"
          dialogDescription="Add a new discount coupon to the store."
          trigger={
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          }
        />
      </div>

      {/* Coupons table */}
      <Card>
        <CardHeader>
          <CardTitle>All Coupons</CardTitle>
          <CardDescription>
            {couponList.length} coupon{couponList.length !== 1 ? "s" : ""} on
            the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {couponList.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No coupons yet. Create one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Min Order</TableHead>
                    <TableHead className="text-right">Max Uses</TableHead>
                    <TableHead className="text-right">Used</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponList.map((coupon) => {
                    const status = getCouponStatus(coupon);

                    return (
                      <TableRow key={coupon.id}>
                        <TableCell className="font-mono font-semibold">
                          {coupon.code}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {coupon.discountType === "percentage" ? "%" : "$"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatDiscountValue(
                            coupon.discountType,
                            coupon.discountValue
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatCents(coupon.minOrderCents)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {coupon.maxUsages ?? "--"}
                        </TableCell>
                        <TableCell className="text-right">
                          {coupon.usageCount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(coupon.expiresAt)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={statusBadgeClasses(status.variant)}
                          >
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <CouponActionsCell
                            coupon={{
                              id: coupon.id,
                              code: coupon.code,
                              discountType: coupon.discountType,
                              discountValue: coupon.discountValue,
                              minOrderCents: coupon.minOrderCents,
                              maxUsages: coupon.maxUsages,
                              usageCount: coupon.usageCount,
                              isActive: coupon.isActive,
                              expiresAt: coupon.expiresAt
                                ? coupon.expiresAt.toISOString().slice(0, 16)
                                : null,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
