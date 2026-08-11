"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const MONTHS = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface ConfigData {
    valorUF: number;
    valorUTM: number;
    sueldoMinimo: number;
    year: number;
    month: number;
}

export default function AdminConfigPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [form, setForm] = useState({ valorUF: "", valorUTM: "", sueldoMinimo: "" });

    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/config");
            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                if (data) {
                    setForm({
                        valorUF: String(data.valorUF),
                        valorUTM: String(data.valorUTM),
                        sueldoMinimo: String(data.sueldoMinimo),
                    });
                }
            }
        } catch {
            setError("Error al cargar configuración");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "SUPER_ADMIN") {
                router.push("/dashboard");
                return;
            }
            fetchConfig();
        }
    }, [status, session, router, fetchConfig]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await fetch("/api/admin/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    valorUF: parseFloat(form.valorUF),
                    valorUTM: parseFloat(form.valorUTM),
                    sueldoMinimo: parseFloat(form.sueldoMinimo),
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setConfig(data);
                setSuccess("Valores actualizados correctamente");
                setTimeout(() => setSuccess(null), 4000);
            } else {
                const data = await res.json().catch(() => ({}));
                if (Array.isArray(data.details)) {
                    setError(data.details.map((d: { message: string }) => d.message).join(", "));
                } else {
                    setError(data.error || "Error al guardar");
                }
            }
        } catch {
            setError("Error al guardar configuración");
        } finally {
            setSaving(false);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const periodLabel = config
        ? `${MONTHS[config.month - 1]} ${config.year}`
        : "Sin datos";

    return (
        <div className="p-6 max-w-xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
                <p className="text-gray-600">Valores del sistema: UF, UTM y Sueldo Mínimo</p>
            </div>

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Período de referencia</span>
                    <span className="font-medium text-gray-900">{periodLabel}</span>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        UF
                    </label>
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={form.valorUF}
                        onChange={(e) => setForm({ ...form, valorUF: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                        placeholder="Ej: 38754.12"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        UTM
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.valorUTM}
                        onChange={(e) => setForm({ ...form, valorUTM: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                        placeholder="Ej: 65342"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sueldo Mínimo (CLP)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.sueldoMinimo}
                        onChange={(e) => setForm({ ...form, sueldoMinimo: e.target.value })}
                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                        placeholder="Ej: 500000"
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                    {saving ? "Guardando..." : "Guardar"}
                </button>
            </div>
        </div>
    );
}
