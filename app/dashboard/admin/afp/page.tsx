"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface AFP {
    id: string;
    nombre: string;
    porcentaje: number;
    comision: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function AdminAfpPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [afps, setAfps] = useState<AFP[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingAfp, setEditingAfp] = useState<AFP | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nombre: "",
        porcentaje: "",
        comision: "",
    });

    useEffect(() => {
        if (status === "authenticated") {
            if (session?.user?.role !== "SUPER_ADMIN") {
                router.push("/dashboard");
                return;
            }
            fetchAfps();
        }
    }, [status, session, router]);

    const fetchAfps = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/afp");
            if (res.ok) {
                const data = await res.json();
                setAfps(data);
            } else {
                setError("Error al cargar AFPs");
            }
        } catch (err) {
            console.error("Error fetching AFPs:", err);
            setError("Error al cargar AFPs");
        } finally {
            setLoading(false);
        }
    };

    const openNew = () => {
        setEditingAfp(null);
        setFormData({ nombre: "", porcentaje: "", comision: "" });
        setError(null);
        setShowModal(true);
    };

    const openEdit = (afp: AFP) => {
        setEditingAfp(afp);
        setFormData({
            nombre: afp.nombre,
            porcentaje: String(afp.porcentaje),
            comision: String(afp.comision),
        });
        setError(null);
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        const payload = {
            nombre: formData.nombre.trim(),
            porcentaje: parseFloat(formData.porcentaje),
            comision: parseFloat(formData.comision),
        };

        const url = editingAfp ? `/api/admin/afp/${editingAfp.id}` : "/api/admin/afp";
        const method = editingAfp ? "PUT" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowModal(false);
                await fetchAfps();
            } else {
                const data = await res.json().catch(() => ({}));
                if (Array.isArray(data.details)) {
                    const messages = data.details.map((err: any) => `${err.path.join(".")}: ${err.message}`).join("\n");
                    setError(`Errores de validación:\n${messages}`);
                } else {
                    setError(data.error || "Error al guardar AFP");
                }
            }
        } catch (err) {
            console.error("Error saving AFP:", err);
            setError("Error al guardar AFP");
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (afp: AFP) => {
        const nextActive = !afp.isActive;
        if (!confirm(nextActive ? "¿Reactivar esta AFP?" : "¿Desactivar esta AFP?")) return;

        try {
            const res = await fetch(`/api/admin/afp/${afp.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: nextActive }),
            });
            if (res.ok) {
                await fetchAfps();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Error al actualizar estado");
            }
        } catch (err) {
            console.error("Error toggling AFP:", err);
            alert("Error al actualizar estado");
        }
    };

    const handleDelete = async (afp: AFP) => {
        if (!confirm("¿Desactivar esta AFP? Los trabajadores asociados seguirán referenciándola.")) return;
        try {
            const res = await fetch(`/api/admin/afp/${afp.id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchAfps();
            } else {
                const data = await res.json().catch(() => ({}));
                alert(data.error || "Error al desactivar AFP");
            }
        } catch (err) {
            console.error("Error deleting AFP:", err);
            alert("Error al desactivar AFP");
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AFPs</h1>
                    <p className="text-gray-600">Administra las AFPs y sus tasas</p>
                </div>
                <button
                    onClick={openNew}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>+</span> Nueva AFP
                </button>
            </div>

            {error && !showModal && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-line">
                    {error}
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Porcentaje</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comisión</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {afps.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No hay AFPs registradas
                                </td>
                            </tr>
                        ) : (
                            afps.map((afp) => (
                                <tr key={afp.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                        {afp.nombre}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {Number(afp.porcentaje).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                                        {Number(afp.comision).toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                afp.isActive
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-red-100 text-red-800"
                                            }`}
                                        >
                                            {afp.isActive ? "Activa" : "Inactiva"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => openEdit(afp)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleToggleActive(afp)}
                                            className={`${
                                                afp.isActive
                                                    ? "text-red-600 hover:text-red-800"
                                                    : "text-green-600 hover:text-green-800"
                                            }`}
                                        >
                                            {afp.isActive ? "Desactivar" : "Reactivar"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingAfp ? "Editar AFP" : "Nueva AFP"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && showModal && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-line">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    className="w-full border rounded-lg px-3 py-2 text-gray-900"
                                    placeholder="Ej: AFP Capital"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Porcentaje (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.porcentaje}
                                        onChange={(e) =>
                                            setFormData({ ...formData, porcentaje: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Comisión (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.comision}
                                        onChange={(e) =>
                                            setFormData({ ...formData, comision: e.target.value })
                                        }
                                        className="w-full border rounded-lg px-3 py-2 text-gray-900"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
