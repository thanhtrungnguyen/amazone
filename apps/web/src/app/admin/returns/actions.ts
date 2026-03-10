"use server";

import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logger } from "@amazone/shared-utils";

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    return { ok: false, error: "Unauthorized" };
  }
  return { ok: true };
}

interface ReturnRequestRow {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  adminNotes: string | null;
}

interface CustomerRow {
  name: string;
  email: string;
}

async function getReturnWithCustomer(returnId: string): Promise<{
  returnRequest: ReturnRequestRow;
  customer: CustomerRow;
} | null> {
  const { db, returnRequests, users } = await import("@amazone/db");
  const { eq } = await import("drizzle-orm");

  const rows = await db
    .select({
      id: returnRequests.id,
      orderId: returnRequests.orderId,
      userId: returnRequests.userId,
      reason: returnRequests.reason,
      status: returnRequests.status,
      adminNotes: returnRequests.adminNotes,
      customerName: users.name,
      customerEmail: users.email,
    })
    .from(returnRequests)
    .innerJoin(users, eq(returnRequests.userId, users.id))
    .where(eq(returnRequests.id, returnId))
    .limit(1);

  if (rows.length === 0) return null;

  const row = rows[0];
  return {
    returnRequest: {
      id: row.id,
      orderId: row.orderId,
      userId: row.userId,
      reason: row.reason,
      status: row.status,
      adminNotes: row.adminNotes,
    },
    customer: {
      name: row.customerName,
      email: row.customerEmail,
    },
  };
}

// ---------------------------------------------------------------------------
// approveReturn
// ---------------------------------------------------------------------------

export async function approveReturn(
  returnId: string,
  adminNotes?: string
): Promise<ActionResult> {
  const auth_ = await requireAdmin();
  if (!auth_.ok) return { success: false, error: auth_.error };

  try {
    const { db, returnRequests } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    const data = await getReturnWithCustomer(returnId);
    if (!data) return { success: false, error: "Return request not found" };

    if (data.returnRequest.status !== "pending") {
      return { success: false, error: "Only pending returns can be approved" };
    }

    const now = new Date();

    // Keep order in return_requested state; it moves to refunded on completion.
    // No order status change at approval — the item is still in transit back.
    await db
      .update(returnRequests)
      .set({
        status: "approved",
        adminNotes: adminNotes ?? null,
        updatedAt: now,
      })
      .where(eq(returnRequests.id, returnId));

    // Send notification — fire and forget, never block the action
    void sendReturnStatusEmail({
      to: data.customer.email,
      customerName: data.customer.name,
      orderId: data.returnRequest.orderId,
      returnId,
      newStatus: "approved",
      adminNotes,
    });

    revalidatePath("/admin/returns");
    return { success: true };
  } catch (err) {
    logger.error({ err, returnId }, "approveReturn failed");
    return { success: false, error: "Failed to approve return request" };
  }
}

// ---------------------------------------------------------------------------
// rejectReturn
// ---------------------------------------------------------------------------

export async function rejectReturn(
  returnId: string,
  adminNotes: string
): Promise<ActionResult> {
  const auth_ = await requireAdmin();
  if (!auth_.ok) return { success: false, error: auth_.error };

  if (!adminNotes.trim()) {
    return { success: false, error: "Admin notes are required when rejecting" };
  }

  try {
    const { db, returnRequests, orders } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    const data = await getReturnWithCustomer(returnId);
    if (!data) return { success: false, error: "Return request not found" };

    if (data.returnRequest.status !== "pending") {
      return { success: false, error: "Only pending returns can be rejected" };
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(returnRequests)
        .set({
          status: "rejected",
          adminNotes: adminNotes.trim(),
          updatedAt: now,
        })
        .where(eq(returnRequests.id, returnId));

      // Revert order to delivered — the return was denied, item stays with customer
      await tx
        .update(orders)
        .set({ status: "delivered", updatedAt: now })
        .where(eq(orders.id, data.returnRequest.orderId));
    });

    void sendReturnStatusEmail({
      to: data.customer.email,
      customerName: data.customer.name,
      orderId: data.returnRequest.orderId,
      returnId,
      newStatus: "rejected",
      adminNotes,
    });

    revalidatePath("/admin/returns");
    return { success: true };
  } catch (err) {
    logger.error({ err, returnId }, "rejectReturn failed");
    return { success: false, error: "Failed to reject return request" };
  }
}

// ---------------------------------------------------------------------------
// completeReturn
// ---------------------------------------------------------------------------

export async function completeReturn(returnId: string): Promise<ActionResult> {
  const auth_ = await requireAdmin();
  if (!auth_.ok) return { success: false, error: auth_.error };

  try {
    const { db, returnRequests, orders } = await import("@amazone/db");
    const { eq } = await import("drizzle-orm");

    const data = await getReturnWithCustomer(returnId);
    if (!data) return { success: false, error: "Return request not found" };

    if (data.returnRequest.status !== "approved") {
      return {
        success: false,
        error: "Only approved returns can be marked as completed",
      };
    }

    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(returnRequests)
        .set({ status: "completed", updatedAt: now })
        .where(eq(returnRequests.id, returnId));

      // Order is now fully refunded
      await tx
        .update(orders)
        .set({ status: "refunded", updatedAt: now })
        .where(eq(orders.id, data.returnRequest.orderId));
    });

    void sendReturnStatusEmail({
      to: data.customer.email,
      customerName: data.customer.name,
      orderId: data.returnRequest.orderId,
      returnId,
      newStatus: "completed",
    });

    revalidatePath("/admin/returns");
    return { success: true };
  } catch (err) {
    logger.error({ err, returnId }, "completeReturn failed");
    return { success: false, error: "Failed to complete return request" };
  }
}

// ---------------------------------------------------------------------------
// Email helper — internal, not exported
// ---------------------------------------------------------------------------

interface ReturnStatusEmailParams {
  to: string;
  customerName: string;
  orderId: string;
  returnId: string;
  newStatus: "approved" | "rejected" | "completed";
  adminNotes?: string;
}

async function sendReturnStatusEmail(
  params: ReturnStatusEmailParams
): Promise<void> {
  try {
    const { getTransport, FROM } = await import("@/lib/email-transport");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const shortOrderId = params.orderId.slice(0, 8).toUpperCase();
    const shortReturnId = params.returnId.slice(0, 8).toUpperCase();

    const statusMessages: Record<
      ReturnStatusEmailParams["newStatus"],
      { subject: string; heading: string; body: string }
    > = {
      approved: {
        subject: `Return Approved — Order #${shortOrderId}`,
        heading: "Your Return Has Been Approved",
        body: `Great news! We have approved your return request for order <strong>#${shortOrderId}</strong>. Please ship the item(s) back to us. Once we receive and inspect them, we will process your refund within 5–10 business days.`,
      },
      rejected: {
        subject: `Return Request Rejected — Order #${shortOrderId}`,
        heading: "Return Request Not Approved",
        body: `Unfortunately, we were unable to approve your return request for order <strong>#${shortOrderId}</strong>.`,
      },
      completed: {
        subject: `Return Completed — Order #${shortOrderId}`,
        heading: "Return Completed — Refund Processed",
        body: `Your return for order <strong>#${shortOrderId}</strong> has been completed and your refund has been processed. Funds typically appear within 5–10 business days depending on your bank.`,
      },
    };

    const msg = statusMessages[params.newStatus];

    const notesHtml =
      params.adminNotes
        ? `<div style="background:#f9fafb;border-left:4px solid #e5e7eb;border-radius:4px;padding:12px 16px;margin:16px 0">
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:.05em">Admin Notes</p>
            <p style="margin:0">${params.adminNotes}</p>
           </div>`
        : "";

    await getTransport().sendMail({
      from: FROM,
      to: params.to,
      subject: msg.subject,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
          <h1 style="color:#111">${msg.heading}</h1>
          <p>Hi ${params.customerName},</p>
          <p>${msg.body}</p>
          ${notesHtml}
          <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:20px 0">
            <p style="margin:0 0 4px"><strong>Return Request ID:</strong> #${shortReturnId}</p>
            <p style="margin:0"><strong>Order ID:</strong> #${shortOrderId}</p>
          </div>
          <p style="color:#666;font-size:14px">
            You can view your order details at your
            <a href="${siteUrl}/profile/orders/${params.orderId}">order page</a>.
          </p>
          <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
        </div>
      `,
    });
  } catch (err) {
    logger.error({ err, returnId: params.returnId }, "sendReturnStatusEmail failed");
  }
}
