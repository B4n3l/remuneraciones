import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import WorkersClientList from "./WorkersClientList";

export default async function TrabajadoresPage() {
    const session = await auth();

    // Check if user has any companies
    const companyCount = await prisma.company.count({
        where: session?.user.role === "SUPER_ADMIN"
            ? {}
            : {
                users: {
                    some: {
                        userId: session?.user.id,
                    },
                },
            },
    });

    // Get all workers from user's companies
    const workers = await prisma.worker.findMany({
        where: {
            isActive: true,
            ...(session?.user.role === "SUPER_ADMIN"
                ? {}
                : {
                    company: {
                        users: {
                            some: {
                                userId: session?.user.id,
                            },
                        },
                    },
                }),
        },
        include: {
            company: {
                select: {
                    razonSocial: true,
                },
            },
        },
        orderBy: {
            apellidoPaterno: "asc",
        },
    });

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Trabajadores</h1>
                {companyCount > 0 && (
                    <Link
                        href="/dashboard/trabajadores/nuevo"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nuevo Trabajador
                    </Link>
                )}
            </div>

            <WorkersClientList workers={workers} companyCount={companyCount} />
        </div>
    );
}
