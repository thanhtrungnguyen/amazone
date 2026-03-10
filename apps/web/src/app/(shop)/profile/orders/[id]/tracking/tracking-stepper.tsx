"use client";

import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  ShoppingBag,
  MapPin,
  XCircle,
  RotateCcw,
} from "lucide-react";
import type { OrderEvent } from "@amazone/orders";

// ── Step definitions ───────────────────────────────────────────────

interface StepDefinition {
  key: string;
  label: string;
  icon: typeof Package;
}

const TRACKING_STEPS: StepDefinition[] = [
  { key: "created", label: "Order Placed", icon: ShoppingBag },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "processing", label: "Processing", icon: Clock },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: MapPin },
  { key: "delivered", label: "Delivered", icon: Package },
];

const STATUS_TO_STEP_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
};

// ── Helpers ────────────────────────────────────────────────────────

function formatStepDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function findEventForStep(
  events: OrderEvent[],
  stepKey: string,
): OrderEvent | undefined {
  // Map step key to event type — "created" maps to the "created" event, etc.
  // "pending" status doesn't have a direct event type; it maps to "created".
  return events.find((e) => e.type === stepKey);
}

// ── Props ──────────────────────────────────────────────────────────

interface TrackingStepperProps {
  status: string;
  events: OrderEvent[];
}

// ── Component ──────────────────────────────────────────────────────

export function TrackingStepper({
  status,
  events,
}: TrackingStepperProps): React.ReactElement {
  const isCancelled = status === "cancelled";
  const isRefunded = status === "refunded";
  const isReturnRequested = status === "return_requested";

  // Handle terminal/abnormal states
  if (isCancelled || isRefunded || isReturnRequested) {
    const config = isCancelled
      ? {
          bgClass: "bg-red-50 border-red-200",
          iconBgClass: "bg-red-100",
          iconClass: "text-red-600",
          icon: XCircle,
          title: "Order Cancelled",
          description:
            "This order has been cancelled. If payment was collected, a refund will be processed within 5-10 business days.",
        }
      : isReturnRequested
        ? {
            bgClass: "bg-amber-50 border-amber-200",
            iconBgClass: "bg-amber-100",
            iconClass: "text-amber-600",
            icon: RotateCcw,
            title: "Return Requested",
            description:
              "Your return request is under review. We will be in touch within 2-3 business days.",
          }
        : {
            bgClass: "bg-gray-50 border-gray-200",
            iconBgClass: "bg-gray-100",
            iconClass: "text-gray-600",
            icon: RotateCcw,
            title: "Order Refunded",
            description:
              "This order has been refunded. The amount should appear in your account within 5-10 business days.",
          };

    const StatusIcon = config.icon;

    return (
      <div
        className={`flex items-start gap-4 rounded-lg border p-4 ${config.bgClass}`}
        role="alert"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.iconBgClass}`}
        >
          <StatusIcon className={`h-5 w-5 ${config.iconClass}`} />
        </div>
        <div>
          <p className="font-semibold text-foreground">{config.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {config.description}
          </p>
        </div>
      </div>
    );
  }

  // Determine active step index from status
  const currentStepIndex = STATUS_TO_STEP_INDEX[status] ?? 0;

  return (
    <div>
      {/* Desktop: horizontal stepper */}
      <div
        className="hidden md:block"
        role="list"
        aria-label="Order tracking progress"
      >
        <div className="flex items-start">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const StepIcon = step.icon;
            const event = findEventForStep(events, step.key);

            return (
              <div
                key={step.key}
                className="flex flex-1 flex-col items-center"
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Connector line + icon row */}
                <div className="flex w-full items-center">
                  {index > 0 && (
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        isCompleted
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-green-500 text-white shadow-md shadow-green-200"
                        : isCurrent
                          ? "border-2 border-blue-500 bg-blue-50 text-blue-600 shadow-md shadow-blue-100"
                          : "border-2 border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    <StepIcon className="h-5 w-5" />
                    {isCurrent && (
                      <span
                        className="absolute -inset-1 animate-ping rounded-full border-2 border-blue-400 opacity-20"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {index < TRACKING_STEPS.length - 1 && (
                    <div
                      className={`h-1 flex-1 rounded-full transition-colors duration-500 ${
                        index < currentStepIndex
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Label + timestamp */}
                <div className="mt-3 flex flex-col items-center text-center">
                  <span
                    className={`text-xs font-semibold transition-colors duration-300 ${
                      isCompleted
                        ? "text-green-700"
                        : isCurrent
                          ? "text-blue-700"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </span>
                  {event ? (
                    <time
                      className="mt-0.5 text-[11px] text-muted-foreground"
                      dateTime={event.createdAt.toISOString()}
                    >
                      {formatStepDate(event.createdAt)}
                    </time>
                  ) : isPending ? (
                    <span className="mt-0.5 text-[11px] text-muted-foreground/50">
                      Pending
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: vertical stepper */}
      <div
        className="block md:hidden"
        role="list"
        aria-label="Order tracking progress"
      >
        <div className="flex flex-col">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const isPending = index > currentStepIndex;
            const StepIcon = step.icon;
            const event = findEventForStep(events, step.key);
            const isLast = index === TRACKING_STEPS.length - 1;

            return (
              <div
                key={step.key}
                className="relative flex gap-4"
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Vertical line + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                      isCompleted
                        ? "bg-green-500 text-white shadow-sm shadow-green-200"
                        : isCurrent
                          ? "border-2 border-blue-500 bg-blue-50 text-blue-600 shadow-sm shadow-blue-100"
                          : "border-2 border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    <StepIcon className="h-4 w-4" />
                    {isCurrent && (
                      <span
                        className="absolute -inset-0.5 animate-ping rounded-full border-2 border-blue-400 opacity-20"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`my-1 w-0.5 flex-1 rounded-full transition-colors duration-500 ${
                        index < currentStepIndex
                          ? "bg-green-500"
                          : "bg-gray-200"
                      }`}
                      style={{ minHeight: "24px" }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-6 pt-1.5 ${isLast ? "pb-0" : ""}`}>
                  <p
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isCompleted
                        ? "text-green-700"
                        : isCurrent
                          ? "text-blue-700"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  {event ? (
                    <time
                      className="text-xs text-muted-foreground"
                      dateTime={event.createdAt.toISOString()}
                    >
                      {formatStepDate(event.createdAt)}
                    </time>
                  ) : isPending ? (
                    <span className="text-xs text-muted-foreground/50">
                      Pending
                    </span>
                  ) : null}
                  {event?.message && isCurrent && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {event.message}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
