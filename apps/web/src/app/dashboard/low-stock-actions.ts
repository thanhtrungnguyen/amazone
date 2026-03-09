"use server";

import { sendLowStockAlertEmails } from "@amazone/products";
import { getTransport, FROM } from "@/lib/email-transport";
import { logger } from "@amazone/shared-utils";

/**
 * Server action: send a low-stock alert email for one seller.
 *
 * Injects the nodemailer transport from apps/web into the domain-level
 * `sendLowStockAlertEmails` function, keeping @amazone/products free of any
 * dependency on apps/web's email infrastructure.
 *
 * Called only from `SendLowStockButton` (client component).
 */
export async function triggerLowStockAlertEmail(
  sellerId: string
): Promise<
  | { success: true; data: { sent: number; failed: number } }
  | { success: false; error: string }
> {
  if (!sellerId || typeof sellerId !== "string") {
    return { success: false, error: "errors.low_stock.invalid_seller" };
  }

  const sendEmail = async (params: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> => {
    await getTransport().sendMail({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
  };

  const result = await sendLowStockAlertEmails({
    sendEmail,
    sellerIdFilter: sellerId,
  });

  if (!result.success) {
    logger.error(
      { sellerId, error: result.error },
      "triggerLowStockAlertEmail: action failed"
    );
  }

  return result;
}
