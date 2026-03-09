"use client";

import { useTransition } from "react";
import { Bell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { triggerLowStockAlertEmail } from "./low-stock-actions";

interface Props {
  sellerId: string;
}

/**
 * Client component that calls the `triggerLowStockAlertEmail` server action
 * for the current seller and shows toast feedback.
 */
export default function SendLowStockButton({ sellerId }: Props): React.ReactElement {
  const [isPending, startTransition] = useTransition();

  function handleClick(): void {
    startTransition(async () => {
      const result = await triggerLowStockAlertEmail(sellerId);

      if (!result.success) {
        toast.error("Failed to send alert", {
          description: "Could not send the low stock alert email. Please try again.",
        });
        return;
      }

      const { sent, failed } = result.data;

      if (sent === 0 && failed === 0) {
        toast.info("No low-stock products", {
          description: "All your products have sufficient stock — no alert needed.",
        });
        return;
      }

      if (failed > 0) {
        toast.warning("Alert sent with errors", {
          description: `Email sent but ${failed} delivery${failed !== 1 ? "s" : ""} failed. Check your inbox.`,
        });
        return;
      }

      toast.success("Alert sent", {
        description: "A low stock summary has been sent to your email address.",
      });
    });
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      className="gap-2"
      aria-label="Send low stock alert email to yourself"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Bell className="h-4 w-4" aria-hidden="true" />
      )}
      {isPending ? "Sending..." : "Send Low Stock Alert"}
    </Button>
  );
}
