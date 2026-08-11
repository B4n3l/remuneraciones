import { z } from "zod";
import { prisma } from "@/lib/db";
import { indicadorSchema } from "@/app/api/admin/indicadores/route";
import { sendAlertEmail } from "@/lib/email";

const externalIndicadorSchema = indicadorSchema.extend({
  impuestoTramos: z
    .array(
      z.object({
        desde: z.coerce.number(),
        hasta: z.coerce.number().nullable(),
        factor: z.coerce.number(),
        cantidadRebajar: z.coerce.number(),
      })
    )
    .optional(),
});

const INDICADORES_API_URL = process.env.INDICADORES_API_URL;
const INDICADORES_API_KEY = process.env.INDICADORES_API_KEY;

export async function syncIndicadoresFromAPI(year: number, month: number) {
  if (!INDICADORES_API_URL || !INDICADORES_API_KEY) {
    return {
      success: false,
      error: "Faltan variables de entorno INDICADORES_API_URL o INDICADORES_API_KEY",
    };
  }

  let responseData: unknown;
  try {
    const url = new URL(INDICADORES_API_URL);
    url.searchParams.set("year", String(year));
    url.searchParams.set("month", String(month));

    const res = await fetch(url.toString(), {
      headers: {
        "X-API-Key": INDICADORES_API_KEY,
      },
    });

    if (!res.ok) {
      throw new Error(`API respondió ${res.status}: ${res.statusText}`);
    }

    responseData = await res.json();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await notifySyncFailure(year, month, errorMessage);
    return {
      success: false,
      error: `Error al consultar API externa: ${errorMessage}`,
    };
  }

  let validatedData: z.infer<typeof externalIndicadorSchema>;
  try {
    validatedData = externalIndicadorSchema.parse(responseData);
  } catch (err) {
    const errorMessage = err instanceof z.ZodError ? err.message : String(err);
    await notifySyncFailure(year, month, errorMessage);
    return {
      success: false,
      error: `Datos de API inválidos: ${errorMessage}`,
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const existing = await tx.indicadorMensual.findUnique({
        where: { year_month: { year, month } },
      });

      if (existing) {
        await tx.indicadorMensual.delete({ where: { id: existing.id } });
      }

      await tx.indicadorMensual.create({
        data: {
          year: validatedData.year,
          month: validatedData.month,
          valorUF: validatedData.valorUF,
          valorUTM: validatedData.valorUTM,
          valorUTA: validatedData.valorUTA,
          sueldoMinimo: validatedData.sueldoMinimo,
          sueldoMinimoCasaPart: validatedData.sueldoMinimoCasaPart,
          sueldoMinimoMenores: validatedData.sueldoMinimoMenores,
          sueldoMinimoNoRem: validatedData.sueldoMinimoNoRem,
          topeImponibleAFP: validatedData.topeImponibleAFP,
          topeImponibleINP: validatedData.topeImponibleINP,
          topeSeguroCesantia: validatedData.topeSeguroCesantia,
          sisRate: validatedData.sisRate,
          seguroSocialRate: validatedData.seguroSocialRate,
          apvTopeMensualUF: validatedData.apvTopeMensualUF,
          apvTopeAnualUF: validatedData.apvTopeAnualUF,
          afpRates: validatedData.afpRates
            ? { create: validatedData.afpRates }
            : undefined,
          cesantiaRates: validatedData.cesantiaRates
            ? { create: validatedData.cesantiaRates }
            : undefined,
          asignacionFamiliar: validatedData.asignacionFamiliar
            ? { create: validatedData.asignacionFamiliar }
            : undefined,
          impuestoTramos: validatedData.impuestoTramos
            ? {
                create: validatedData.impuestoTramos.map((t) => ({
                  desde: t.desde,
                  hasta: t.hasta,
                  factor: t.factor,
                  cantidadRebajar: t.cantidadRebajar,
                })),
              }
            : undefined,
        },
      });
    });

    // If sueldoMinimo changed, update all workers flagged for auto minimum wage.
    try {
      if (validatedData.sueldoMinimo > 0) {
        const updateCount = await prisma.worker.updateMany({
          where: { sueldoMinimoAuto: true },
          data: { sueldoBase: validatedData.sueldoMinimo },
        });
        if (updateCount.count > 0) {
          console.log(`[sync] Updated ${updateCount.count} workers to new minimum wage ${validatedData.sueldoMinimo}`);
        }
      }
    } catch (updateErr) {
      console.error("[sync] Failed to update workers with sueldoMinimoAuto:", updateErr);
      // Non-blocking: don't fail the sync if worker updates fail.
    }

    return {
      success: true,
      message: `Indicadores para ${month}/${year} sincronizados correctamente.`,
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await notifySyncFailure(year, month, errorMessage);
    return {
      success: false,
      error: `Error al guardar en base de datos: ${errorMessage}`,
    };
  }
}

export async function syncIndicadoresForPeriod(yearMonth: string) {
  const [yearStr, monthStr] = yearMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return { success: false, error: `Formato inválido: ${yearMonth}` };
  }
  return syncIndicadoresFromAPI(year, month);
}

async function notifySyncFailure(year: number, month: number, error: string) {
  try {
    let to = process.env.ALERT_EMAIL;
    if (!to) {
      const admin = await prisma.user.findFirst({
        where: { role: "SUPER_ADMIN" },
        orderBy: { createdAt: "asc" },
      });
      to = admin?.email;
    }
    if (!to) return;

    const subject = `Falló sincronización de indicadores previsionales — ${month}/${year}`;
    const body =
      `Falló la sincronización de indicadores previsionales desde la API externa. Año/Mes: ${year}/${month}. Error: ${error}. Por favor revise la API o actualice manualmente en Administración > Indicadores.`;

    await sendAlertEmail(to, subject, body);
  } catch (emailErr) {
    console.error("Error enviando alerta por email:", emailErr);
  }
}
