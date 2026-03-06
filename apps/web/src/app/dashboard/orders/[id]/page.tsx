import Link from "next/link";
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
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import { formatPrice, type OrderStatus } from "@amazone/shared-utils";
import { OrderStatusBadge } from "@amazone/shared-ui";
import { OrderFulfillmentForm } from "./order-fulfillment-form";

export const metadata = {
  title: "Order Detail -- Amazone Dashboard",
  description: "View and manage order details and fulfillment status.",
};

// ---------- Placeholder data ----------

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPriceInCents: number;
}

interface OrderDetail {
  id: string;
  status: OrderStatus;
  createdAt: string;
  customer: {
    name: string;
    email: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  items: OrderItem[];
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  totalInCents: number;
  trackingNumber: string | null;
}

function getPlaceholderOrder(id: string): OrderDetail {
  return {
    id,
    status: "confirmed",
    createdAt: "March 2, 2026",
    customer: {
      name: "Bob Wilson",
      email: "bob.wilson@example.com",
    },
    shippingAddress: {
      street: "742 Evergreen Terrace",
      city: "Chicago",
      state: "IL",
      zipCode: "60601",
      country: "United States",
    },
    items: [
      {
        id: "item-1",
        productName: "Wireless Noise-Cancelling Headphones",
        quantity: 1,
        unitPriceInCents: 19999,
      },
      {
        id: "item-2",
        productName: "USB-C Fast Charging Cable (3-Pack)",
        quantity: 2,
        unitPriceInCents: 1299,
      },
      {
        id: "item-3",
        productName: "Laptop Stand - Adjustable Aluminum",
        quantity: 1,
        unitPriceInCents: 4999,
      },
    ],
    subtotalInCents: 27596,
    shippingInCents: 0,
    taxInCents: 2208,
    totalInCents: 29804,
    trackingNumber: null,
  };
}

// ---------- Component ----------

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const order = getPlaceholderOrder(id);

  return (
    <div>
      {/* Back link + header */}
      <div className="mb-6">
        <Link
          href="/dashboard/orders"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Orders
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold">Order #{order.id}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-muted-foreground">Placed on {order.createdAt}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: items + summary */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Items</CardTitle>
              <CardDescription>
                {order.items.length} item{order.items.length !== 1 ? "s" : ""} in
                this order
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="pr-6 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="pl-6 font-medium">
                        {item.productName}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatPrice(item.unitPriceInCents)}
                      </TableCell>
                      <TableCell className="pr-6 text-right font-medium">
                        {formatPrice(item.unitPriceInCents * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(order.subtotalInCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {order.shippingInCents === 0
                      ? "Free"
                      : formatPrice(order.shippingInCents)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatPrice(order.taxInCents)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalInCents)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: customer info + fulfillment */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{order.customer.name}</p>
                <p className="text-muted-foreground">{order.customer.email}</p>
              </div>
              <Separator />
              <div>
                <p className="mb-1 font-medium">Shipping Address</p>
                <address className="not-italic text-muted-foreground">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                  <br />
                  {order.shippingAddress.country}
                </address>
              </div>
            </CardContent>
          </Card>

          {/* Fulfillment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fulfillment</CardTitle>
              <CardDescription>
                Update order status and tracking information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderFulfillmentForm
                currentStatus={order.status}
                currentTrackingNumber={order.trackingNumber}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
