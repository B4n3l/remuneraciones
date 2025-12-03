import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const afps = await prisma.aFP.findMany({
            where: { isActive: true },
            orderBy: { nombre: "asc" },
        });

        return NextResponse.json(afps);
    } catch (error) {
        console.error("Error fetching AFPs:", error);
        return NextResponse.json(
            { error: "Error al obtener AFPs" },
            { status: 500 }
        );
    }
}
