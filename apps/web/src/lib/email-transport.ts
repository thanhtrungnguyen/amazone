/**
 * Shared nodemailer transport factory used by all email modules in apps/web.
 *
 * Extracted so both email.ts and the low-stock action can share the same
 * configured transporter without duplicating the initialisation logic.
 */
import { createTransport, type Transporter } from "nodemailer";

let _transport: Transporter | undefined;

export function getTransport(): Transporter {
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

export const FROM =
  process.env.EMAIL_FROM ?? "Amazone <noreply@amazone.com>";
