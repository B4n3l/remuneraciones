import Link from "next/link";
import { PlusIcon } from "@heroicons/react/24/outline";

export default function LiquidacionesPage() {
    return (
        <div>
            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Liquidaciones</h1>
                <Link
                    href="/dashboard/liquidaciones/nueva"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nueva Liquidación
                </Link>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <div className="text-center py-12">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">
                        No hay períodos de liquidación guardados
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Genera tu primera liquidación de sueldo
                    </p>
                    <Link
                        href="/dashboard/liquidaciones/nueva"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nueva Liquidación
                    </Link>
                </div>
            </div>
        </div>
    );
}
