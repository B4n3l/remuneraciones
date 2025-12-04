"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PlusIcon, DocumentTextIcon, EyeIcon } from "@heroicons/react/24/outline";

interface PayrollPeriod {
    id: string;
    companyId: string;
    yearMonth: string;
    status: string;
    totalLiquido: number;
    workersCount: number;
    company: {
        razonSocial: string;
    };
    createdAt: string;
}

export default function LiquidacionesPage() {
    const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchPeriods() {
            try {
                const response = await fetch("/api/payroll/periods");
                if (response.ok) {
                    const data = await response.json();
                    setPeriods(data);
                }
            } catch (err) {
                console.error("Error fetching periods:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchPeriods();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const formatPeriod = (yearMonth: string) => {
        const [year, month] = yearMonth.split("-");
        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            BORRADOR: "bg-yellow-100 text-yellow-800",
            LIQUIDADA: "bg-blue-100 text-blue-800",
            PAGADA: "bg-green-100 text-green-800",
        };
        const labels: Record<string, string> = {
            BORRADOR: "Borrador",
            LIQUIDADA: "Liquidada",
            PAGADA: "Pagada",
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || "bg-gray-100 text-gray-800"}`}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

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

            {periods.length === 0 ? (
                <div className="bg-white shadow rounded-lg p-6">
                    <div className="text-center py-12">
                        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
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
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Período
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Empresa
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Trabajadores
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Total Líquido
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {periods.map((period) => (
                                <tr key={period.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {formatPeriod(period.yearMonth)}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {period.company.razonSocial}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-center text-gray-500">
                                        {period.workersCount}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                        {formatCurrency(period.totalLiquido)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {getStatusBadge(period.status)}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <Link
                                            href={`/dashboard/liquidaciones/${period.id}`}
                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 text-sm"
                                        >
                                            <EyeIcon className="h-4 w-4" />
                                            Ver
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
