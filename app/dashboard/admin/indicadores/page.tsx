"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AFPRate {
    id?: string;
    afpNombre: string;
    cargoTrabajador: number;
    cargoEmpleador: number;
    totalAPagar: number;
    independiente: number;
}

interface CesantiaRate {
    id?: string;
    tipoContrato: string;
    empleador: number;
    trabajador: number;
}

interface AsignacionFamiliar {
    id?: string;
    tramo: string;
    monto: number;
    rentaDesde: number;
    rentaHasta: number | null;
}

interface Indicador {
    id: string;
    year: number;
    month: number;
    valorUF: number;
    valorUTM: number;
    valorUTA: number;
    sueldoMinimo: number;
    sueldoMinimoCasaPart: number;
    sueldoMinimoMenores: number;
    sueldoMinimoNoRem: number;
    topeImponibleAFP: number;
    topeImponibleINP: number;
    topeSeguroCesantia: number;
    sisRate: number;
    seguroSocialRate: number;
    apvTopeMensualUF: number;
    apvTopeAnualUF: number;
    afpRates: AFPRate[];
    cesantiaRates: CesantiaRate[];
    asignacionFamiliar: AsignacionFamiliar[];
}

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const AFP_NAMES = ["Capital", "Cuprum", "Habitat", "PlanVital", "Provida", "Modelo", "Uno"];

const CESANTIA_TIPOS = [
    { value: "INDEFINIDO", label: "Plazo Indefinido" },
    { value: "PLAZO_FIJO", label: "Plazo Fijo" },
    { value: "INDEFINIDO_11", label: "Indefinido 11+ años" },
    { value: "CASA_PARTICULAR", label: "Casa Particular" },
];

const ASIGNACION_TRAMOS = ["A", "B", "C", "D"];

export default function IndicadoresPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [indicadores, setIndicadores] = useState<Indicador[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showModal, setShowModal] = useState(false);
    const [editingIndicador, setEditingIndicador] = useState<Indicador | null>(null);
    const [saving, setSaving] = useState(false);
    const [duplicateFrom, setDuplicateFrom] = useState<{ year: number; month: number } | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
        valorUF: 0,
        valorUTM: 0,
        valorUTA: 0,
        sueldoMinimo: 0,
        sueldoMinimoCasaPart: 0,
        sueldoMinimoMenores: 0,
        sueldoMinimoNoRem: 0,
        topeImponibleAFP: 89.9,
        topeImponibleINP: 60,
        topeSeguroCesantia: 135.1,
        sisRate: 1.54,
        seguroSocialRate: 0.9,
        apvTopeMensualUF: 50,
        apvTopeAnualUF: 600,
    });

    const [afpRates, setAfpRates] = useState<AFPRate[]>([]);
    const [cesantiaRates, setCesantiaRates] = useState<CesantiaRate[]>([]);
    const [asignacionFamiliar, setAsignacionFamiliar] = useState<AsignacionFamiliar[]>([]);
    const [expandedSections, setExpandedSections] = useState({
        afp: false,
        cesantia: false,
        asignacion: false,
    });

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "SUPER_ADMIN") {
                router.push("/dashboard");
                return;
            }
            fetchIndicadores();
        }
    }, [status, selectedYear, session, router]);

    const fetchIndicadores = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/indicadores?year=${selectedYear}`);
            if (res.ok) {
                const data = await res.json();
                setIndicadores(data);
            }
        } catch (error) {
            console.error("Error fetching indicadores:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleNew = () => {
        setEditingIndicador(null);
        setFormData({
            year: selectedYear,
            month: new Date().getMonth() + 1,
            valorUF: 0,
            valorUTM: 0,
            valorUTA: 0,
            sueldoMinimo: 539000,
            sueldoMinimoCasaPart: 539000,
            sueldoMinimoMenores: 402082,
            sueldoMinimoNoRem: 347434,
            topeImponibleAFP: 89.9,
            topeImponibleINP: 60,
            topeSeguroCesantia: 135.1,
            sisRate: 1.54,
            seguroSocialRate: 0.9,
            apvTopeMensualUF: 50,
            apvTopeAnualUF: 600,
        });
        // Initialize AFP rates with defaults
        setAfpRates(AFP_NAMES.map(nombre => ({
            afpNombre: nombre,
            cargoTrabajador: 11.0,
            cargoEmpleador: 0.1,
            totalAPagar: 11.1,
            independiente: 12.5,
        })));
        setCesantiaRates(CESANTIA_TIPOS.map(t => ({
            tipoContrato: t.value,
            empleador: t.value === "INDEFINIDO" ? 2.4 : 3.0,
            trabajador: t.value === "INDEFINIDO" || t.value === "INDEFINIDO_11" ? 0.6 : 0,
        })));
        setAsignacionFamiliar(ASIGNACION_TRAMOS.map((tramo, i) => ({
            tramo,
            monto: i === 0 ? 22007 : i === 1 ? 13505 : i === 2 ? 4267 : 0,
            rentaDesde: i === 0 ? 0 : i === 1 ? 631976 : i === 2 ? 923067 : 1439668,
            rentaHasta: i === 0 ? 631976 : i === 1 ? 923067 : i === 2 ? 1439668 : null,
        })));
        setShowModal(true);
    };

    const handleEdit = (indicador: Indicador) => {
        setEditingIndicador(indicador);
        setFormData({
            year: indicador.year,
            month: indicador.month,
            valorUF: Number(indicador.valorUF),
            valorUTM: Number(indicador.valorUTM),
            valorUTA: Number(indicador.valorUTA),
            sueldoMinimo: Number(indicador.sueldoMinimo),
            sueldoMinimoCasaPart: Number(indicador.sueldoMinimoCasaPart),
            sueldoMinimoMenores: Number(indicador.sueldoMinimoMenores),
            sueldoMinimoNoRem: Number(indicador.sueldoMinimoNoRem),
            topeImponibleAFP: Number(indicador.topeImponibleAFP),
            topeImponibleINP: Number(indicador.topeImponibleINP),
            topeSeguroCesantia: Number(indicador.topeSeguroCesantia),
            sisRate: Number(indicador.sisRate),
            seguroSocialRate: Number(indicador.seguroSocialRate),
            apvTopeMensualUF: Number(indicador.apvTopeMensualUF),
            apvTopeAnualUF: Number(indicador.apvTopeAnualUF),
        });
        setAfpRates(indicador.afpRates.map(a => ({
            ...a,
            cargoTrabajador: Number(a.cargoTrabajador),
            cargoEmpleador: Number(a.cargoEmpleador),
            totalAPagar: Number(a.totalAPagar),
            independiente: Number(a.independiente),
        })));
        setCesantiaRates(indicador.cesantiaRates.map(c => ({
            ...c,
            empleador: Number(c.empleador),
            trabajador: Number(c.trabajador),
        })));
        setAsignacionFamiliar(indicador.asignacionFamiliar.map(a => ({
            ...a,
            monto: Number(a.monto),
            rentaDesde: Number(a.rentaDesde),
            rentaHasta: a.rentaHasta ? Number(a.rentaHasta) : null,
        })));
        setShowModal(true);
    };

    const handleDuplicate = async () => {
        if (!duplicateFrom) return;

        setSaving(true);
        try {
            const res = await fetch("/api/admin/indicadores/duplicate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceYear: duplicateFrom.year,
                    sourceMonth: duplicateFrom.month,
                    targetYear: formData.year,
                    targetMonth: formData.month,
                }),
            });

            if (res.ok) {
                const newIndicador = await res.json();
                handleEdit(newIndicador);
                setDuplicateFrom(null);
                await fetchIndicadores();
            } else {
                const error = await res.json();
                alert(error.error || "Error al duplicar");
            }
        } catch (error) {
            console.error("Error duplicating:", error);
            alert("Error al duplicar indicador");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...formData,
                afpRates,
                cesantiaRates,
                asignacionFamiliar,
            };

            const url = editingIndicador
                ? `/api/admin/indicadores/${editingIndicador.id}`
                : "/api/admin/indicadores";

            const res = await fetch(url, {
                method: editingIndicador ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowModal(false);
                await fetchIndicadores();
            } else {
                const error = await res.json();
                alert(error.error || "Error al guardar");
            }
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar indicador");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este indicador?")) return;

        try {
            const res = await fetch(`/api/admin/indicadores/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                await fetchIndicadores();
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("es-CL", {
            style: "currency",
            currency: "CLP",
            minimumFractionDigits: 0,
        }).format(value);
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Indicadores Previsionales</h1>
                    <p className="text-gray-600">Gestiona los valores de UF, UTM, AFPs y otros indicadores por período</p>
                </div>
                <button
                    onClick={handleNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span> Nuevo Indicador
                </button>
            </div>

            {/* Year filter */}
            <div className="mb-6 flex gap-2">
                {[2024, 2025, 2026, 2027].map(year => (
                    <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={`px-4 py-2 rounded-lg ${selectedYear === year
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {year}
                    </button>
                ))}
            </div>

            {/* Indicadores table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UF</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">UTM</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sueldo Mínimo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tope AFP</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">SIS</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {indicadores.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No hay indicadores para {selectedYear}
                                </td>
                            </tr>
                        ) : (
                            indicadores.map((ind) => (
                                <tr key={ind.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                                        {MESES[ind.month - 1]} {ind.year}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(Number(ind.valorUF))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(Number(ind.valorUTM))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {formatCurrency(Number(ind.sueldoMinimo))}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {Number(ind.topeImponibleAFP)} UF
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {Number(ind.sisRate)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => handleEdit(ind)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ind.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingIndicador ? "Editar Indicador" : "Nuevo Indicador"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Period selection */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mes</label>
                                    <select
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                        disabled={!!editingIndicador}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        {MESES.map((mes, i) => (
                                            <option key={i} value={i + 1}>{mes}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                    <select
                                        value={formData.year}
                                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        disabled={!!editingIndicador}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        {[2024, 2025, 2026, 2027].map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Duplicate option */}
                            {!editingIndicador && indicadores.length > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm text-blue-800 mb-2">
                                        📋 Duplicar desde período anterior:
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    const [y, m] = e.target.value.split("-");
                                                    setDuplicateFrom({ year: parseInt(y), month: parseInt(m) });
                                                } else {
                                                    setDuplicateFrom(null);
                                                }
                                            }}
                                            className="border rounded px-3 py-2"
                                        >
                                            <option value="">Seleccionar...</option>
                                            {indicadores.map(ind => (
                                                <option key={ind.id} value={`${ind.year}-${ind.month}`}>
                                                    {MESES[ind.month - 1]} {ind.year}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            onClick={handleDuplicate}
                                            disabled={!duplicateFrom || saving}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                                        >
                                            Duplicar
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Valores UF/UTM */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Valores Monetarios</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">UF</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.valorUF}
                                            onChange={(e) => setFormData({ ...formData, valorUF: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">UTM</label>
                                        <input
                                            type="number"
                                            value={formData.valorUTM}
                                            onChange={(e) => setFormData({ ...formData, valorUTM: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">UTA</label>
                                        <input
                                            type="number"
                                            value={formData.valorUTA}
                                            onChange={(e) => setFormData({ ...formData, valorUTA: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Sueldos Mínimos */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Sueldos Mínimos</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Dependientes e Independientes</label>
                                        <input
                                            type="number"
                                            value={formData.sueldoMinimo}
                                            onChange={(e) => setFormData({ ...formData, sueldoMinimo: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Casa Particular</label>
                                        <input
                                            type="number"
                                            value={formData.sueldoMinimoCasaPart}
                                            onChange={(e) => setFormData({ ...formData, sueldoMinimoCasaPart: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Menores 18 / Mayores 65</label>
                                        <input
                                            type="number"
                                            value={formData.sueldoMinimoMenores}
                                            onChange={(e) => setFormData({ ...formData, sueldoMinimoMenores: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Fines No Remuneracionales</label>
                                        <input
                                            type="number"
                                            value={formData.sueldoMinimoNoRem}
                                            onChange={(e) => setFormData({ ...formData, sueldoMinimoNoRem: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Topes */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Topes Imponibles (en UF)</h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">AFP</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.topeImponibleAFP}
                                            onChange={(e) => setFormData({ ...formData, topeImponibleAFP: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">INP</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.topeImponibleINP}
                                            onChange={(e) => setFormData({ ...formData, topeImponibleINP: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Seguro Cesantía</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={formData.topeSeguroCesantia}
                                            onChange={(e) => setFormData({ ...formData, topeSeguroCesantia: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Tasas */}
                            <div>
                                <h3 className="font-medium text-gray-900 mb-3">Tasas (%)</h3>
                                <div className="grid grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">SIS</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.sisRate}
                                            onChange={(e) => setFormData({ ...formData, sisRate: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">Seguro Social</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.seguroSocialRate}
                                            onChange={(e) => setFormData({ ...formData, seguroSocialRate: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">APV Mensual (UF)</label>
                                        <input
                                            type="number"
                                            value={formData.apvTopeMensualUF}
                                            onChange={(e) => setFormData({ ...formData, apvTopeMensualUF: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-600 mb-1">APV Anual (UF)</label>
                                        <input
                                            type="number"
                                            value={formData.apvTopeAnualUF}
                                            onChange={(e) => setFormData({ ...formData, apvTopeAnualUF: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* AFP Rates - Collapsible */}
                            <div className="border rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setExpandedSections(prev => ({ ...prev, afp: !prev.afp }))}
                                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                                >
                                    <span className="font-medium">Tasas AFP ({afpRates.length})</span>
                                    <span>{expandedSections.afp ? "▼" : "▶"}</span>
                                </button>
                                {expandedSections.afp && (
                                    <div className="p-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500">
                                                    <th className="pb-2">AFP</th>
                                                    <th className="pb-2">Trabajador %</th>
                                                    <th className="pb-2">Empleador %</th>
                                                    <th className="pb-2">Total % <span className="text-xs text-gray-400">(auto)</span></th>
                                                    <th className="pb-2">Independiente %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {afpRates.map((afp, index) => (
                                                    <tr key={afp.afpNombre}>
                                                        <td className="py-1 font-medium">{afp.afpNombre}</td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={afp.cargoTrabajador}
                                                                onChange={(e) => {
                                                                    const newRates = [...afpRates];
                                                                    const trabajador = parseFloat(e.target.value) || 0;
                                                                    newRates[index].cargoTrabajador = trabajador;
                                                                    newRates[index].totalAPagar = parseFloat((trabajador + newRates[index].cargoEmpleador).toFixed(2));
                                                                    setAfpRates(newRates);
                                                                }}
                                                                className="w-20 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={afp.cargoEmpleador}
                                                                onChange={(e) => {
                                                                    const newRates = [...afpRates];;
                                                                    const empleador = parseFloat(e.target.value) || 0;
                                                                    newRates[index].cargoEmpleador = empleador;
                                                                    newRates[index].totalAPagar = parseFloat((newRates[index].cargoTrabajador + empleador).toFixed(2));
                                                                    setAfpRates(newRates);
                                                                }}
                                                                className="w-20 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-1">
                                                            <span className="inline-block w-20 px-2 py-1 bg-green-100 text-green-800 border border-green-300 rounded text-center font-semibold">
                                                                {afp.totalAPagar.toFixed(2)}
                                                            </span>
                                                        </td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                value={afp.independiente}
                                                                onChange={(e) => {
                                                                    const newRates = [...afpRates];
                                                                    newRates[index].independiente = parseFloat(e.target.value) || 0;
                                                                    setAfpRates(newRates);
                                                                }}
                                                                className="w-20 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Cesantia - Collapsible */}
                            <div className="border rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setExpandedSections(prev => ({ ...prev, cesantia: !prev.cesantia }))}
                                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                                >
                                    <span className="font-medium">Seguro Cesantía ({cesantiaRates.length})</span>
                                    <span>{expandedSections.cesantia ? "▼" : "▶"}</span>
                                </button>
                                {expandedSections.cesantia && (
                                    <div className="p-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500">
                                                    <th className="pb-2">Tipo Contrato</th>
                                                    <th className="pb-2">Empleador %</th>
                                                    <th className="pb-2">Trabajador %</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {cesantiaRates.map((c, index) => (
                                                    <tr key={c.tipoContrato}>
                                                        <td className="py-1 font-medium">
                                                            {CESANTIA_TIPOS.find(t => t.value === c.tipoContrato)?.label || c.tipoContrato}
                                                        </td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={c.empleador}
                                                                onChange={(e) => {
                                                                    const newRates = [...cesantiaRates];
                                                                    newRates[index].empleador = parseFloat(e.target.value);
                                                                    setCesantiaRates(newRates);
                                                                }}
                                                                className="w-20 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                step="0.1"
                                                                value={c.trabajador}
                                                                onChange={(e) => {
                                                                    const newRates = [...cesantiaRates];
                                                                    newRates[index].trabajador = parseFloat(e.target.value);
                                                                    setCesantiaRates(newRates);
                                                                }}
                                                                className="w-20 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Asignación Familiar - Collapsible */}
                            <div className="border rounded-lg">
                                <button
                                    type="button"
                                    onClick={() => setExpandedSections(prev => ({ ...prev, asignacion: !prev.asignacion }))}
                                    className="w-full px-4 py-3 flex justify-between items-center bg-gray-50 hover:bg-gray-100"
                                >
                                    <span className="font-medium">Asignación Familiar ({asignacionFamiliar.length} tramos)</span>
                                    <span>{expandedSections.asignacion ? "▼" : "▶"}</span>
                                </button>
                                {expandedSections.asignacion && (
                                    <div className="p-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-left text-gray-500">
                                                    <th className="pb-2">Tramo</th>
                                                    <th className="pb-2">Monto</th>
                                                    <th className="pb-2">Renta Desde</th>
                                                    <th className="pb-2">Renta Hasta</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {asignacionFamiliar.map((a, index) => (
                                                    <tr key={a.tramo}>
                                                        <td className="py-1 font-medium">{a.tramo}</td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                value={a.monto}
                                                                onChange={(e) => {
                                                                    const newData = [...asignacionFamiliar];
                                                                    newData[index].monto = parseFloat(e.target.value);
                                                                    setAsignacionFamiliar(newData);
                                                                }}
                                                                className="w-24 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-1">
                                                            <input
                                                                type="number"
                                                                value={a.rentaDesde}
                                                                onChange={(e) => {
                                                                    const newData = [...asignacionFamiliar];
                                                                    newData[index].rentaDesde = parseFloat(e.target.value);
                                                                    setAsignacionFamiliar(newData);
                                                                }}
                                                                className="w-28 border rounded px-2 py-1"
                                                            />
                                                        </td>
                                                        <td className="py-1">
                                                            {a.tramo !== "D" ? (
                                                                <input
                                                                    type="number"
                                                                    value={a.rentaHasta || 0}
                                                                    onChange={(e) => {
                                                                        const newData = [...asignacionFamiliar];
                                                                        newData[index].rentaHasta = parseFloat(e.target.value);
                                                                        setAsignacionFamiliar(newData);
                                                                    }}
                                                                    className="w-28 border rounded px-2 py-1"
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400">Sin límite</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal footer */}
                        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
