import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";
import CompaniesClientList from "./CompaniesClientList";

export default async function EmpresasPage() {
    const session = await auth();

    const companies = await prisma.company.findMany({
        where: session?.user.role === "SUPER_ADMIN"
            ? {}
            : {
                users: {
                    some: {
                        userId: session?.user.id,
                    },
                },
            },
        orderBy: {
            razonSocial: "asc",
        },
    });

    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
                <Link
                    href="/dashboard/empresas/nueva"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Empresa
                </Link>
            </div>

            <CompaniesClientList companies={companies} />
        </div>
    );
}
