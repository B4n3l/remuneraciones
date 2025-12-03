"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRut, cleanRut, validateRut } from "@/lib/utils/rut";
import { use } from "react";

export default function EditarTrabajadorPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [afps, setAfps] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        nombres: "",
        apellidoPaterno: "",
        apellidoMaterno: "",
        rut: "",
        cargo: "",
        fechaIngreso: "",
        tipoContrato: "INDEFINIDO",
        sueldoBase: "",
        tipoGratificacion: "LEGAL_25",
        gratificacionPactada: "",
        afpId: "",
        tipoSalud: "FONASA",
        isapre: "",
        planUF: "",
    });

    const [rutError, setRutError] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const [workerRes, afpsRes] = await Promise.all([
                    fetch(`/api/workers/${resolvedParams.id}`),
                    fetch("/api/config/afp"),
                ]);

                if (workerRes.ok) {
                    const worker = await workerRes.json();
                    setFormData({
                        nombres: worker.nombres,
                        apellidoPaterno: worker.apellidoPaterno,
                        apellidoMaterno: worker.apellidoMaterno,
                        rut: formatRut(worker.rut),
                        cargo: worker.cargo,
                        fechaIngreso: new Date(worker.fechaIngreso).toISOString().split('T')[0],
                        tipoContrato: worker.tipoContrato,
                        sueldoBase: worker.sueldoBase.toString(),
                        tipoGratificacion: worker.tipoGratificacion,
                        gratificacionPactada: worker.gratificacionPactada?.toString() || "",
                        afpId: worker.afpId,
                        tipoSalud: worker.tipoSalud,
                        isapre: worker.healthPlan?.isapre || "",
                        planUF: worker.healthPlan?.planUF?.toString() || "",
                    });
                } else {
                    setError("Error al cargar el trabajador");
                }

                if (afpsRes.ok) {
                    const afpsData = await afpsRes.json();
                    setAfps(afpsData);
                }
            } catch (err) {
                setError("Error al cargar los datos");
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [resolvedParams.id]);

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRut(e.target.value);
        setFormData({ ...formData, rut: formatted });

        if (formatted.length >= 9) {
            if (validateRut(formatted)) {
                setRutError("");
            } else {
                setRutError("RUT inválido");
            }
        } else {
            setRutError("");
        }
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!validateRut(formData.rut)) {
            setError("El RUT ingresado no es válido");
            return;
        }

        setIsSubmitting(true);

        try {
            const payload: any = {
                nombres: formData.nombres.toUpperCase(),
                apellidoPaterno: formData.apellidoPaterno.toUpperCase(),
                apellidoMaterno: formData.apellidoMaterno.toUpperCase(),
                cargo: formData.cargo,
                fechaIngreso: new Date(formData.fechaIngreso).toISOString(),
                tipoContrato: formData.tipoContrato,
                sueldoBase: parseFloat(formData.sueldoBase),
                tipoGratificacion: formData.tipoGratificacion,
                afpId: formData.afpId,
                tipoSalud: formData.tipoSalud,
            };

            if (formData.tipoGratificacion === "PACTADA" && formData.gratificacionPactada) {
                payload.gratificacionPactada = parseFloat(formData.gratificacionPactada);
            }

            if (formData.tipoSalud === "ISAPRE") {
                payload.healthPlan = {
                    isapre: formData.isapre,
                    planUF: parseFloat(formData.planUF),
                };
            }

            const response = await fetch(`/api/workers/${resolvedParams.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Error al actualizar el trabajador");
                return;
            }

            router.push("/dashboard/trabajadores");
            router.refresh();
        } catch (err) {
            setError("Error al actualizar el trabajador");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <p className="text-gray-600">Cargando...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar Trabajador</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Actualiza los datos del trabajador
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                        {error}
                    </div>
                )}

                {/* Datos Personales */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Datos Personales</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Nombres *</label>
                            <input
                                type="text"
                                name="nombres"
                                required
                                value={formData.nombres}
                                onChange={(e) =>
                                    setFormData({ ...formData, nombres: e.target.value.toUpperCase() })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Apellido Paterno *</label>
                            <input
                                type="text"
                                name="apellidoPaterno"
                                required
                                value={formData.apellidoPaterno}
                                onChange={(e) =>
                                    setFormData({ ...formData, apellidoPaterno: e.target.value.toUpperCase() })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Apellido Materno *</label>
                            <input
                                type="text"
                                name="apellidoMaterno"
                                required
                                value={formData.apellidoMaterno}
                                onChange={(e) =>
                                    setFormData({ ...formData, apellidoMaterno: e.target.value.toUpperCase() })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md uppercase"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">RUT *</label>
                            <input
                                type="text"
                                required
                                disabled
                                value={formData.rut}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
                                placeholder="12.345.678-9"
                            />
                            <p className="mt-1 text-xs text-gray-500">El RUT no se puede modificar</p>
                        </div>
                    </div>
                </div>

                {/* Datos Laborales */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Datos Laborales</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Cargo *</label>
                            <input
                                type="text"
                                name="cargo"
                                required
                                value={formData.cargo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Fecha Ingreso *</label>
                            <input
                                type="date"
                                name="fechaIngreso"
                                required
                                value={formData.fechaIngreso}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Tipo de Contrato *</label>
                            <select
                                name="tipoContrato"
                                required
                                value={formData.tipoContrato}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="INDEFINIDO">Indefinido</option>
                                <option value="PLAZO_FIJO">Plazo Fijo</option>
                                <option value="OBRA">Por Obra</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Remuneración */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Remuneración</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Sueldo Base (CLP) *</label>
                            <input
                                type="number"
                                name="sueldoBase"
                                required
                                min="0"
                                value={formData.sueldoBase}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Gratificación *</label>
                            <select
                                name="tipoGratificacion"
                                required
                                value={formData.tipoGratificacion}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="LEGAL_25">Legal 25%</option>
                                <option value="PACTADA">Pactada</option>
                            </select>
                        </div>
                        {formData.tipoGratificacion === "PACTADA" && (
                            <div className="col-span-2">
                                <label className="block text-sm font-medium mb-2">Monto Gratificación (CLP)</label>
                                <input
                                    type="number"
                                    name="gratificacionPactada"
                                    min="0"
                                    value={formData.gratificacionPactada}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Previsión */}
                <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Previsión y Salud</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">AFP *</label>
                            <select
                                name="afpId"
                                required
                                value={formData.afpId}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">Seleccionar AFP</option>
                                {afps.map((afp) => (
                                    <option key={afp.id} value={afp.id}>
                                        {afp.nombre} - {afp.porcentaje}%
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-2">Tipo de Salud *</label>
                            <select
                                name="tipoSalud"
                                required
                                value={formData.tipoSalud}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="FONASA">Fonasa (7%)</option>
                                <option value="ISAPRE">Isapre (7% + adicional)</option>
                            </select>
                        </div>
                        {formData.tipoSalud === "ISAPRE" && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Nombre Isapre</label>
                                    <input
                                        type="text"
                                        name="isapre"
                                        value={formData.isapre}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Valor Adicional (UF)</label>
                                    <input
                                        type="number"
                                        name="planUF"
                                        min="0"
                                        step="0.01"
                                        value={formData.planUF}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md disabled:opacity-50"
                    >
                        {isSubmitting ? "Actualizando..." : "Actualizar Trabajador"}
                    </button>
                    <Link
                        href="/dashboard/trabajadores"
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-md text-center"
                    >
                        Cancelar
                    </Link>
                </div>
            </form>
        </div>
    );
}
