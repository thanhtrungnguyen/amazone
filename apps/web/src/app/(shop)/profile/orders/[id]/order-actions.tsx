"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { XCircle, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cancelOrderAction, requestReturnAction } from "../../actions";

// ── Error message map ─────────────────────────────────────────────────────────

const ERROR_MESSAGES: Record<string, string> = {
  "errors.order_not_found": "Order not found.",
  "errors.order_already_cancelled": "This order has already been cancelled.",
  "errors.order_already_shipped":
    "This order has already been shipped and cannot be cancelled.",
  "errors.order_cannot_be_cancelled": "This order cannot be cancelled.",
  "errors.cancel_window_expired":
    "The 1-hour cancellation window has passed. Please contact support.",
  "errors.order_not_delivered":
    "Return requests can only be submitted for delivered orders.",
  "errors.return_window_expired":
    "The 30-day return window has expired for this order.",
  "errors.return_already_requested":
    "A return request has already been submitted for this order.",
  "errors.return_reason_too_short":
    "Please provide at least 10 characters describing the reason for your return.",
  "errors.return_reason_too_long": "Reason must be 1000 characters or fewer.",
  "errors.invalid_input": "Invalid request. Please try again.",
  "errors.server_error": "Something went wrong. Please try again later.",
};

function resolveError(key: string): string {
  return ERROR_MESSAGES[key] ?? "Something went wrong. Please try again.";
}

// ── Cancel Order Button + Dialog ──────────────────────────────────────────────

interface CancelOrderButtonProps {
  orderId: string;
  userId: string;
}

export function CancelOrderButton({
  orderId,
  userId,
}: CancelOrderButtonProps): React.ReactElement {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleConfirm(): void {
    startTransition(async () => {
      const result = await cancelOrderAction(userId, orderId);

      if (result.success) {
        toast.success("Order cancelled", {
          description: "Your order has been cancelled successfully.",
        });
        router.refresh();
      } else {
        toast.error("Could not cancel order", {
          description: resolveError(result.error),
        });
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          Cancel Order
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
          <AlertDialogDescription>
            This will cancel your order and restore any reserved stock. If
            payment was collected it will be refunded within 5–10 business days.
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Keep Order
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancelling…
              </>
            ) : (
              "Yes, Cancel Order"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ── Request Return Button + Dialog ────────────────────────────────────────────

interface RequestReturnButtonProps {
  orderId: string;
  userId: string;
}

export function RequestReturnButton({
  orderId,
  userId,
}: RequestReturnButtonProps): React.ReactElement {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();

  const MIN_REASON_LENGTH = 10;
  const MAX_REASON_LENGTH = 1000;
  const reasonTooShort = reason.trim().length < MIN_REASON_LENGTH;

  function handleSubmit(): void {
    if (reasonTooShort) return;

    startTransition(async () => {
      const result = await requestReturnAction(userId, orderId, reason.trim());

      if (result.success) {
        toast.success("Return request submitted", {
          description:
            "We will review your request and get back to you within 2–3 business days.",
        });
        setOpen(false);
        setReason("");
        router.refresh();
      } else {
        toast.error("Could not submit return request", {
          description: resolveError(result.error),
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Request Return
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request a Return</DialogTitle>
          <DialogDescription>
            Please describe why you would like to return this order. Our team
            will review your request within 2–3 business days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label htmlFor="return-reason">
            Reason for return{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (min {MIN_REASON_LENGTH} characters)
            </span>
          </Label>
          <Textarea
            id="return-reason"
            placeholder="e.g. Item arrived damaged, wrong item received…"
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isPending}
            className="resize-none"
          />
          <p className="text-right text-xs text-muted-foreground">
            {reason.length}/{MAX_REASON_LENGTH}
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setReason("");
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending || reasonTooShort}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              "Submit Request"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
