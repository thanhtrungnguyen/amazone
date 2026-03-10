import { db, orders, orderItems, products, users } from "@amazone/db";
import { eq } from "drizzle-orm";
import { logger } from "@amazone/shared-utils";
import { getTransport, FROM } from "./email-transport";

/**
 * Email utility — connects to Mailhog in development, configurable SMTP in production.
 *
 * Transport is configured via environment variables (see email-transport.ts):
 * - SMTP_HOST (default: localhost)
 * - SMTP_PORT (default: 1025 for Mailhog)
 * - SMTP_USER (optional)
 * - SMTP_PASS (optional)
 * - EMAIL_FROM (default: noreply@amazone.com)
 */

// ─── Email Templates ─────────────────────────────────────────────

export async function sendOrderConfirmation(params: {
  to: string;
  customerName: string;
  orderId: string;
  totalInCents: number;
  items: { name: string; quantity: number; priceInCents: number }[];
}): Promise<void> {
  const total = (params.totalInCents / 100).toFixed(2);
  const itemRows = params.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">$${(item.priceInCents / 100).toFixed(2)}</td>
        </tr>`
    )
    .join("");

  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: `Order Confirmed — #${params.orderId.slice(0, 8).toUpperCase()}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Thank you for your order!</h1>
        <p>Hi ${params.customerName},</p>
        <p>We've received your order and are getting it ready.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px;text-align:center">Qty</th>
              <th style="padding:8px;text-align:right">Price</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding:8px;font-weight:bold">Total</td>
              <td style="padding:8px;text-align:right;font-weight:bold">$${total}</td>
            </tr>
          </tfoot>
        </table>
        <p style="color:#666;font-size:14px">You can track your order in your <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/profile/orders">order history</a>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
      </div>
    `,
  });
}

export async function sendShippingUpdate(params: {
  to: string;
  customerName: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
}): Promise<void> {
  const trackingHtml = params.trackingNumber
    ? `<p><strong>Tracking Number:</strong> ${params.trackingNumber}</p>`
    : "";

  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: `Order Update — #${params.orderId.slice(0, 8).toUpperCase()} is now ${params.status}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Order Update</h1>
        <p>Hi ${params.customerName},</p>
        <p>Your order <strong>#${params.orderId.slice(0, 8).toUpperCase()}</strong> status has been updated to <strong>${params.status}</strong>.</p>
        ${trackingHtml}
        <p style="color:#666;font-size:14px">View details in your <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/profile/orders/${params.orderId}">order page</a>.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(params: {
  to: string;
  name: string;
}): Promise<void> {
  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: "Welcome to Amazone!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Welcome to Amazone!</h1>
        <p>Hi ${params.name},</p>
        <p>Thanks for creating your account. You're all set to start shopping!</p>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/products"
           style="display:inline-block;padding:12px 24px;background:#111;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0">
          Browse Products
        </a>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
      </div>
    `,
  });
}

// ─── Email Verification ──────────────────────────────────────────

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify-email?token=${encodeURIComponent(params.token)}`;

  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: "Verify your email address — Amazone",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Amazone</h1>
        </div>
        <div style="border:1px solid #e2e8f0;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <h2 style="margin:0 0 16px;font-size:20px;color:#111">Verify your email address</h2>
          <p style="font-size:16px;line-height:1.5">Hi ${params.name},</p>
          <p style="font-size:16px;line-height:1.5">
            Thanks for creating your Amazone account. Please verify your email address
            by clicking the button below.
          </p>
          <div style="text-align:center;margin:32px 0">
            <a href="${verifyUrl}"
               style="display:inline-block;padding:14px 32px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:16px">
              Verify Email
            </a>
          </div>
          <p style="font-size:14px;color:#64748b;line-height:1.5">
            This link will expire in 24 hours. If you did not create an account,
            you can safely ignore this email.
          </p>
          <p style="font-size:14px;color:#64748b;line-height:1.5">
            If the button above does not work, copy and paste this URL into your browser:
          </p>
          <p style="font-size:13px;color:#3b82f6;word-break:break-all">${verifyUrl}</p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0"/>
          <p style="color:#94a3b8;font-size:12px;margin:0">Amazone — Your one-stop shop</p>
        </div>
      </div>
    `,
  });
}

// ─── Order Cancellation ───────────────────────────────────────────

export async function sendOrderCancellationEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  totalInCents: number;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shortOrderId = params.orderId.slice(0, 8).toUpperCase();
  const total = (params.totalInCents / 100).toFixed(2);

  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: `Order Cancelled — #${shortOrderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Your order has been cancelled</h1>
        <p>Hi ${params.customerName},</p>
        <p>Your order <strong>#${shortOrderId}</strong> (total: <strong>$${total}</strong>) has been successfully cancelled.</p>
        <p>If a payment was taken it will be refunded within 5–10 business days depending on your bank.</p>
        <p style="color:#666;font-size:14px">
          Questions? Visit your
          <a href="${siteUrl}/profile/orders">order history</a>
          or contact our support team.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
      </div>
    `,
  });
}

// ─── Return Request ───────────────────────────────────────────────

export async function sendReturnRequestEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  reason: string;
  returnRequestId: string;
}): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shortOrderId = params.orderId.slice(0, 8).toUpperCase();

  await getTransport().sendMail({
    from: FROM,
    to: params.to,
    subject: `Return Request Received — Order #${shortOrderId}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h1 style="color:#111">Return Request Received</h1>
        <p>Hi ${params.customerName},</p>
        <p>We have received your return request for order <strong>#${shortOrderId}</strong>.</p>
        <div style="background:#f9fafb;border-radius:6px;padding:16px;margin:20px 0">
          <p style="margin:0 0 8px"><strong>Return Request ID:</strong> ${params.returnRequestId.slice(0, 8).toUpperCase()}</p>
          <p style="margin:0"><strong>Reason:</strong> ${params.reason}</p>
        </div>
        <p>Our team will review your request and get back to you within 2–3 business days.</p>
        <p style="color:#666;font-size:14px">
          You can track your return status in your
          <a href="${siteUrl}/profile/orders/${params.orderId}">order page</a>.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
        <p style="color:#999;font-size:12px">Amazone — Your one-stop shop</p>
      </div>
    `,
  });
}

// ─── Seller Notification ──────────────────────────────────────────

interface SellerOrderItem {
  productName: string;
  quantity: number;
  priceInCents: number;
}

interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  items: SellerOrderItem[];
  subtotalInCents: number;
}

/**
 * Build the HTML email body for a seller's new-order notification.
 */
function buildSellerOrderEmailHtml(params: {
  sellerName: string;
  orderId: string;
  orderTotalInCents: number;
  sellerSubtotalInCents: number;
  items: SellerOrderItem[];
}): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const shortOrderId = params.orderId.slice(0, 8).toUpperCase();

  const itemRows = params.items
    .map((item) => {
      const lineTotal = (item.priceInCents * item.quantity / 100).toFixed(2);
      return `<tr>
        <td style="padding:10px 8px;border-bottom:1px solid #eee">${item.productName}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">$${(item.priceInCents / 100).toFixed(2)}</td>
        <td style="padding:10px 8px;border-bottom:1px solid #eee;text-align:right">$${lineTotal}</td>
      </tr>`;
    })
    .join("");

  const sellerSubtotal = (params.sellerSubtotalInCents / 100).toFixed(2);

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#333">
      <div style="background:#0f172a;padding:24px;border-radius:8px 8px 0 0">
        <h1 style="color:#fff;margin:0;font-size:22px">New Order Received!</h1>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px">
        <p style="font-size:16px">Hi ${params.sellerName},</p>
        <p>Great news — a customer just placed an order that includes your products.</p>

        <div style="background:#f8fafc;border-radius:6px;padding:16px;margin:20px 0">
          <p style="margin:0 0 4px"><strong>Order ID:</strong> #${shortOrderId}</p>
          <p style="margin:0"><strong>Your items subtotal:</strong> $${sellerSubtotal}</p>
        </div>

        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 8px;text-align:left;font-size:13px;text-transform:uppercase;color:#64748b">Product</th>
              <th style="padding:10px 8px;text-align:center;font-size:13px;text-transform:uppercase;color:#64748b">Qty</th>
              <th style="padding:10px 8px;text-align:right;font-size:13px;text-transform:uppercase;color:#64748b">Unit Price</th>
              <th style="padding:10px 8px;text-align:right;font-size:13px;text-transform:uppercase;color:#64748b">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3" style="padding:10px 8px;font-weight:bold;font-size:15px">Subtotal</td>
              <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:15px">$${sellerSubtotal}</td>
            </tr>
          </tfoot>
        </table>

        <a href="${siteUrl}/dashboard/orders/${params.orderId}"
           style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:6px;margin:16px 0;font-weight:500">
          View Order Details
        </a>

        <p style="color:#94a3b8;font-size:13px;margin-top:24px">
          Please prepare the items for shipment as soon as possible.
          You can manage all your orders from your
          <a href="${siteUrl}/dashboard/orders" style="color:#3b82f6">seller dashboard</a>.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0"/>
        <p style="color:#94a3b8;font-size:12px;margin:0">Amazone Seller Notifications</p>
      </div>
    </div>
  `;
}

/**
 * Send a "New Order" email notification to each seller who has items in the given order.
 *
 * The function:
 * 1. Queries the order with its items and joins each item's product to get the seller
 * 2. Groups items by seller
 * 3. Sends one email per seller containing only their items
 *
 * This is designed to be called after an order is confirmed (e.g., after Stripe payment succeeds).
 * Errors are logged but never thrown, so callers do not need to handle failures.
 */
export async function sendSellerOrderNotification(orderId: string): Promise<void> {
  // Fetch order total
  const [order] = await db
    .select({ totalInCents: orders.totalInCents })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    logger.warn({ orderId }, "sendSellerOrderNotification: order not found");
    return;
  }

  // Fetch order items with product name + seller info
  const rows = await db
    .select({
      productName: products.name,
      quantity: orderItems.quantity,
      priceInCents: orderItems.priceInCents,
      sellerId: products.sellerId,
      sellerName: users.name,
      sellerEmail: users.email,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(users, eq(products.sellerId, users.id))
    .where(eq(orderItems.orderId, orderId));

  if (rows.length === 0) {
    logger.warn({ orderId }, "sendSellerOrderNotification: no items found for order");
    return;
  }

  // Group items by seller
  const sellerMap = new Map<string, SellerGroup>();

  for (const row of rows) {
    let group = sellerMap.get(row.sellerId);
    if (!group) {
      group = {
        sellerId: row.sellerId,
        sellerName: row.sellerName,
        sellerEmail: row.sellerEmail,
        items: [],
        subtotalInCents: 0,
      };
      sellerMap.set(row.sellerId, group);
    }
    const lineTotal = row.priceInCents * row.quantity;
    group.items.push({
      productName: row.productName,
      quantity: row.quantity,
      priceInCents: row.priceInCents,
    });
    group.subtotalInCents += lineTotal;
  }

  // Send one email per seller (in parallel)
  const results = await Promise.allSettled(
    Array.from(sellerMap.values()).map(async (group) => {
      const html = buildSellerOrderEmailHtml({
        sellerName: group.sellerName,
        orderId,
        orderTotalInCents: order.totalInCents,
        sellerSubtotalInCents: group.subtotalInCents,
        items: group.items,
      });

      const shortOrderId = orderId.slice(0, 8).toUpperCase();

      await getTransport().sendMail({
        from: FROM,
        to: group.sellerEmail,
        subject: `New Order #${shortOrderId} — You have ${group.items.length} item${group.items.length > 1 ? "s" : ""} to fulfill`,
        html,
      });

      logger.info(
        { orderId, sellerId: group.sellerId, itemCount: group.items.length },
        "Seller order notification sent"
      );
    })
  );

  // Log any failures without throwing
  for (const result of results) {
    if (result.status === "rejected") {
      logger.error(
        { err: result.reason, orderId },
        "Failed to send seller order notification"
      );
    }
  }
}
