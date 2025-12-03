import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { BuildingOfficeIcon, UsersIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

export default async function DashboardPage() {
    const session = await auth();

    // Get user's companies count
    const companiesCount = await prisma.company.count({
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

    // Get total workers count (from user's companies)
    const workersCount = await prisma.worker.count({
        where: session?.user.role === "SUPER_ADMIN"
            ? {}
            : {
                company: {
                    users: {
                        some: {
                            userId: session?.user.id,
                        },
                    },
                },
            },
    });

    // Get active payroll periods count
    const payrollPeriodsCount = await prisma.payrollPeriod.count({
        where: {
            status: {
                in: ["BORRADOR", "LIQUIDADA"],
            },
            ...(session?.user.role !== "SUPER_ADMIN" && {
                company: {
                    users: {
                        some: {
                            userId: session?.user.id,
                        },
                    },
                },
            }),
        },
    });

    const stats = [
        {
            name: "Empresas",
            value: companiesCount,
            icon: BuildingOfficeIcon,
            href: "/dashboard/empresas",
            color: "bg-blue-500",
        },
        {
            name: "Trabajadores",
            value: workersCount,
            icon: UsersIcon,
            href: "/dashboard/trabajadores",
            color: "bg-green-500",
        },
        {
            name: "Liquidaciones Activas",
            value: payrollPeriodsCount,
            icon: DocumentTextIcon,
            href: "/dashboard/liquidaciones",
            color: "bg-purple-500",
        },
    ];

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenido, {session?.user.name}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Resumen de tu cuenta de remuneraciones
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <Link key={stat.name} href={stat.href}>
                        <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                                        <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">
                                                {stat.name}
                                            </dt>
                                            <dd className="text-3xl font-semibold text-gray-900">
                                                {stat.value}
                                            </dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-8 bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Inicio Rápido
                </h2>
                <div className="space-y-3">
                    <Link
                        href="/dashboard/empresas"
                        className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-sm font-medium text-gray-900">
                            1. Registra una empresa
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Comienza agregando tu primera empresa con RUT y datos legales
                        </p>
                    </Link>
                    <Link
                        href="/dashboard/trabajadores"
                        className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-sm font-medium text-gray-900">
                            2. Agrega trabajadores
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Registra los datos de tus trabajadores con sus contratos y salarios
                        </p>
                    </Link>
                    <Link
                        href="/dashboard/liquidaciones"
                        className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-sm font-medium text-gray-900">
                            3. Crea liquidaciones
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Genera liquidaciones de sueldo con cálculos automáticos
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
