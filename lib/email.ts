import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@centrocontable.cl";

export async function sendAlertEmail(to: string, subject: string, body: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY no configurada. No se envió email.");
    return;
  }

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      text: body,
    });
  } catch (error) {
    console.error("Error enviando email con Resend:", error);
  }
}
