"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function WorkersClientList({ workers, companyCount }: { workers: any[]; companyCount: number }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string, fullName: string) => {
        if (!confirm(`¿Estás seguro de eliminar al trabajador "${fullName}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        setDeleting(id);

        try {
            const response = await fetch(`/api/workers/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error al eliminar el trabajador");
                return;
            }

            router.refresh();
        } catch (error) {
            alert("Error al eliminar el trabajador");
        } finally {
            setDeleting(null);
        }
    };

    if (companyCount === 0) {
        return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <h3 className="text-sm font-medium text-yellow-800 mb-2">
                            No puedes crear trabajadores aún
                        </h3>
                        <p className="text-sm text-yellow-700 mb-4">
                            Primero debes crear al menos una empresa.
                        </p>
                        <Link
                            href="/dashboard/empresas/nueva"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md text-sm"
                        >
                            <PlusIcon className="h-4 w-4" />
                            Crear Primera Empresa
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (workers.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <h3 className="text-sm font-medium text-gray-900">
                    No hay trabajadores
                </h3>
                <p className="mt-1 text-sm text-gray-500 mb-6">
                    Comienza agregando tu primer trabajador
                </p>
                <Link
                    href="/dashboard/trabajadores/nuevo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Trabajador
                </Link>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Nombre
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            RUT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Empresa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Cargo
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {workers.map((worker: any) => (
                        <tr key={worker.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {worker.nombres} {worker.apellidoPaterno}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {worker.rut}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {worker.company.razonSocial}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {worker.cargo}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-3">
                                    <Link
                                        href={`/dashboard/trabajadores/${worker.id}/editar`}
                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(worker.id, `${worker.nombres} ${worker.apellidoPaterno}`)}
                                        disabled={deleting === worker.id}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        {deleting === worker.id ? "Eliminando..." : "Eliminar"}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
