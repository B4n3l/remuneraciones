import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@centrocontable.cl";

let resend: Resend | null = null;

export async function sendAlertEmail(to: string, subject: string, body: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY no configurada. No se envió email.");
    return;
  }

  // Lazy init: construir Resend solo al momento de enviar evita que el build
  // falle si la variable de entorno no está configurada (new Resend() tira error).
  resend ??= new Resend(process.env.RESEND_API_KEY);

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
