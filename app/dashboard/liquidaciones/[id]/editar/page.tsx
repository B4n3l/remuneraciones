"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

interface PayrollItem {
    id: string;
    worker: {
        id: string;
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
        cargo: string;
        sueldoBase: number;
    };
    diasTrabajados: number;
    horasExtra: number;
    valorHoraExtra: number;
    totalHaberes: number;
    totalDescuentosLegales: number;
    liquidoPagar: number;
    earnings: Array<{ id: string; tipo: string; concepto: string; monto: number }>;
    deductions: Array<{ id: string; tipo: string; concepto: string; monto: number }>;
}

interface PeriodData {
    id: string;
    yearMonth: string;
    status: string;
    company: {
        id: string;
        razonSocial: string;
        rut: string;
    };
    payrollItems: PayrollItem[];
}

export default function EditPayrollPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [period, setPeriod] = useState<PeriodData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [editedItems, setEditedItems] = useState<PayrollItem[]>([]);

    useEffect(() => {
        async function fetchPeriod() {
            try {
                const response = await fetch(`/api/payroll/periods/${resolvedParams.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setPeriod(data);
                    setEditedItems(data.payrollItems);
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

    const updateEarning = (itemIndex: number, earningIndex: number, value: number) => {
        const newItems = [...editedItems];
        newItems[itemIndex].earnings[earningIndex].monto = value;

        // Recalculate totals
        const totalHaberes = newItems[itemIndex].earnings.reduce((sum, e) => sum + Number(e.monto), 0);
        newItems[itemIndex].totalHaberes = totalHaberes;
        newItems[itemIndex].liquidoPagar = totalHaberes - newItems[itemIndex].totalDescuentosLegales;

        setEditedItems(newItems);
    };

    const updateDeduction = (itemIndex: number, deductionIndex: number, value: number) => {
        const newItems = [...editedItems];
        newItems[itemIndex].deductions[deductionIndex].monto = value;

        // Recalculate totals
        const totalDescuentos = newItems[itemIndex].deductions.reduce((sum, d) => sum + Number(d.monto), 0);
        newItems[itemIndex].totalDescuentosLegales = totalDescuentos;
        newItems[itemIndex].liquidoPagar = newItems[itemIndex].totalHaberes - totalDescuentos;

        setEditedItems(newItems);
    };

    const updateDiasTrabajados = (itemIndex: number, dias: number) => {
        const newItems = [...editedItems];
        const item = newItems[itemIndex];
        const sueldoBase = item.worker.sueldoBase;

        // Update dias trabajados
        item.diasTrabajados = dias;

        // Find and update sueldo base earning proportionally
        const sueldoBaseEarningIndex = item.earnings.findIndex(e =>
            e.concepto.toLowerCase().includes('sueldo base') || e.tipo === 'SUELDO_BASE'
        );

        if (sueldoBaseEarningIndex >= 0) {
            // Calculate proportional sueldo base (30 days = full salary)
            const sueldoProporcional = Math.round((sueldoBase / 30) * dias);
            item.earnings[sueldoBaseEarningIndex].monto = sueldoProporcional;

            // Recalculate totals
            const totalHaberes = item.earnings.reduce((sum, e) => sum + Number(e.monto), 0);
            item.totalHaberes = totalHaberes;
            item.liquidoPagar = totalHaberes - item.totalDescuentosLegales;
        }

        setEditedItems(newItems);
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/payroll/periods/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payrollItems: editedItems }),
            });

            if (response.ok) {
                setSuccess("Liquidación actualizada correctamente");
                setTimeout(() => {
                    router.push(`/dashboard/liquidaciones/${resolvedParams.id}`);
                }, 1500);
            } else {
                const data = await response.json();
                setError(data.error || "Error al guardar");
            }
        } catch (err) {
            setError("Error al guardar los cambios");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    if (error && !period) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
            </div>
        );
    }

    if (!period) return null;

    return (
        <div className="max-w-7xl">
            <div className="mb-6">
                <Link
                    href={`/dashboard/liquidaciones/${resolvedParams.id}`}
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Volver al Detalle
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Editar Liquidación - {formatPeriod(period.yearMonth)}
                        </h1>
                        <p className="text-gray-600">{period.company.razonSocial}</p>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    {success}
                </div>
            )}

            {/* Edit each worker's payroll */}
            <div className="space-y-6">
                {editedItems.map((item, itemIndex) => (
                    <div key={item.id} className="bg-white shadow rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 border-b">
                            <h3 className="font-semibold text-gray-900">
                                {item.worker.nombres} {item.worker.apellidoPaterno} {item.worker.apellidoMaterno}
                            </h3>
                            <p className="text-sm text-gray-500">{item.worker.rut} | {item.worker.cargo}</p>
                        </div>

                        <div className="p-6">
                            {/* Días Trabajados */}
                            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                <div className="flex items-center justify-between gap-6">
                                    <div>
                                        <h4 className="font-medium text-yellow-800">Días Trabajados</h4>
                                        <p className="text-sm text-yellow-600">
                                            Sueldo base: {formatCurrency(item.worker.sueldoBase)} |
                                            Inasistencias: {30 - item.diasTrabajados} días
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            value={item.diasTrabajados}
                                            onChange={(e) => updateDiasTrabajados(itemIndex, parseInt(e.target.value) || 0)}
                                            className="w-20 px-3 py-2 border border-yellow-300 rounded-md text-center font-medium"
                                        />
                                        <span className="text-yellow-800">/ 30</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Haberes */}
                                <div>
                                    <h4 className="font-medium text-green-700 mb-3">HABERES</h4>
                                    <div className="space-y-3">
                                        {item.earnings.map((earning, earningIndex) => (
                                            <div key={earning.id} className="flex items-center justify-between gap-4">
                                                <label className="text-sm text-gray-600 flex-1">
                                                    {earning.concepto}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={earning.monto}
                                                    onChange={(e) => updateEarning(itemIndex, earningIndex, parseFloat(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right"
                                                />
                                            </div>
                                        ))}
                                        <div className="border-t pt-3 flex justify-between font-semibold text-green-700">
                                            <span>Total Haberes</span>
                                            <span>{formatCurrency(item.totalHaberes)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Descuentos */}
                                <div>
                                    <h4 className="font-medium text-red-700 mb-3">DESCUENTOS</h4>
                                    <div className="space-y-3">
                                        {item.deductions.map((deduction, deductionIndex) => (
                                            <div key={deduction.id} className="flex items-center justify-between gap-4">
                                                <label className="text-sm text-gray-600 flex-1">
                                                    {deduction.concepto}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={deduction.monto}
                                                    onChange={(e) => updateDeduction(itemIndex, deductionIndex, parseFloat(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right"
                                                />
                                            </div>
                                        ))}
                                        <div className="border-t pt-3 flex justify-between font-semibold text-red-700">
                                            <span>Total Descuentos</span>
                                            <span>-{formatCurrency(item.totalDescuentosLegales)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Líquido */}
                            <div className="mt-6 bg-blue-50 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-blue-800">LÍQUIDO A PAGAR</span>
                                    <span className="text-2xl font-bold text-blue-800">
                                        {formatCurrency(item.liquidoPagar)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div className="mt-6 flex justify-end gap-4">
                <Link
                    href={`/dashboard/liquidaciones/${resolvedParams.id}`}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md"
                >
                    Cancelar
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
                >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
}
