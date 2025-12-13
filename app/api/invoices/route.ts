import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const invoiceSchema = z.object({
    companyId: z.string(),
    amount: z.number().positive(),
    dueDate: z.string(), // ISO date string
    period: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM format
    notes: z.string().optional(),
});

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const companyId = searchParams.get("companyId");
        const status = searchParams.get("status");
        const period = searchParams.get("period");

        let where: any = {};

        // Filter by company
        if (companyId) {
            where.companyId = companyId;
        } else if (session.user.role !== "SUPER_ADMIN") {
            // Regular users only see invoices from their companies
            where.company = {
                users: {
                    some: {
                        userId: session.user.id,
                    },
                },
            };
        }

        // Filter by status
        if (status) {
            where.status = status;
        }

        // Filter by period
        if (period) {
            where.period = period;
        }

        // Check for overdue invoices and update status
        const now = new Date();
        await prisma.invoice.updateMany({
            where: {
                status: "PENDING",
                dueDate: {
                    lt: now,
                },
            },
            data: {
                status: "OVERDUE",
            },
        });

        const invoices = await prisma.invoice.findMany({
            where,
            include: {
                company: {
                    select: {
                        id: true,
                        razonSocial: true,
                        rut: true,
                    },
                },
                payments: true,
            },
            orderBy: {
                dueDate: "desc",
            },
        });

        // Calculate paid amount for each invoice
        const invoicesWithPaidAmount = invoices.map((invoice) => ({
            ...invoice,
            paidAmount: invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
            remainingAmount: Number(invoice.amount) - invoice.payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
        }));

        return NextResponse.json(invoicesWithPaidAmount);
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return NextResponse.json({ error: "Error al obtener facturas" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validated = invoiceSchema.parse(body);

        // Check access to company
        if (session.user.role !== "SUPER_ADMIN") {
            const hasAccess = await prisma.userCompany.findFirst({
                where: {
                    userId: session.user.id,
                    companyId: validated.companyId,
                },
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Sin acceso a esta empresa" }, { status: 403 });
            }
        }

        const invoice = await prisma.invoice.create({
            data: {
                companyId: validated.companyId,
                amount: validated.amount,
                dueDate: new Date(validated.dueDate),
                period: validated.period,
                notes: validated.notes,
            },
            include: {
                company: {
                    select: {
                        id: true,
                        razonSocial: true,
                        rut: true,
                    },
                },
            },
        });

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        console.error("Error creating invoice:", error);
        return NextResponse.json({ error: "Error al crear factura" }, { status: 500 });
    }
}
