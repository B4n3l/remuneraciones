import { auth } from "@/auth";
import Link from "next/link";

export default async function DashboardPage() {
    const session = await auth();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    Bienvenido, {session?.user.name}
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                    Sistema de Liquidación de Remuneraciones
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8">
                <Link href="/dashboard/empresas">
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-gray-900">Empresas</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Gestiona tus empresas
                            </p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/trabajadores">
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-gray-900">Trabajadores</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Administra empleados
                            </p>
                        </div>
                    </div>
                </Link>

                <Link href="/dashboard/liquidaciones">
                    <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                        <div className="p-5">
                            <h3 className="text-lg font-medium text-gray-900">Liquidaciones</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Genera liquidaciones
                            </p>
                        </div>
                    </div>
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                    Inicio Rápido
                </h2>
                <div className="space-y-3">
                    <Link
                        href="/dashboard/empresas/nueva"
                        className="block p-4 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="text-sm font-medium text-gray-900">
                            1. Registra una empresa
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Comienza agregando tu primera empresa
                        </p>
                    </Link>
                    <div className="block p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900">
                            2. Agrega trabajadores
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Registra los datos de tus trabajadores
                        </p>
                    </div>
                    <div className="block p-4 border border-gray-200 rounded-md bg-gray-50">
                        <h3 className="text-sm font-medium text-gray-900">
                            3. Crea liquidaciones
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Genera liquidaciones de sueldo
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
