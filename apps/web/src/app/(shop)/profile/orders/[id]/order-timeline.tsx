import type { OrderEvent } from "@amazone/orders";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingBag,
  XCircle,
  RotateCcw,
  MapPin,
  ExternalLink,
} from "lucide-react";

// ── Event type configuration ──────────────────────────────────────────────────

interface EventConfig {
  icon: typeof Package;
  colorClass: string;
  dotColorClass: string;
  lineColorClass: string;
  label: string;
}

const EVENT_CONFIG: Record<string, EventConfig> = {
  created: {
    icon: ShoppingBag,
    colorClass: "text-blue-600",
    dotColorClass: "bg-blue-600",
    lineColorClass: "bg-blue-200",
    label: "Order Created",
  },
  confirmed: {
    icon: CheckCircle2,
    colorClass: "text-green-600",
    dotColorClass: "bg-green-600",
    lineColorClass: "bg-green-200",
    label: "Confirmed",
  },
  processing: {
    icon: Clock,
    colorClass: "text-amber-600",
    dotColorClass: "bg-amber-600",
    lineColorClass: "bg-amber-200",
    label: "Processing",
  },
  shipped: {
    icon: Truck,
    colorClass: "text-indigo-600",
    dotColorClass: "bg-indigo-600",
    lineColorClass: "bg-indigo-200",
    label: "Shipped",
  },
  out_for_delivery: {
    icon: MapPin,
    colorClass: "text-purple-600",
    dotColorClass: "bg-purple-600",
    lineColorClass: "bg-purple-200",
    label: "Out for Delivery",
  },
  delivered: {
    icon: Package,
    colorClass: "text-green-700",
    dotColorClass: "bg-green-700",
    lineColorClass: "bg-green-300",
    label: "Delivered",
  },
  cancelled: {
    icon: XCircle,
    colorClass: "text-red-600",
    dotColorClass: "bg-red-600",
    lineColorClass: "bg-red-200",
    label: "Cancelled",
  },
  return_requested: {
    icon: RotateCcw,
    colorClass: "text-amber-600",
    dotColorClass: "bg-amber-600",
    lineColorClass: "bg-amber-200",
    label: "Return Requested",
  },
};

const DEFAULT_CONFIG: EventConfig = {
  icon: Clock,
  colorClass: "text-gray-600",
  dotColorClass: "bg-gray-600",
  lineColorClass: "bg-gray-200",
  label: "Update",
};

// ── Relative time formatting ──────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return "Just now";
  }
  if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  }
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }
  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Tracking info component ─────────────────────────────────────────────────

interface TrackingInfoProps {
  metadata: Record<string, unknown>;
}

function TrackingInfo({ metadata }: TrackingInfoProps): React.ReactElement | null {
  const trackingNumber = metadata.trackingNumber as string | undefined;
  const carrierName = metadata.carrierName as string | undefined;

  if (!trackingNumber && !carrierName) {
    return null;
  }

  return (
    <div className="mt-2 rounded-md border border-indigo-100 bg-indigo-50 px-3 py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {carrierName && (
          <div>
            <span className="font-medium text-indigo-900">Carrier: </span>
            <span className="text-indigo-700">{carrierName}</span>
          </div>
        )}
        {trackingNumber && (
          <div className="flex items-center gap-1">
            <span className="font-medium text-indigo-900">Tracking: </span>
            <code className="rounded bg-indigo-100 px-1.5 py-0.5 font-mono text-xs text-indigo-700">
              {trackingNumber}
            </code>
            <ExternalLink className="ml-0.5 h-3 w-3 text-indigo-400" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main OrderTimeline component ────────────────────────────────────────────

interface OrderTimelineProps {
  events: OrderEvent[];
}

export function OrderTimeline({ events }: OrderTimelineProps): React.ReactElement {
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
        No tracking events yet.
      </div>
    );
  }

  // Display events in reverse chronological order (most recent first)
  const sortedEvents = [...events].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div
      className="relative"
      role="list"
      aria-label="Order tracking timeline"
    >
      {sortedEvents.map((event, index) => {
        const config = EVENT_CONFIG[event.type] ?? DEFAULT_CONFIG;
        const EventIcon = config.icon;
        const isLatest = index === 0;
        const isLast = index === sortedEvents.length - 1;

        return (
          <div
            key={event.id}
            className="relative flex gap-4 pb-8 last:pb-0"
            role="listitem"
          >
            {/* Vertical line */}
            {!isLast && (
              <div
                className={`absolute left-[15px] top-8 h-[calc(100%-16px)] w-0.5 ${
                  isLatest ? config.lineColorClass : "bg-gray-200"
                }`}
                aria-hidden="true"
              />
            )}

            {/* Icon dot */}
            <div className="relative z-10 flex shrink-0">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  isLatest
                    ? `${config.dotColorClass} text-white ring-4 ring-opacity-20 ${config.lineColorClass.replace("bg-", "ring-")}`
                    : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                <EventIcon className="h-4 w-4" />
              </div>
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2">
                <p
                  className={`text-sm font-semibold ${
                    isLatest ? config.colorClass : "text-foreground"
                  }`}
                >
                  {config.label}
                </p>
                <time
                  className="text-xs text-muted-foreground"
                  dateTime={event.createdAt.toISOString()}
                  title={formatFullDate(event.createdAt)}
                >
                  {formatRelativeTime(event.createdAt)}
                </time>
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {event.message}
              </p>

              {/* Show tracking info if metadata contains it */}
              {event.metadata && <TrackingInfo metadata={event.metadata} />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
