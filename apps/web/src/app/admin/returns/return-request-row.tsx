"use client";

import { useTransition, useState } from "react";
import { toast } from "sonner";
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
import { TableCell, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, PackageCheck, Loader2 } from "lucide-react";
import { approveReturn, rejectReturn, completeReturn } from "./actions";

// ---------------------------------------------------------------------------
// Return status badge
// ---------------------------------------------------------------------------

type ReturnStatus = "pending" | "approved" | "rejected" | "completed";

const returnStatusConfig: Record<
  ReturnStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  approved: {
    label: "Approved",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

function ReturnStatusBadge({
  status,
}: {
  status: ReturnStatus;
}): React.ReactElement {
  const cfg = returnStatusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Approve dialog
// ---------------------------------------------------------------------------

function ApproveDialog({
  returnId,
  shortOrderId,
  disabled,
}: {
  returnId: string;
  shortOrderId: string;
  disabled: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleApprove(): void {
    startTransition(async () => {
      const result = await approveReturn(returnId, notes.trim() || undefined);
      if (result.success) {
        toast.success("Return approved");
        setOpen(false);
        setNotes("");
      } else {
        toast.error(result.error ?? "Failed to approve return");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 text-green-700 hover:bg-green-50 hover:text-green-800 border-green-200"
          aria-label={`Approve return for order ${shortOrderId}`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          Approve
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve Return Request</AlertDialogTitle>
          <AlertDialogDescription>
            Approve the return for order{" "}
            <span className="font-medium text-foreground">#{shortOrderId}</span>
            . The customer will be notified and asked to ship the item(s) back.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="approve-notes" className="text-sm font-medium">
            Admin Notes{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="approve-notes"
            placeholder="Any instructions for the customer…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 resize-none"
            rows={3}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleApprove}
            disabled={isPending}
            className="bg-green-700 hover:bg-green-800 focus:ring-green-700"
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Approve Return
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Reject dialog
// ---------------------------------------------------------------------------

function RejectDialog({
  returnId,
  shortOrderId,
  disabled,
}: {
  returnId: string;
  shortOrderId: string;
  disabled: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleReject(): void {
    if (!notes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    startTransition(async () => {
      const result = await rejectReturn(returnId, notes.trim());
      if (result.success) {
        toast.success("Return rejected");
        setOpen(false);
        setNotes("");
      } else {
        toast.error(result.error ?? "Failed to reject return");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 text-red-700 hover:bg-red-50 hover:text-red-800 border-red-200"
          aria-label={`Reject return for order ${shortOrderId}`}
        >
          <XCircle className="h-3.5 w-3.5" />
          Reject
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject Return Request</AlertDialogTitle>
          <AlertDialogDescription>
            Reject the return for order{" "}
            <span className="font-medium text-foreground">#{shortOrderId}</span>
            . The order will revert to &quot;Delivered&quot; status. The
            customer will be notified with your notes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="reject-notes" className="text-sm font-medium">
            Reason for Rejection{" "}
            <span className="text-red-600">*</span>
          </Label>
          <Textarea
            id="reject-notes"
            placeholder="Explain why the return is being rejected…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 resize-none"
            rows={3}
            required
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReject}
            disabled={isPending || !notes.trim()}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Reject Return
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Complete dialog
// ---------------------------------------------------------------------------

function CompleteDialog({
  returnId,
  shortOrderId,
  disabled,
}: {
  returnId: string;
  shortOrderId: string;
  disabled: boolean;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleComplete(): void {
    startTransition(async () => {
      const result = await completeReturn(returnId);
      if (result.success) {
        toast.success("Return completed and refund processed");
        setOpen(false);
      } else {
        toast.error(result.error ?? "Failed to complete return");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-1.5 text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-blue-200"
          aria-label={`Mark return completed for order ${shortOrderId}`}
        >
          <PackageCheck className="h-3.5 w-3.5" />
          Mark Completed
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Complete Return</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm that the items for order{" "}
            <span className="font-medium text-foreground">#{shortOrderId}</span>{" "}
            have been received and the refund has been issued. The order status
            will be set to <span className="font-medium text-foreground">Refunded</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleComplete}
            disabled={isPending}
            className="bg-blue-700 hover:bg-blue-800 focus:ring-blue-700"
          >
            {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            Complete &amp; Refund
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Main row component
// ---------------------------------------------------------------------------

export interface ReturnRequestRowData {
  id: string;
  shortOrderId: string;
  orderId: string;
  customer: string;
  reason: string;
  status: ReturnStatus;
  adminNotes: string | null;
  dateRequested: string;
}

export function ReturnRequestRow({
  row,
}: {
  row: ReturnRequestRowData;
}): React.ReactElement {
  const truncatedReason =
    row.reason.length > 80 ? `${row.reason.slice(0, 80)}…` : row.reason;

  return (
    <TableRow>
      <TableCell className="font-mono text-sm font-medium">
        #{row.shortOrderId}
      </TableCell>
      <TableCell>{row.customer}</TableCell>
      <TableCell
        className="max-w-[240px] text-sm text-muted-foreground"
        title={row.reason}
      >
        {truncatedReason}
      </TableCell>
      <TableCell>
        <ReturnStatusBadge status={row.status} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {row.dateRequested}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {row.status === "pending" && (
            <>
              <ApproveDialog
                returnId={row.id}
                shortOrderId={row.shortOrderId}
                disabled={false}
              />
              <RejectDialog
                returnId={row.id}
                shortOrderId={row.shortOrderId}
                disabled={false}
              />
            </>
          )}
          {row.status === "approved" && (
            <CompleteDialog
              returnId={row.id}
              shortOrderId={row.shortOrderId}
              disabled={false}
            />
          )}
          {(row.status === "rejected" || row.status === "completed") && (
            <span className="text-xs text-muted-foreground italic">
              No actions
            </span>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}
