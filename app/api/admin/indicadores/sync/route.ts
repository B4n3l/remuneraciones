import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncIndicadoresFromAPI } from "@/lib/indicadores/sync";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Solo administradores pueden sincronizar" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { year, month } = body;

    if (typeof year !== "number" || typeof month !== "number") {
      return NextResponse.json(
        { error: "year y month son requeridos" },
        { status: 400 }
      );
    }

    const result = await syncIndicadoresFromAPI(year, month);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Error in sync route:", error);
    return NextResponse.json(
      { error: "Error al sincronizar indicadores" },
      { status: 500 }
    );
  }
}
