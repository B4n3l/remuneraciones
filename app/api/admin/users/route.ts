import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(6),
    role: z.enum(["SUPER_ADMIN", "CONTADOR", "CLIENTE"]),
    companyId: z.string().optional(), // Para asociar cliente a empresa
});

// GET /api/admin/users - Listar usuarios
export async function GET() {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                companies: {
                    include: {
                        company: {
                            select: { id: true, razonSocial: true, rut: true },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json({ error: "Error al obtener usuarios" }, { status: 500 });
    }
}

// POST /api/admin/users - Crear usuario
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || session.user.role !== "SUPER_ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = createUserSchema.parse(body);

        // Verificar email único
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                password: hashedPassword,
                role: validatedData.role as "SUPER_ADMIN" | "CONTADOR" | "CLIENTE",
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
            },
        });

        // Si es CLIENTE y tiene companyId, asociar
        if (validatedData.role === "CLIENTE" && validatedData.companyId) {
            await prisma.userCompany.create({
                data: {
                    userId: user.id,
                    companyId: validatedData.companyId,
                },
            });
        }

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Datos inválidos", details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al crear usuario" }, { status: 500 });
    }
}
