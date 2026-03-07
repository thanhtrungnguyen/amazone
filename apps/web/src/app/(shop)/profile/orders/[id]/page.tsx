import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { formatPrice } from "@amazone/shared-utils";
import type { OrderStatus } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  ShoppingBag,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrderDetail } from "../../actions";
import { Breadcrumbs } from "@/components/breadcrumbs";

// ── Status timeline configuration ──────────────────────────────────

const STATUS_STEPS: {
  status: OrderStatus;
  label: string;
  icon: typeof Package;
}[] = [
  { status: "pending", label: "Order Placed", icon: ShoppingBag },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "processing", label: "Processing", icon: Clock },
  { status: "shipped", label: "Shipped", icon: Truck },
  { status: "delivered", label: "Delivered", icon: Package },
];

const STATUS_ORDER: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
  refunded: -1,
};

// ── Helpers ────────────────────────────────────────────────────────

function generateOrderNumber(id: string, createdAt: Date): string {
  const year = createdAt.getFullYear();
  const hex = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `AMZ-${year}-${hex}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Metadata ───────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return { title: "Order - Amazone" };
  }

  const order = await getOrderDetail(session.user.id, id);

  if (!order) {
    return {
      title: "Order Not Found - Amazone",
      description: "The requested order could not be found.",
    };
  }

  const orderNumber = generateOrderNumber(order.id, order.createdAt);
  return {
    title: `Order ${orderNumber} - Amazone`,
    description: `View details for order ${orderNumber} placed on ${formatDate(order.createdAt)}.`,
  };
}

// ── Status Timeline component ──────────────────────────────────────

function StatusTimeline({
  status,
}: {
  status: string;
}): React.ReactElement {
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";
  const currentIndex = STATUS_ORDER[status] ?? 0;

  if (isCancelled || isRefunded) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border p-4 ${
          isCancelled
            ? "border-red-200 bg-red-50"
            : "border-gray-200 bg-gray-50"
        }`}
      >
        {isCancelled ? (
          <XCircle className="h-6 w-6 text-red-600" />
        ) : (
          <RotateCcw className="h-6 w-6 text-gray-600" />
        )}
        <div>
          <p className="font-medium text-foreground">
            {isCancelled ? "Order Cancelled" : "Order Refunded"}
          </p>
          <p className="text-sm text-muted-foreground">
            {isCancelled
              ? "This order has been cancelled."
              : "This order has been refunded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between"
      role="list"
      aria-label="Order status timeline"
    >
      {STATUS_STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const StepIcon = step.icon;

        return (
          <div
            key={step.status}
            className="flex flex-1 flex-col items-center"
            role="listitem"
            aria-current={isCurrent ? "step" : undefined}
          >
            {/* Connector line + icon */}
            <div className="flex w-full items-center">
              {index > 0 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isCompleted ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                <StepIcon className="h-4 w-4" />
              </div>
              {index < STATUS_STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    index < currentIndex ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            {/* Label */}
            <span
              className={`mt-2 text-center text-xs font-medium ${
                isCompleted ? "text-green-700" : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Page component ─────────────────────────────────────────────────

export default async function OrderDetailPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const order = await getOrderDetail(session.user.id, id);

  if (!order) {
    notFound();
  }

  const orderNumber = generateOrderNumber(order.id, order.createdAt);
  const subtotalInCents = order.items.reduce(
    (sum, item) => sum + item.priceInCents * item.quantity,
    0,
  );

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/profile" },
          { label: "Order History", href: "/profile/orders" },
          { label: `Order ${orderNumber}` },
        ]}
      />

      {/* Back link */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/profile/orders">
            <ArrowLeft className="h-4 w-4" />
            Back to Order History
          </Link>
        </Button>
      </div>

      {/* Order header */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Order {orderNumber}
            </h1>
            <OrderStatusBadge status={order.status as OrderStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <p className="text-2xl font-bold">
          {formatPrice(order.totalInCents)}
        </p>
      </div>

      {/* Status timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5" />
            Order Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StatusTimeline status={order.status} />
          {order.updatedAt && (
            <p className="mt-4 text-xs text-muted-foreground">
              Last updated: {formatShortDate(order.updatedAt)}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Order items table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-5 w-5" />
            Order Items ({order.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-center">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            width={48}
                            height={48}
                            className="rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-100">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <Link
                          href={`/products/${item.productSlug}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {item.productName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.priceInCents)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPrice(item.priceInCents * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3} className="text-right">
                    Subtotal
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(subtotalInCents)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatPrice(order.totalInCents)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                {item.productImage ? (
                  <Image
                    src={item.productImage}
                    alt={item.productName}
                    width={56}
                    height={56}
                    className="rounded-md object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${item.productSlug}`}
                    className="text-sm font-medium hover:text-primary hover:underline"
                  >
                    {item.productName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} x {formatPrice(item.priceInCents)}
                  </p>
                  <p className="mt-1 text-sm font-semibold">
                    {formatPrice(item.priceInCents * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatPrice(subtotalInCents)}</span>
            </div>
            <div className="flex items-center justify-between font-bold">
              <span>Total</span>
              <span>{formatPrice(order.totalInCents)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <address className="not-italic text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">
              {order.shippingName}
            </p>
            <p>{order.shippingAddress}</p>
            <p>
              {order.shippingCity}
              {order.shippingZip ? `, ${order.shippingZip}` : ""}
            </p>
            <p>{order.shippingCountry}</p>
          </address>
        </CardContent>
      </Card>
    </div>
  );
}
