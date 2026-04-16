import { Resend } from "resend";

let _resend: Resend | null = null;

/** Lazy-initialized Resend client (avoids build-time crash when env var is missing). */
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

const FROM = "Chamillion <hola@chamillion.site>";

/** Send a transactional email via Resend. */
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return getResend().emails.send({ from: FROM, to, subject, html });
}
