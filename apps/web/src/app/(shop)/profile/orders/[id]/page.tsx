import type { Metadata } from "next";
import Link from "next/link";
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
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";

// -- Types -------------------------------------------------------------------

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPriceInCents: number;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface PaymentInfo {
  cardLast4: string;
  cardBrand: string;
  paymentStatus: "paid" | "pending" | "failed" | "refunded";
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  createdAt: string;
  items: OrderItem[];
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  totalInCents: number;
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
}

// -- Placeholder data --------------------------------------------------------

const placeholderOrders: Record<string, OrderDetail> = {
  ord_1: {
    id: "ord_1",
    orderNumber: "AMZ-2025-0042",
    status: "delivered",
    createdAt: "2025-02-28",
    items: [
      {
        id: "item_1",
        name: "Premium Wireless Headphones",
        quantity: 1,
        unitPriceInCents: 9999,
      },
      {
        id: "item_2",
        name: "Stainless Steel Water Bottle",
        quantity: 1,
        unitPriceInCents: 2999,
      },
    ],
    subtotalInCents: 12998,
    shippingInCents: 499,
    taxInCents: 1040,
    totalInCents: 14537,
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    payment: {
      cardLast4: "4242",
      cardBrand: "Visa",
      paymentStatus: "paid",
    },
  },
  ord_2: {
    id: "ord_2",
    orderNumber: "AMZ-2025-0039",
    status: "shipped",
    createdAt: "2025-02-20",
    items: [
      {
        id: "item_3",
        name: 'Ultra HD Smart TV 55"',
        quantity: 1,
        unitPriceInCents: 49999,
      },
    ],
    subtotalInCents: 49999,
    shippingInCents: 0,
    taxInCents: 4000,
    totalInCents: 53999,
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    payment: {
      cardLast4: "1234",
      cardBrand: "Mastercard",
      paymentStatus: "paid",
    },
  },
  ord_3: {
    id: "ord_3",
    orderNumber: "AMZ-2025-0035",
    status: "processing",
    createdAt: "2025-02-12",
    items: [
      {
        id: "item_4",
        name: "Organic Cotton T-Shirt",
        quantity: 2,
        unitPriceInCents: 2499,
      },
      {
        id: "item_5",
        name: "Bluetooth Portable Speaker",
        quantity: 1,
        unitPriceInCents: 3999,
      },
    ],
    subtotalInCents: 8997,
    shippingInCents: 599,
    taxInCents: 720,
    totalInCents: 10316,
    shippingAddress: {
      name: "Jane Smith",
      street: "456 Oak Avenue, Apt 7B",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "United States",
    },
    payment: {
      cardLast4: "5678",
      cardBrand: "Visa",
      paymentStatus: "paid",
    },
  },
  ord_4: {
    id: "ord_4",
    orderNumber: "AMZ-2025-0028",
    status: "delivered",
    createdAt: "2025-01-30",
    items: [
      {
        id: "item_6",
        name: "Mechanical Gaming Keyboard",
        quantity: 1,
        unitPriceInCents: 7999,
      },
      {
        id: "item_7",
        name: "Running Shoes Pro",
        quantity: 1,
        unitPriceInCents: 12999,
      },
    ],
    subtotalInCents: 20998,
    shippingInCents: 0,
    taxInCents: 1680,
    totalInCents: 22678,
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    payment: {
      cardLast4: "4242",
      cardBrand: "Visa",
      paymentStatus: "paid",
    },
  },
  ord_5: {
    id: "ord_5",
    orderNumber: "AMZ-2025-0015",
    status: "cancelled",
    createdAt: "2025-01-10",
    items: [
      {
        id: "item_8",
        name: "Non-Stick Cookware Set",
        quantity: 1,
        unitPriceInCents: 8999,
      },
    ],
    subtotalInCents: 8999,
    shippingInCents: 499,
    taxInCents: 720,
    totalInCents: 10218,
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zip: "94102",
      country: "United States",
    },
    payment: {
      cardLast4: "4242",
      cardBrand: "Visa",
      paymentStatus: "refunded",
    },
  },
  ord_6: {
    id: "ord_6",
    orderNumber: "AMZ-2024-0198",
    status: "refunded",
    createdAt: "2024-12-18",
    items: [
      {
        id: "item_9",
        name: "Bluetooth Portable Speaker",
        quantity: 1,
        unitPriceInCents: 3999,
      },
    ],
    subtotalInCents: 3999,
    shippingInCents: 499,
    taxInCents: 320,
    totalInCents: 4818,
    shippingAddress: {
      name: "Jane Smith",
      street: "456 Oak Avenue, Apt 7B",
      city: "Portland",
      state: "OR",
      zip: "97201",
      country: "United States",
    },
    payment: {
      cardLast4: "5678",
      cardBrand: "Visa",
      paymentStatus: "refunded",
    },
  },
};

// -- Data fetching -----------------------------------------------------------

async function getOrderById(id: string): Promise<OrderDetail | null> {
  try {
    // TODO: Replace with real data fetching from @amazone/orders
    const { auth } = await import("@/lib/auth");
    await auth();
    return placeholderOrders[id] ?? null;
  } catch {
    return placeholderOrders[id] ?? null;
  }
}

// -- Helpers -----------------------------------------------------------------

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const paymentStatusLabels: Record<
  PaymentInfo["paymentStatus"],
  { label: string; className: string }
> = {
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  failed: {
    label: "Failed",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  refunded: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

// -- Metadata ----------------------------------------------------------------

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return {
      title: "Order Not Found - Amazone",
      description: "The requested order could not be found.",
    };
  }

  return {
    title: `Order ${order.orderNumber} - Amazone`,
    description: `View details for order ${order.orderNumber} placed on ${formatDate(order.createdAt)}.`,
  };
}

// -- Page component ----------------------------------------------------------

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <h1 className="text-2xl font-bold">Order Not Found</h1>
          <p className="text-muted-foreground">
            We could not find an order with that ID. It may have been removed or
            the link is incorrect.
          </p>
          <Button asChild>
            <Link href="/profile/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Order History
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const paymentStatus = paymentStatusLabels[order.payment.paymentStatus];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
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
              Order {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <p className="text-2xl font-bold">{formatPrice(order.totalInCents)}</p>
      </div>

      {/* Order items table */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order Items
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-center">
                    {item.quantity}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.unitPriceInCents)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPrice(item.unitPriceInCents * item.quantity)}
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
                  {formatPrice(order.subtotalInCents)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  Shipping
                </TableCell>
                <TableCell className="text-right">
                  {order.shippingInCents === 0
                    ? "Free"
                    : formatPrice(order.shippingInCents)}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} className="text-right">
                  Tax
                </TableCell>
                <TableCell className="text-right">
                  {formatPrice(order.taxInCents)}
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
        </CardContent>
      </Card>

      {/* Shipping and Payment cards */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Shipping address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <address className="not-italic leading-relaxed text-sm text-muted-foreground">
              <p className="font-medium text-foreground">
                {order.shippingAddress.name}
              </p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zip}
              </p>
              <p>{order.shippingAddress.country}</p>
            </address>
          </CardContent>
        </Card>

        {/* Payment info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Card</span>
                <span className="font-medium">
                  {order.payment.cardBrand} ending in {order.payment.cardLast4}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment Status</span>
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${paymentStatus.className}`}
                >
                  {paymentStatus.label}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Amount Charged</span>
                <span className="font-medium">
                  {formatPrice(order.totalInCents)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
