import { PayrollStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Finalized-period guard for indicator sync.
 *
 * Aborts if any `PayrollPeriod` for the target `yearMonth` is `LIQUIDADA` or
 * `PAGADA` (finalized). `BORRADOR` periods (or no period at all) allow the
 * delete+create overwrite — current behavior.
 *
 * Throws an Error on a finalized period; the caller surfaces the message as a
 * structured `{ success: false, error }` result.
 */
export async function checkPeriodoFinalizado(
  year: number,
  month: number,
): Promise<void> {
  const yearMonth = `${year}-${String(month).padStart(2, "0")}`;

  const finalized = await prisma.payrollPeriod.findMany({
    where: {
      yearMonth,
      status: { in: [PayrollStatus.LIQUIDADA, PayrollStatus.PAGADA] },
    },
    select: { id: true },
  });

  if (finalized.length > 0) {
    throw new Error(
      `No se pueden sincronizar indicadores para ${yearMonth}: existe un período de remuneraciones LIQUIDADA o PAGADA.`,
    );
  }
}
