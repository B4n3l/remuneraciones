"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DocumentTextIcon, PlusIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

interface Contract {
    id: string;
    type: string;
    cargo: string;
    startDate: string;
    endDate: string | null;
    createdAt: string;
    company: {
        razonSocial: string;
    };
    worker: {
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
    };
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await fetch("/api/contracts");
            if (response.ok) {
                const data = await response.json();
                setContracts(data);
            }
        } catch (error) {
            console.error("Error fetching contracts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPDF = async (contractId: string) => {
        try {
            const response = await fetch(`/api/contracts/${contractId}?format=pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `contrato_${contractId}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error("Error downloading PDF:", error);
        }
    };

    const getContractTypeLabel = (type: string) => {
        switch (type) {
            case "INDEFINIDO":
                return "Indefinido";
            case "PLAZO_FIJO":
                return "Plazo Fijo";
            case "OBRA_FAENA":
                return "Obra/Faena";
            default:
                return type;
        }
    };

    const filteredContracts = contracts.filter((contract) => {
        const searchTerm = filter.toLowerCase();
        return (
            contract.worker.nombres.toLowerCase().includes(searchTerm) ||
            contract.worker.apellidoPaterno.toLowerCase().includes(searchTerm) ||
            contract.worker.apellidoMaterno.toLowerCase().includes(searchTerm) ||
            contract.company.razonSocial.toLowerCase().includes(searchTerm) ||
            contract.cargo.toLowerCase().includes(searchTerm)
        );
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Cargando contratos...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Contratos de Trabajo</h1>
                    <p className="text-gray-600 mt-1">Gestiona los contratos de tus trabajadores</p>
                </div>
                <Link
                    href="/dashboard/contratos/nuevo"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                    <PlusIcon className="h-5 w-5" />
                    Nuevo Contrato
                </Link>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow p-4">
                <input
                    type="text"
                    placeholder="Buscar por trabajador, empresa o cargo..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Contracts List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredContracts.length === 0 ? (
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">No hay contratos</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            Comienza creando un nuevo contrato de trabajo.
                        </p>
                        <div className="mt-6">
                            <Link
                                href="/dashboard/contratos/nuevo"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                            >
                                <PlusIcon className="h-5 w-5" />
                                Nuevo Contrato
                            </Link>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Trabajador
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Empresa
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Tipo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Cargo
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Inicio
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredContracts.map((contract) => (
                                <tr key={contract.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {contract.worker.nombres} {contract.worker.apellidoPaterno}
                                        </div>
                                        <div className="text-sm text-gray-500">{contract.worker.rut}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {contract.company.razonSocial}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {getContractTypeLabel(contract.type)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {contract.cargo}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(contract.startDate).toLocaleDateString("es-CL")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDownloadPDF(contract.id)}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900"
                                        >
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                            Descargar PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
