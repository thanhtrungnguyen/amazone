import { createTransport, type Transporter } from "nodemailer";

/**
 * Email transport — connects to Mailhog in development, configurable SMTP in production.
 *
 * Environment variables:
 * - SMTP_HOST (default: localhost)
 * - SMTP_PORT (default: 1025 for Mailhog)
 * - SMTP_USER (optional)
 * - SMTP_PASS (optional)
 * - EMAIL_FROM (default: noreply@amazone.com)
 */

let _transport: Transporter | undefined;

function getTransport(): Transporter {
  if (!_transport) {
    _transport = createTransport({
      host: process.env.SMTP_HOST ?? "localhost",
      port: parseInt(process.env.SMTP_PORT ?? "1025", 10),
      secure: false,
      ...(process.env.SMTP_USER && {
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
    });
  }
  return _transport;
}

const FROM = process.env.EMAIL_FROM ?? "Amazone <noreply@amazone.com>";

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
