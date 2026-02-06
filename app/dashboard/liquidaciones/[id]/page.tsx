"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { ArrowLeftIcon, DocumentArrowDownIcon, PencilSquareIcon } from "@heroicons/react/24/outline";

interface PayrollItem {
    id: string;
    worker: {
        id: string;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
        cargo: string;
    };
    totalHaberes: number;
    totalDescuentosLegales: number;
    liquidoPagar: number;
    earnings: Array<{ concepto: string; monto: number }>;
    deductions: Array<{ concepto: string; monto: number }>;
}

interface PeriodData {
    id: string;
    yearMonth: string;
    status: string;
    company: {
        razonSocial: string;
        rut: string;
    };
    payrollItems: PayrollItem[];
}

export default function PeriodDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const [period, setPeriod] = useState<PeriodData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedItem, setSelectedItem] = useState<PayrollItem | null>(null);

    useEffect(() => {
        async function fetchPeriod() {
            try {
                const response = await fetch(`/api/payroll/periods/${resolvedParams.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setPeriod(data);
                } else {
                    setError("Error al cargar el período");
                }
            } catch (err) {
                setError("Error al cargar el período");
            } finally {
                setLoading(false);
            }
        }
        fetchPeriod();
    }, [resolvedParams.id]);

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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    if (error || !period) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error || "Período no encontrado"}
            </div>
        );
    }

    const totalLiquido = period.payrollItems.reduce(
        (sum, item) => sum + Number(item.liquidoPagar),
        0
    );

    return (
        <div className="max-w-7xl">
            <div className="mb-6">
                <Link
                    href="/dashboard/liquidaciones"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Volver a Liquidaciones
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {formatPeriod(period.yearMonth)}
                        </h1>
                        <p className="text-gray-600">{period.company.razonSocial}</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Líquido</p>
                            <p className="text-2xl font-bold text-green-600">
                                {formatCurrency(totalLiquido)}
                            </p>
                        </div>
                        <Link
                            href={`/dashboard/liquidaciones/${resolvedParams.id}/editar`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md"
                        >
                            <PencilSquareIcon className="h-5 w-5" />
                            Editar
                        </Link>
                    </div>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Trabajador
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                RUT
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Total Haberes
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Descuentos
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Líquido
                            </th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {period.payrollItems.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {item.worker.nombres} {item.worker.apellidoPaterno} {item.worker.apellidoMaterno}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {item.worker.rut}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-gray-700">
                                    {formatCurrency(Number(item.totalHaberes))}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-red-600">
                                    -{formatCurrency(Number(item.totalDescuentosLegales))}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                                    {formatCurrency(Number(item.liquidoPagar))}
                                </td>
                                <td className="px-6 py-4 text-center space-x-2">
                                    <button
                                        onClick={() => setSelectedItem(item)}
                                        className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                                    >
                                        Ver Detalle
                                    </button>
                                    <a
                                        href={`/api/payroll/periods/${period.id}/pdf/${item.id}`}
                                        className="inline-flex items-center gap-1 text-green-600 hover:text-green-900 text-sm font-medium"
                                    >
                                        <DocumentArrowDownIcon className="h-4 w-4" />
                                        PDF
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de detalle */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {selectedItem.worker.nombres} {selectedItem.worker.apellidoPaterno}
                                    </h2>
                                    <p className="text-gray-500">{selectedItem.worker.rut} | {selectedItem.worker.cargo}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Haberes */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-800 mb-3">HABERES</h3>
                                    <div className="space-y-2">
                                        {selectedItem.earnings.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.concepto}</span>
                                                <span className="font-medium">{formatCurrency(Number(item.monto))}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-green-200 pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-green-800">
                                                <span>Total Haberes</span>
                                                <span>{formatCurrency(Number(selectedItem.totalHaberes))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Descuentos */}
                                <div className="bg-red-50 rounded-lg p-4">
                                    <h3 className="font-semibold text-red-800 mb-3">DESCUENTOS</h3>
                                    <div className="space-y-2">
                                        {selectedItem.deductions.map((item, idx) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.concepto}</span>
                                                <span className="font-medium">-{formatCurrency(Number(item.monto))}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-red-200 pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-red-800">
                                                <span>Total Descuentos</span>
                                                <span>-{formatCurrency(Number(selectedItem.totalDescuentosLegales))}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-blue-800">LÍQUIDO A PAGAR</span>
                                    <span className="text-2xl font-bold text-blue-800">
                                        {formatCurrency(Number(selectedItem.liquidoPagar))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex gap-4">
                            <a
                                href={`/api/payroll/periods/${period.id}/pdf/${selectedItem.id}`}
                                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md text-center inline-flex items-center justify-center gap-2"
                            >
                                <DocumentArrowDownIcon className="h-5 w-5" />
                                Descargar PDF
                            </a>
                            <button
                                onClick={() => setSelectedItem(null)}
                                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
