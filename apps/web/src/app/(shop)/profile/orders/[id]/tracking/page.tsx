import type { Metadata } from "next";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Truck,
  MapPin,
  Calendar,
  ExternalLink,
  Map,
} from "lucide-react";
import { OrderStatusBadge } from "@amazone/shared-ui";
import type { OrderStatus } from "@amazone/shared-utils";
import { auth } from "@/lib/auth";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getOrderTracking } from "./actions";
import { TrackingStepper } from "./tracking-stepper";
import { OrderTimeline } from "../order-timeline";

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

function formatEstimatedDelivery(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
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
    return { title: "Track Order - Amazone" };
  }

  const tracking = await getOrderTracking(id, session.user.id);

  if (!tracking) {
    return {
      title: "Order Not Found - Amazone",
      description: "The requested order could not be found.",
    };
  }

  const orderNumber = generateOrderNumber(tracking.orderId, tracking.createdAt);
  return {
    title: `Track Order ${orderNumber} - Amazone`,
    description: `Track the delivery status of order ${orderNumber}.`,
  };
}

// ── Page ───────────────────────────────────────────────────────────

export default async function OrderTrackingPage({
  params,
}: PageProps): Promise<React.ReactElement> {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const tracking = await getOrderTracking(id, session.user.id);

  if (!tracking) {
    notFound();
  }

  const orderNumber = generateOrderNumber(tracking.orderId, tracking.createdAt);

  const isActiveShipment =
    tracking.status === "shipped" || tracking.status === "out_for_delivery";

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Account", href: "/profile" },
          { label: "Order History", href: "/profile/orders" },
          {
            label: `Order ${orderNumber}`,
            href: `/profile/orders/${tracking.orderId}`,
          },
          { label: "Tracking" },
        ]}
      />

      {/* Back link */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href={`/profile/orders/${tracking.orderId}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Order Details
          </Link>
        </Button>
      </div>

      {/* Page header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold sm:text-3xl">
              Track Order {orderNumber}
            </h1>
            <OrderStatusBadge status={tracking.status as OrderStatus} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(tracking.createdAt)}
          </p>
        </div>
      </div>

      {/* Estimated delivery banner */}
      {tracking.estimatedDelivery && isActiveShipment && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <Calendar className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">
              Estimated Delivery
            </p>
            <p className="text-sm text-green-700">
              {formatEstimatedDelivery(tracking.estimatedDelivery)}
            </p>
          </div>
        </div>
      )}

      {tracking.status === "delivered" && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
          <Truck className="h-5 w-5 shrink-0 text-green-600" />
          <div>
            <p className="text-sm font-semibold text-green-800">Delivered</p>
            <p className="text-sm text-green-700">
              Your order has been delivered successfully.
            </p>
          </div>
        </div>
      )}

      {/* Progress stepper */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Truck className="h-5 w-5" />
            Delivery Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TrackingStepper
            status={tracking.status}
            events={tracking.events}
          />
        </CardContent>
      </Card>

      {/* Shipping info + Map placeholder side by side on desktop */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        {/* Shipping info card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Carrier & tracking number */}
            {(tracking.shippingCarrier || tracking.trackingNumber) && (
              <div className="space-y-3">
                {tracking.shippingCarrier && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Carrier
                    </span>
                    <Badge variant="secondary" className="font-medium">
                      {tracking.shippingCarrier}
                    </Badge>
                  </div>
                )}
                {tracking.trackingNumber && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      Tracking Number
                    </span>
                    <div className="flex items-center gap-1.5">
                      <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                        {tracking.trackingNumber}
                      </code>
                      <ExternalLink
                        className="h-3.5 w-3.5 text-muted-foreground"
                        aria-label="Open carrier tracking page"
                      />
                    </div>
                  </div>
                )}
                {tracking.estimatedDelivery && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Estimated Delivery
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(tracking.estimatedDelivery)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {!tracking.shippingCarrier && !tracking.trackingNumber && (
              <p className="text-sm text-muted-foreground">
                Shipping details will be available once your order is shipped.
              </p>
            )}

            <Separator />

            {/* Delivery address */}
            <div>
              <p className="mb-2 text-sm font-medium">Delivery Address</p>
              <address className="not-italic text-sm leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">
                  {tracking.shippingName}
                </p>
                <p>{tracking.shippingAddress}</p>
                <p>
                  {tracking.shippingCity}
                  {tracking.shippingState
                    ? `, ${tracking.shippingState}`
                    : ""}
                  {tracking.shippingZip ? ` ${tracking.shippingZip}` : ""}
                </p>
                <p>{tracking.shippingCountry}</p>
              </address>
            </div>
          </CardContent>
        </Card>

        {/* Map placeholder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-5 w-5" />
              Live Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 lg:h-full lg:min-h-48"
              role="img"
              aria-label="Map tracking placeholder"
            >
              <Map className="mb-3 h-10 w-10 text-gray-300" />
              <p className="text-sm font-medium text-gray-400">
                Map tracking coming soon
              </p>
              <p className="mt-1 max-w-xs text-center text-xs text-gray-400">
                Real-time package location will be displayed here in a future
                update.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full event timeline */}
      {tracking.events.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5" />
              Tracking Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline events={tracking.events} />
          </CardContent>
        </Card>
      )}

      {/* Link back to order */}
      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link href={`/profile/orders/${tracking.orderId}`}>
            View Full Order Details
          </Link>
        </Button>
      </div>
    </div>
  );
}
