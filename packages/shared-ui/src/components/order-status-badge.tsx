import type { OrderStatus } from "@amazone/shared-utils";

const statusConfig: Record<
  OrderStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  confirmed: {
    label: "Confirmed",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  processing: {
    label: "Processing",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  shipped: {
    label: "Shipped",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  delivered: {
    label: "Delivered",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  refunded: {
    label: "Refunded",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
};

interface OrderStatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function OrderStatusBadge({
  status,
  className,
}: OrderStatusBadgeProps): React.ReactElement {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className} ${className ?? ""}`}
    >
      {config.label}
    </span>
  );
}
