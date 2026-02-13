"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";

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

interface EditableData {
    sueldoBase: number;
    diasTrabajados: number;
    horasExtras50: number;  // cantidad de horas al 50%
    horasExtras100: number; // cantidad de horas al 100%
    bonos: { [key: string]: number }; // bonos editables por concepto
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

    // Store editable data separately for each worker
    const [editableData, setEditableData] = useState<{ [workerId: string]: EditableData }>({});
    // Store calculated results
    const [calculatedItems, setCalculatedItems] = useState<PayrollItem[]>([]);

    useEffect(() => {
        async function fetchPeriod() {
            try {
                const response = await fetch(`/api/payroll/periods/${resolvedParams.id}`);
                if (response.ok) {
                    const data = await response.json();
                    setPeriod(data);

                    // Initialize editable data from existing payroll items
                    const initialData: { [key: string]: EditableData } = {};
                    data.payrollItems.forEach((item: PayrollItem) => {
                        // Try to extract hours from concept (e.g., "Horas Extras (5 hrs al 50%)")
                        const horasExtrasEarning = item.earnings.find(e =>
                            e.concepto.toLowerCase().includes('horas extras') || e.tipo === 'HORAS_EXTRAS'
                        );

                        let hrs50 = 0, hrs100 = 0;
                        if (horasExtrasEarning) {
                            const match50 = horasExtrasEarning.concepto.match(/(\d+)\s*hrs?\s*al\s*50%/i);
                            const match100 = horasExtrasEarning.concepto.match(/(\d+)\s*hrs?\s*al\s*100%/i);
                            if (match50) hrs50 = parseInt(match50[1]);
                            if (match100) hrs100 = parseInt(match100[1]);
                        }

                        // Extract bonuses (colacion, movilizacion, viatico, and other non-standard bonuses)
                        const bonos: { [key: string]: number } = {};
                        item.earnings.forEach(e => {
                            const concepto = e.concepto.toLowerCase();
                            if (concepto.includes('bono') ||
                                concepto.includes('colación') ||
                                concepto.includes('movilización') ||
                                concepto.includes('viático')) {
                                bonos[e.concepto] = e.monto;
                            }
                        });

                        initialData[item.worker.id] = {
                            sueldoBase: item.worker.sueldoBase,
                            diasTrabajados: item.diasTrabajados,
                            horasExtras50: hrs50,
                            horasExtras100: hrs100,
                            bonos
                        };
                    });

                    setEditableData(initialData);
                    setCalculatedItems(data.payrollItems);
                } else {
                    setError("Error al cargar el período");
                }
            } catch (err) {
                setError("Error al cargar los datos");
            } finally {
                setLoading(false);
            }
        }

        fetchPeriod();
    }, [resolvedParams.id]);

    // Recalculate payroll when editable data changes
    const recalculatePayroll = (workerId: string, data: EditableData, originalItem: PayrollItem) => {
        // Calculate proportional salary
        const sueldoProporcional = Math.round((data.sueldoBase / 30) * data.diasTrabajados);

        // Calculate overtime value
        const valorHora = Math.round(sueldoProporcional / 180); // 180 hours per month
        const montoHE50 = Math.round(data.horasExtras50 * valorHora * 1.5);
        const montoHE100 = Math.round(data.horasExtras100 * valorHora * 2.0);
        const totalHorasExtras = montoHE50 + montoHE100;

        // Calculate legal gratification (25% of proportional salary)
        const gratificacion = Math.round(sueldoProporcional * 0.25);

        // Calculate taxable base (imponible)
        const totalBonos = Object.values(data.bonos).reduce((sum, val) => sum + val, 0);
        const imponible = sueldoProporcional + totalHorasExtras + gratificacion;

        // Recalculate earnings
        const newEarnings = originalItem.earnings.map(e => {
            const concepto = e.concepto.toLowerCase();

            // Sueldo Base
            if (concepto.includes('sueldo base') || e.tipo === 'SUELDO_BASE') {
                return { ...e, monto: sueldoProporcional };
            }

            // Horas Extras
            if (concepto.includes('horas extras') || e.tipo === 'HORAS_EXTRAS') {
                let newConcepto = 'Horas Extras';
                if (data.horasExtras50 > 0 && data.horasExtras100 > 0) {
                    newConcepto = `Horas Extras (${data.horasExtras50} hrs al 50%, ${data.horasExtras100} hrs al 100%)`;
                } else if (data.horasExtras50 > 0) {
                    newConcepto = `Horas Extras (${data.horasExtras50} hrs al 50%)`;
                } else if (data.horasExtras100 > 0) {
                    newConcepto = `Horas Extras (${data.horasExtras100} hrs al 100%)`;
                }
                return { ...e, concepto: newConcepto, monto: totalHorasExtras };
            }

            // Gratification
            if (concepto.includes('gratificación') || e.tipo === 'GRATIFICACION') {
                return { ...e, monto: gratificacion };
            }

            // Bonuses (keep values from editable data)
            if (data.bonos[e.concepto] !== undefined) {
                return { ...e, monto: data.bonos[e.concepto] };
            }

            return e;
        });

        // Recalculate deductions based on new imponible
        const newDeductions = originalItem.deductions.map(d => {
            const concepto = d.concepto.toLowerCase();

            // AFP
            if (concepto.includes('afp')) {
                const match = d.concepto.match(/(\d+\.?\d*)%/);
                if (match) {
                    const percentage = parseFloat(match[1]);
                    return { ...d, monto: Math.round(imponible * (percentage / 100)) };
                }
            }

            // Fonasa/Isapre
            if (concepto.includes('fonasa') || concepto.includes('isapre')) {
                const match = d.concepto.match(/(\d+)%/);
                if (match) {
                    const percentage = parseFloat(match[1]);
                    return { ...d, monto: Math.round(imponible * (percentage / 100)) };
                }
            }

            // Cesantía
            if (concepto.includes('cesantía')) {
                const match = d.concepto.match(/(\d+\.?\d*)%/);
                if (match) {
                    const percentage = parseFloat(match[1]);
                    return { ...d, monto: Math.round(imponible * (percentage / 100)) };
                }
            }

            return d;
        });

        const totalHaberes = newEarnings.reduce((sum, e) => sum + e.monto, 0);
        const totalDescuentos = newDeductions.reduce((sum, d) => sum + d.monto, 0);

        return {
            ...originalItem,
            diasTrabajados: data.diasTrabajados,
            earnings: newEarnings,
            deductions: newDeductions,
            totalHaberes,
            totalDescuentosLegales: totalDescuentos,
            liquidoPagar: totalHaberes - totalDescuentos
        };
    };

    const updateField = (workerId: string, field: keyof EditableData, value: any) => {
        const newData = {
            ...editableData[workerId],
            [field]: value
        };

        setEditableData({
            ...editableData,
            [workerId]: newData
        });

        // Find original item and recalculate
        const originalItem = period?.payrollItems.find(item => item.worker.id === workerId);
        if (originalItem) {
            const recalculated = recalculatePayroll(workerId, newData, originalItem);
            setCalculatedItems(prev =>
                prev.map(item => item.worker.id === workerId ? recalculated : item)
            );
        }
    };

    const updateBonus = (workerId: string, bonusName: string, value: number) => {
        const newBonos = {
            ...editableData[workerId].bonos,
            [bonusName]: value
        };

        const newData = {
            ...editableData[workerId],
            bonos: newBonos
        };

        setEditableData({
            ...editableData,
            [workerId]: newData
        });

        const originalItem = period?.payrollItems.find(item => item.worker.id === workerId);
        if (originalItem) {
            const recalculated = recalculatePayroll(workerId, newData, originalItem);
            setCalculatedItems(prev =>
                prev.map(item => item.worker.id === workerId ? recalculated : item)
            );
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await fetch(`/api/payroll/periods/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ payrollItems: calculatedItems }),
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatYearMonth = (yearMonth: string) => {
        const [year, month] = yearMonth.split("-");
        const months = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];
        return `${months[parseInt(month) - 1]} ${year}`;
    };

    const isCalculated = (concepto: string) => {
        const lower = concepto.toLowerCase();
        return lower.includes('gratificación') ||
            lower.includes('horas extras') ||
            lower.includes('sueldo base');
    };

    const isBono = (concepto: string) => {
        const lower = concepto.toLowerCase();
        return lower.includes('bono') ||
            lower.includes('colación') ||
            lower.includes('movilización') ||
            lower.includes('viático');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    if (!period) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error || "No se pudo cargar el período"}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href={`/dashboard/liquidaciones/${resolvedParams.id}`}
                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
                >
                    <ArrowLeftIcon className="h-5 w-5" />
                    Volver al Detalle
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Editar Liquidación</h1>
                <p className="text-gray-600 mt-1">
                    {period.company.razonSocial} - {formatYearMonth(period.yearMonth)}
                </p>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                    <CheckCircleIcon className="h-5 w-5" />
                    {success}
                </div>
            )}

            {/* Info Box */}
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
                <p className="flex items-center gap-2">
                    <LockClosedIcon className="h-5 w-5" />
                    <span>Los campos con candado se calculan automáticamente según el sueldo base, horas extras y días trabajados.</span>
                </p>
            </div>

            {/* Workers */}
            <div className="space-y-6">
                {calculatedItems.map((item, itemIndex) => {
                    const workerData = editableData[item.worker.id] || {
                        sueldoBase: item.worker.sueldoBase,
                        diasTrabajados: item.diasTrabajados,
                        horasExtras50: 0,
                        horasExtras100: 0,
                        bonos: {}
                    };

                    return (
                        <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
                            {/* Worker Header */}
                            <div className="mb-4 pb-4 border-b">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {item.worker.nombres} {item.worker.apellidoPaterno} {item.worker.apellidoMaterno}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {item.worker.rut} | {item.worker.cargo}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Sueldo base: {formatCurrency(workerData.sueldoBase)} | Inasistencias: {30 - workerData.diasTrabajados} días
                                </p>
                            </div>

                            {/* Días Trabajados */}
                            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-yellow-900">Días Trabajados</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max="31"
                                            value={workerData.diasTrabajados}
                                            onChange={(e) => updateField(item.worker.id, 'diasTrabajados', parseInt(e.target.value) || 0)}
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
                                        {/* Sueldo Base - Editable */}
                                        <div className="flex items-center justify-between gap-4 bg-blue-50 p-2 rounded">
                                            <label className="text-sm text-gray-700 flex-1 font-medium">
                                                Sueldo Base
                                            </label>
                                            <input
                                                type="number"
                                                value={workerData.sueldoBase}
                                                onChange={(e) => updateField(item.worker.id, 'sueldoBase', parseFloat(e.target.value) || 0)}
                                                className="w-32 px-3 py-2 border border-blue-300 rounded-md text-right font-medium"
                                            />
                                        </div>

                                        {/* Horas Extras - Calculated */}
                                        <div className="bg-gray-50 p-2 rounded">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                                                    Horas Extras
                                                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.earnings.find(e => e.concepto.toLowerCase().includes('horas extras'))?.monto || 0}
                                                    disabled
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right bg-gray-100 text-gray-600"
                                                />
                                            </div>
                                            <div className="flex gap-4 text-xs">
                                                <div className="flex items-center gap-2">
                                                    <label className="text-gray-600">50%:</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={workerData.horasExtras50}
                                                        onChange={(e) => updateField(item.worker.id, 'horasExtras50', parseInt(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                    />
                                                    <span className="text-gray-500">hrs</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <label className="text-gray-600">100%:</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={workerData.horasExtras100}
                                                        onChange={(e) => updateField(item.worker.id, 'horasExtras100', parseInt(e.target.value) || 0)}
                                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                                    />
                                                    <span className="text-gray-500">hrs</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Gratification - Calculated */}
                                        {item.earnings.some(e => isCalculated(e.concepto) && e.concepto.toLowerCase().includes('gratificación')) && (
                                            <div className="flex items-center justify-between gap-4 bg-gray-50 p-2 rounded">
                                                <label className="text-sm text-gray-700 flex-1 flex items-center gap-2">
                                                    Gratificación Legal 25%
                                                    <LockClosedIcon className="h-4 w-4 text-gray-400" />
                                                </label>
                                                <input
                                                    type="number"
                                                    value={item.earnings.find(e => e.concepto.toLowerCase().includes('gratificación'))?.monto || 0}
                                                    disabled
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right bg-gray-100 text-gray-600"
                                                />
                                            </div>
                                        )}

                                        {/* Bonuses - Editable */}
                                        {item.earnings.filter(e => isBono(e.concepto)).map((earning, earningIndex) => (
                                            <div key={earning.id} className="flex items-center justify-between gap-4 bg-blue-50 p-2 rounded">
                                                <label className="text-sm text-gray-700 flex-1 font-medium">
                                                    {earning.concepto}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={workerData.bonos[earning.concepto] || 0}
                                                    onChange={(e) => updateBonus(item.worker.id, earning.concepto, parseFloat(e.target.value) || 0)}
                                                    className="w-32 px-3 py-2 border border-blue-300 rounded-md text-right font-medium"
                                                />
                                            </div>
                                        ))}

                                        <div className="border-t pt-3 flex justify-between font-semibold text-green-700">
                                            <span>Total Haberes</span>
                                            <span>{formatCurrency(item.totalHaberes)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Descuentos - All Calculated */}
                                <div>
                                    <h4 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                                        DESCUENTOS
                                        <LockClosedIcon className="h-4 w-4 text-gray-400" />
                                    </h4>
                                    <div className="space-y-3">
                                        {item.deductions.map((deduction) => (
                                            <div key={deduction.id} className="flex items-center justify-between gap-4 bg-gray-50 p-2 rounded">
                                                <label className="text-sm text-gray-700 flex-1">
                                                    {deduction.concepto}
                                                </label>
                                                <input
                                                    type="number"
                                                    value={deduction.monto}
                                                    disabled
                                                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-right bg-gray-100 text-gray-600"
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

                            {/* Liquid Amount */}
                            <div className="mt-6 pt-6 border-t">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span className="text-blue-900">LÍQUIDO A PAGAR</span>
                                    <span className="text-blue-600">{formatCurrency(item.liquidoPagar)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Actions */}
            <div className="mt-8 flex gap-4 justify-end">
                <Link
                    href={`/dashboard/liquidaciones/${resolvedParams.id}`}
                    className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                >
                    Cancelar
                </Link>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>
        </div>
    );
}
