import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const companySchema = z.object({
    rut: z.string().min(1, "El RUT es requerido"),
    razonSocial: z.string().min(1, "La razón social es requerida"),
    direccion: z.string().min(1, "La dirección es requerida"),
    comuna: z.string().min(1, "La comuna es requerida"),
});

// GET all companies
export async function GET() {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const companies = await prisma.company.findMany({
            where: session.user.role === "SUPER_ADMIN"
                ? {}
                : {
                    users: {
                        some: {
                            userId: session.user.id,
                        },
                    },
                },
            include: {
                _count: {
                    select: {
                        workers: true,
                    },
                },
            },
            orderBy: {
                razonSocial: "asc",
            },
        });

        return NextResponse.json(companies);
    } catch (error) {
        console.error("Error fetching companies:", error);
        return NextResponse.json(
            { error: "Error al obtener empresas" },
            { status: 500 }
        );
    }
}

// POST create new company
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = companySchema.parse(body);

        // Check if RUT already exists
        const existingCompany = await prisma.company.findUnique({
            where: { rut: validatedData.rut },
        });

        if (existingCompany) {
            return NextResponse.json(
                { error: "El RUT ya está registrado" },
                { status: 400 }
            );
        }

        // Create company and associate with current user
        const company = await prisma.company.create({
            data: {
                ...validatedData,
                users: {
                    create: {
                        userId: session.user.id,
                    },
                },
            },
        });

        return NextResponse.json(company, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0].message },
                { status: 400 }
            );
        }

        console.error("Error creating company:", error);
        return NextResponse.json(
            { error: "Error al crear la empresa" },
            { status: 500 }
        );
    }
}
