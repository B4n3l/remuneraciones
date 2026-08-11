import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import LibroClient from "@/components/libro/LibroClient";

export default async function LibroPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const session = await auth();
    if (!session) {
        redirect("/login");
    }

    const params = await searchParams;

    // Fetch accessible companies
    const companies = await prisma.company.findMany({
        where:
            session.user.role === "SUPER_ADMIN"
                ? {}
                : {
                      users: {
                          some: {
                              userId: session.user.id,
                          },
                      },
                  },
        select: {
            id: true,
            razonSocial: true,
            rut: true,
        },
        orderBy: {
            razonSocial: "asc",
        },
    });

    const serializedCompanies = companies.map((c) => ({
        id: c.id,
        razonSocial: c.razonSocial,
        rut: c.rut,
    }));

    const companyIdParam =
        typeof params.companyId === "string" ? params.companyId : undefined;
    const yearParam =
        typeof params.year === "string" ? parseInt(params.year, 10) : undefined;
    const monthParam =
        typeof params.month === "string" ? parseInt(params.month, 10) : undefined;

    let initialData = null;
    let initialError = null;
    let initialParams = null;

    if (
        companyIdParam &&
        yearParam !== undefined &&
        monthParam !== undefined &&
        !isNaN(yearParam) &&
        !isNaN(monthParam) &&
        monthParam >= 1 &&
        monthParam <= 12
    ) {
        initialParams = {
            companyId: companyIdParam,
            year: yearParam,
            month: monthParam,
        };

        // Verify access
        let hasAccess = session.user.role === "SUPER_ADMIN";
        if (!hasAccess) {
            const userCompany = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: companyIdParam,
                },
            });
            hasAccess = !!userCompany;
        }

        if (!hasAccess) {
            initialError = "Sin acceso a esta empresa";
        } else {
            const yearMonth = `${yearParam}-${String(monthParam).padStart(2, "0")}`;

            const period = await prisma.payrollPeriod.findUnique({
                where: {
                    companyId_yearMonth: {
                        companyId: companyIdParam,
                        yearMonth,
                    },
                },
                include: {
                    company: {
                        select: {
                            razonSocial: true,
                            rut: true,
                        },
                    },
                    payrollItems: {
                        include: {
                            worker: true,
                            earnings: true,
                            deductions: true,
                        },
                        orderBy: {
                            worker: {
                                apellidoPaterno: "asc",
                            },
                        },
                    },
                },
            });

            if (!period) {
                // No data for this period — client component will show the "no period" message
            } else {
                const items = period.payrollItems.map((item) => {
                    const sueldoBase = Number(
                        item.earnings.find((e) => e.tipo === "SUELDO_BASE")?.monto ?? 0
                    );
                    const gratificacion = Number(
                        item.earnings.find((e) => e.tipo === "GRATIFICACION")?.monto ?? 0
                    );
                    const horasExtraMonto = Number(
                        item.earnings.find((e) => e.tipo === "HORAS_EXTRA")?.monto ?? 0
                    );
                    const bonos = Number(
                        item.earnings
                            .filter((e) => e.tipo.startsWith("BONO_"))
                            .reduce((sum, e) => sum + Number(e.monto), 0)
                    );
                    const afp = Number(
                        item.deductions.find((d) => d.tipo === "AFP")?.monto ?? 0
                    );
                    const salud = Number(
                        item.deductions.find((d) => d.tipo === "SALUD")?.monto ?? 0
                    );
                    const cesantia = Number(
                        item.deductions.find((d) => d.tipo === "CESANTIA")?.monto ?? 0
                    );
                    const impuesto = Number(
                        item.deductions.find((d) => d.tipo === "IMPUESTO_UNICO")?.monto ?? 0
                    );
                    const totalDescuentos =
                        Number(item.totalDescuentosLegales) +
                        Number(item.totalDescuentosVoluntarios);

                    return {
                        worker: {
                            nombres: item.worker.nombres,
                            apellidoPaterno: item.worker.apellidoPaterno,
                            apellidoMaterno: item.worker.apellidoMaterno,
                            rut: item.worker.rut,
                            cargo: item.worker.cargo,
                        },
                        diasTrabajados: item.diasTrabajados,
                        horasExtra: Number(item.horasExtra),
                        totalHaberes: Number(item.totalHaberes),
                        sueldoBase,
                        gratificacion,
                        horasExtraMonto,
                        bonos,
                        afp,
                        salud,
                        cesantia,
                        impuesto,
                        totalDescuentos,
                        liquidoPagar: Number(item.liquidoPagar),
                    };
                });

                const totals = items.reduce(
                    (acc, item) => ({
                        diasTrabajados: acc.diasTrabajados + item.diasTrabajados,
                        horasExtra: acc.horasExtra + item.horasExtra,
                        totalHaberes: acc.totalHaberes + item.totalHaberes,
                        sueldoBase: acc.sueldoBase + item.sueldoBase,
                        gratificacion: acc.gratificacion + item.gratificacion,
                        horasExtraMonto: acc.horasExtraMonto + item.horasExtraMonto,
                        bonos: acc.bonos + item.bonos,
                        afp: acc.afp + item.afp,
                        salud: acc.salud + item.salud,
                        cesantia: acc.cesantia + item.cesantia,
                        impuesto: acc.impuesto + item.impuesto,
                        totalDescuentos: acc.totalDescuentos + item.totalDescuentos,
                        liquidoPagar: acc.liquidoPagar + item.liquidoPagar,
                    }),
                    {
                        diasTrabajados: 0,
                        horasExtra: 0,
                        totalHaberes: 0,
                        sueldoBase: 0,
                        gratificacion: 0,
                        horasExtraMonto: 0,
                        bonos: 0,
                        afp: 0,
                        salud: 0,
                        cesantia: 0,
                        impuesto: 0,
                        totalDescuentos: 0,
                        liquidoPagar: 0,
                    }
                );

                initialData = {
                    period: {
                        yearMonth: period.yearMonth,
                        fechaInicio: period.fechaInicio.toISOString(),
                        fechaFin: period.fechaFin.toISOString(),
                        status: period.status,
                    },
                    company: {
                        razonSocial: period.company.razonSocial,
                        rut: period.company.rut,
                    },
                    items,
                    totals,
                };
            }
        }
    }

    return (
        <LibroClient
            companies={serializedCompanies}
            initialData={initialData}
            initialError={initialError}
            initialParams={initialParams}
        />
    );
}
