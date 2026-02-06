"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Worker {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    rut: string;
    cargo: string;
    sueldoBase: number;
}

export default function NuevaLiquidacionPage() {
    const router = useRouter();
    const currentDate = new Date();

    const [companies, setCompanies] = useState<any[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [payrollResults, setPayrollResults] = useState<any>(null);

    const [formData, setFormData] = useState({
        companyId: "",
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1,
    });

    const [workerInputs, setWorkerInputs] = useState<Record<string, {
        diasTrabajados: number;
        horasExtras50: number;
        horasExtras100: number;
        bonos: number;
    }>>({});

    const [error, setError] = useState("");

    useEffect(() => {
        async function fetchCompanies() {
            try {
                const response = await fetch("/api/companies");
                if (response.ok) {
                    const data = await response.json();
                    setCompanies(data);
                }
            } catch (err) {
                console.error("Error fetching companies:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCompanies();
    }, []);

    useEffect(() => {
        async function fetchWorkers() {
            if (!formData.companyId) {
                setWorkers([]);
                return;
            }

            try {
                const response = await fetch(`/api/workers?companyId=${formData.companyId}`);
                if (response.ok) {
                    const data = await response.json();
                    setWorkers(data);

                    // Initialize worker inputs
                    const inputs: typeof workerInputs = {};
                    data.forEach((worker: Worker) => {
                        inputs[worker.id] = {
                            diasTrabajados: 30, // Default to 30 days
                            horasExtras50: 0,
                            horasExtras100: 0,
                            bonos: 0,
                        };
                    });
                    setWorkerInputs(inputs);
                }
            } catch (err) {
                console.error("Error fetching workers:", err);
            }
        }
        fetchWorkers();
    }, [formData.companyId]);

    const handleWorkerInputChange = (workerId: string, field: string, value: string) => {
        setWorkerInputs({
            ...workerInputs,
            [workerId]: {
                ...workerInputs[workerId],
                [field]: parseFloat(value) || 0,
            },
        });
    };

    const handleCalculate = async () => {
        if (!formData.companyId) {
            setError("Debe seleccionar una empresa");
            return;
        }

        setError("");
        setCalculating(true);

        try {
            const response = await fetch("/api/payroll/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: formData.companyId,
                    year: formData.year,
                    month: formData.month,
                    workerInputs,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Error al calcular liquidaciones");
                return;
            }

            setPayrollResults(data);
        } catch (err) {
            setError("Error al calcular liquidaciones");
        } finally {
            setCalculating(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleSave = async () => {
        if (!payrollResults) return;

        setError("");
        setSaving(true);

        try {
            const response = await fetch("/api/payroll/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    companyId: formData.companyId,
                    year: formData.year,
                    month: formData.month,
                    payrolls: payrollResults.payrolls,
                    systemValue: payrollResults.systemValue,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Error al guardar el período");
                return;
            }

            // Redirect to liquidaciones list
            router.push("/dashboard/liquidaciones");
            router.refresh();
        } catch (err) {
            setError("Error al guardar el período");
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

    if (companies.length === 0) {
        return (
            <div className="max-w-2xl">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        No hay empresas disponibles
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                        Primero debes crear una empresa.
                    </p>
                    <Link
                        href="/dashboard/empresas/nueva"
                        className="inline-flex px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md"
                    >
                        Crear Empresa
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nueva Liquidación</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Genera las liquidaciones de sueldo del período seleccionado
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            {/* Selección de empresa y período */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Empresa y Período</h2>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3 md:col-span-1">
                        <label className="block text-sm font-medium mb-2">Empresa *</label>
                        <select
                            value={formData.companyId}
                            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                        >
                            <option value="">Seleccionar empresa</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>
                                    {company.razonSocial}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Año *</label>
                        <input
                            type="number"
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                            min="2020"
                            max="2030"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Mes *</label>
                        <select
                            value={formData.month}
                            onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                        >
                            {[
                                "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                                "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
                            ].map((mes, idx) => (
                                <option key={idx} value={idx + 1}>{mes}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Input de horas extras y bonos */}
            {workers.length > 0 && !payrollResults && (
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4">Horas Extras y Bonos</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Trabajador
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Sueldo Base
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Días Trab.
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        HE 50%
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        HE 100%
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                        Bonos (CLP)
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {workers.map((worker) => (
                                    <tr key={worker.id}>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {worker.nombres} {worker.apellidoPaterno}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {formatCurrency(worker.sueldoBase)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                max="31"
                                                value={workerInputs[worker.id]?.diasTrabajados || 30}
                                                onChange={(e) => handleWorkerInputChange(worker.id, "diasTrabajados", e.target.value)}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-gray-900"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={workerInputs[worker.id]?.horasExtras50 || 0}
                                                onChange={(e) => handleWorkerInputChange(worker.id, "horasExtras50", e.target.value)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-900"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={workerInputs[worker.id]?.horasExtras100 || 0}
                                                onChange={(e) => handleWorkerInputChange(worker.id, "horasExtras100", e.target.value)}
                                                className="w-20 px-2 py-1 border border-gray-300 rounded text-center text-gray-900"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={workerInputs[worker.id]?.bonos || 0}
                                                onChange={(e) => handleWorkerInputChange(worker.id, "bonos", e.target.value)}
                                                className="w-24 px-2 py-1 border border-gray-300 rounded text-center text-gray-900"
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={handleCalculate}
                            disabled={calculating}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
                        >
                            {calculating ? "Calculando..." : "Calcular Liquidaciones"}
                        </button>
                    </div>
                </div>
            )}

            {workers.length === 0 && formData.companyId && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        No hay trabajadores en esta empresa
                    </h3>
                    <p className="text-sm text-yellow-700 mb-4">
                        Primero debes agregar trabajadores a la empresa.
                    </p>
                    <Link
                        href="/dashboard/trabajadores/nuevo"
                        className="inline-flex px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-md"
                    >
                        Crear Trabajador
                    </Link>
                </div>
            )}

            {/* Preview de resultados */}
            {payrollResults && (
                <div className="space-y-6">
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">
                            Resultados - {payrollResults.payrolls.length} Liquidación(es)
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            UF: {formatCurrency(payrollResults.systemValue.valorUF)} |
                            UTM: {formatCurrency(payrollResults.systemValue.valorUTM)} |
                            Sueldo Mínimo: {formatCurrency(payrollResults.systemValue.sueldoMinimo)}
                        </p>
                    </div>

                    {payrollResults.payrolls.map((payroll: any) => (
                        <div key={payroll.workerId} className="bg-white shadow rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                {payroll.workerName}
                                <span className="text-sm font-normal text-gray-500 ml-2">({payroll.workerRut})</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Haberes */}
                                <div className="bg-green-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-green-800 mb-3">HABERES</h4>
                                    <div className="space-y-2">
                                        {payroll.detalleHaberes?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.concepto}</span>
                                                <span className="font-medium">{formatCurrency(item.monto)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-green-200 pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-green-800">
                                                <span>Total Haberes</span>
                                                <span>{formatCurrency(payroll.totalHaberes)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Descuentos */}
                                <div className="bg-red-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-red-800 mb-3">DESCUENTOS</h4>
                                    <div className="space-y-2">
                                        {payroll.detalleDescuentos?.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between text-sm">
                                                <span className="text-gray-600">{item.concepto}</span>
                                                <span className="font-medium">-{formatCurrency(item.monto)}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-red-200 pt-2 mt-2">
                                            <div className="flex justify-between font-semibold text-red-800">
                                                <span>Total Descuentos</span>
                                                <span>-{formatCurrency(payroll.totalDescuentos)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Resumen */}
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <h4 className="font-semibold text-blue-800 mb-3">RESUMEN</h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Sueldo Base</span>
                                            <span>{formatCurrency(payroll.sueldoBase)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Horas Extras</span>
                                            <span>{formatCurrency(payroll.horasExtras)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Gratificación</span>
                                            <span>{formatCurrency(payroll.gratificacion)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Bonos</span>
                                            <span>{formatCurrency(payroll.bonos)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Base Imponible</span>
                                            <span>{formatCurrency(payroll.imponible)}</span>
                                        </div>
                                        <div className="border-t border-blue-200 pt-2 mt-2">
                                            <div className="flex justify-between font-bold text-xl text-blue-800">
                                                <span>LÍQUIDO</span>
                                                <span>{formatCurrency(payroll.liquido)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="flex gap-4">
                        <button
                            onClick={() => setPayrollResults(null)}
                            disabled={saving}
                            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded-md disabled:opacity-50"
                        >
                            Volver a Editar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md disabled:opacity-50"
                        >
                            {saving ? "Guardando..." : "Guardar Período"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
