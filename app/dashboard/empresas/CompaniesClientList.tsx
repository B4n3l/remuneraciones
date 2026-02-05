"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusIcon, PencilIcon, TrashIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function CompaniesClientList({ companies }: { companies: any[] }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string, razonSocial: string) => {
        if (!confirm(`¿Estás seguro de eliminar la empresa "${razonSocial}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }

        setDeleting(id);

        try {
            const response = await fetch(`/api/companies/${id}`, {
                method: "DELETE",
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.error || "Error al eliminar la empresa");
                return;
            }

            router.refresh();
        } catch (error) {
            alert("Error al eliminar la empresa");
        } finally {
            setDeleting(null);
        }
    };

    if (companies.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg shadow">
                <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No hay empresas registradas
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    Comienza agregando tu primera empresa.
                </p>
                <div className="mt-6">
                    <Link
                        href="/dashboard/empresas/nueva"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Nueva Empresa
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Razón Social
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            RUT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Comuna
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {companies.map((company: any) => (
                        <tr key={company.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {company.razonSocial}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {company.rut}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {company.comuna}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-3">
                                    <Link
                                        href={`/dashboard/empresas/${company.id}/documentos`}
                                        className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                                    >
                                        <DocumentTextIcon className="h-4 w-4" />
                                        Docs
                                    </Link>
                                    <Link
                                        href={`/dashboard/empresas/${company.id}/editar`}
                                        className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                        Editar
                                    </Link>
                                    <button
                                        onClick={() => handleDelete(company.id, company.razonSocial)}
                                        disabled={deleting === company.id}
                                        className="text-red-600 hover:text-red-900 inline-flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                        {deleting === company.id ? "..." : "Eliminar"}
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

function BuildingOfficeIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
        </svg>
    );
}
