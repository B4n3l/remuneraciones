"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Company {
    id: string;
    razonSocial: string;
    rut: string;
}

interface LibroItem {
    worker: {
        nombres: string;
        apellidoPaterno: string;
        apellidoMaterno: string;
        rut: string;
        cargo: string;
    };
    diasTrabajados: number;
    horasExtra: number;
    totalHaberes: number;
    sueldoBase: number;
    gratificacion: number;
    horasExtraMonto: number;
    bonos: number;
    afp: number;
    salud: number;
    cesantia: number;
    impuesto: number;
    totalDescuentos: number;
    liquidoPagar: number;
}

interface LibroTotals {
    diasTrabajados: number;
    horasExtra: number;
    totalHaberes: number;
    sueldoBase: number;
    gratificacion: number;
    horasExtraMonto: number;
    bonos: number;
    afp: number;
    salud: number;
    cesantia: number;
    impuesto: number;
    totalDescuentos: number;
    liquidoPagar: number;
}

interface LibroData {
    period: {
        yearMonth: string;
        fechaInicio: string;
        fechaFin: string;
        status: string;
    };
    company: {
        razonSocial: string;
        rut: string;
    };
    items: LibroItem[];
    totals: LibroTotals;
}

interface LibroClientProps {
    companies: Company[];
    initialData: LibroData | null;
    initialError: string | null;
    initialParams: {
        companyId: string;
        year: number;
        month: number;
    } | null;
}

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function LibroClient({
    companies,
    initialData,
    initialError,
    initialParams,
}: LibroClientProps) {
    const router = useRouter();
    const currentDate = new Date();

    const [companyId, setCompanyId] = useState(initialParams?.companyId ?? "");
    const [year, setYear] = useState(initialParams?.year ?? currentDate.getFullYear());
    const [month, setMonth] = useState(initialParams?.month ?? currentDate.getMonth() + 1);
    const [error, setError] = useState(initialError ?? "");

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    const handleVerLibro = () => {
        if (!companyId) {
            setError("Selecciona una empresa");
            return;
        }
        setError("");
        router.push(`/dashboard/libro?companyId=${companyId}&year=${year}&month=${month}`);
    };

    const handleDescargarPDF = () => {
        if (!companyId) {
            setError("Selecciona una empresa");
            return;
        }
        setError("");
        window.open(
            `/api/payroll/libro/${companyId}/pdf?year=${year}&month=${month}`,
            "_blank"
        );
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Libro de Remuneraciones</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Reporte mensual consolidado de haberes, descuentos y líquidos por trabajador
                </p>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium mb-2">Empresa *</label>
                        <select
                            value={companyId}
                            onChange={(e) => setCompanyId(e.target.value)}
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
                            value={year}
                            onChange={(e) => setYear(parseInt(e.target.value) || currentDate.getFullYear())}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                            min="2020"
                            max="2030"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Mes *</label>
                        <select
                            value={month}
                            onChange={(e) => setMonth(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900"
                        >
                            {MONTHS.map((mes, idx) => (
                                <option key={idx} value={idx + 1}>
                                    {mes}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleVerLibro}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
                        >
                            Ver Libro
                        </button>
                        <button
                            onClick={handleDescargarPDF}
                            className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
                        >
                            Descargar PDF
                        </button>
                    </div>
                </div>
            </div>

            {initialData && (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {initialData.company.razonSocial}
                        </h2>
                        <p className="text-sm text-gray-500">
                            Período: {(() => {
                                const [y, m] = initialData.period.yearMonth.split("-");
                                return `${MONTHS[parseInt(m) - 1]} ${y}`;
                            })()}
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">N°</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                                    <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Días</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sueldo Base</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Gratif.</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">H.Extra</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Bonos</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tot.Hab</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">AFP</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Salud</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cesant.</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Imp.</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Tot.Desc</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Líquido</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {initialData.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        <td className="px-3 py-2 text-gray-900">{idx + 1}</td>
                                        <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                            {item.worker.nombres} {item.worker.apellidoPaterno} {item.worker.apellidoMaterno}
                                        </td>
                                        <td className="px-3 py-2 text-gray-500">{item.worker.cargo}</td>
                                        <td className="px-3 py-2 text-center text-gray-900">{item.diasTrabajados}</td>
                                        <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.sueldoBase)}</td>
                                        <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.gratificacion)}</td>
                                        <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.horasExtraMonto)}</td>
                                        <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(item.bonos)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-gray-900">{formatCurrency(item.totalHaberes)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(item.afp)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(item.salud)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(item.cesantia)}</td>
                                        <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(item.impuesto)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-red-600">-{formatCurrency(item.totalDescuentos)}</td>
                                        <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(item.liquidoPagar)}</td>
                                    </tr>
                                ))}
                                <tr className="bg-gray-100 font-semibold">
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-gray-900">TOTALES</td>
                                    <td className="px-3 py-2"></td>
                                    <td className="px-3 py-2 text-center text-gray-900">{initialData.totals.diasTrabajados}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(initialData.totals.sueldoBase)}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(initialData.totals.gratificacion)}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(initialData.totals.horasExtraMonto)}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(initialData.totals.bonos)}</td>
                                    <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(initialData.totals.totalHaberes)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(initialData.totals.afp)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(initialData.totals.salud)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(initialData.totals.cesantia)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(initialData.totals.impuesto)}</td>
                                    <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(initialData.totals.totalDescuentos)}</td>
                                    <td className="px-3 py-2 text-right text-green-600">{formatCurrency(initialData.totals.liquidoPagar)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!initialData && !initialError && initialParams && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-sm font-medium text-yellow-800 mb-2">
                        No existe liquidación para este período.
                    </h3>
                    <p className="text-sm text-yellow-700">
                        Verifica que el período seleccionado tenga liquidaciones guardadas.
                    </p>
                </div>
            )}
        </div>
    );
}
