"use client";

import { CalendarIcon, PlusIcon, ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function Vacaciones({ worker }: { worker: any }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        startDate: "",
        endDate: "",
        totalDays: 0
    });
    const router = useRouter();

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        try {
            const response = await fetch(`/api/workers/${worker.id}/documents/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    type: "VACACIONES",
                    ...formData
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al generar comprobante");
            }

            alert("Comprobante de vacaciones generado con éxito");
            setIsRegistering(false);
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleDownload = async (vacacionId: string) => {
        setDownloadingId(vacacionId);
        try {
            const response = await fetch(`/api/workers/${worker.id}/vacations/${vacacionId}/download`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al descargar comprobante");
            }

            const data = await response.json();
            window.open(data.url, "_blank");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDownloadingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Control de Vacaciones</h2>
                    <p className="text-sm text-slate-500">Gestión de días tomados y comprobantes.</p>
                </div>
                {!isRegistering && (
                    <button 
                        onClick={() => setIsRegistering(true)}
                        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Registrar Vacaciones
                    </button>
                )}
            </div>

            {isRegistering && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-blue-900">Nueva Solicitud de Vacaciones</h3>
                        <button onClick={() => setIsRegistering(false)} className="text-blue-500 hover:text-blue-700">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Fecha Inicio</label>
                            <input 
                                type="date" 
                                required
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                className="w-full rounded-lg border-blue-200 text-sm focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Fecha Término</label>
                            <input 
                                type="date" 
                                required
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                className="w-full rounded-lg border-blue-200 text-sm focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-blue-700 mb-1">Días Hábiles</label>
                            <input 
                                type="number" 
                                required
                                value={formData.totalDays}
                                onChange={(e) => setFormData({...formData, totalDays: parseInt(e.target.value)})}
                                className="w-full rounded-lg border-blue-200 text-sm focus:ring-blue-500 focus:border-blue-500" 
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={generating}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm h-[38px] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {generating ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                            {generating ? "Generando..." : "Generar Comprobante"}
                        </button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-100 flex gap-12">
                    <div>
                        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Días Tomados</div>
                        <div className="text-3xl font-bold text-slate-900">
                            {worker.vacaciones.reduce((acc: number, v: any) => acc + v.diasHabiles, 0).toFixed(1)}
                        </div>
                    </div>
                </div>
                
                {worker.vacaciones && worker.vacaciones.length > 0 ? (
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Periodo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Días</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {worker.vacaciones.map((vacacion: any) => (
                                <tr key={vacacion.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                                        {format(new Date(vacacion.fechaInicio), "dd/MM/yyyy")} - {format(new Date(vacacion.fechaFin), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {vacacion.diasHabiles} días
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {vacacion.comprobantePath && (
                                            <button
                                                onClick={() => handleDownload(vacacion.id)}
                                                disabled={downloadingId === vacacion.id}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {downloadingId === vacacion.id ? (
                                                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <ArrowDownTrayIcon className="h-4 w-4" />
                                                )}
                                                Comprobante
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-12">
                        <CalendarIcon className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">Sin historial de vacaciones</h3>
                        <p className="mt-1 text-sm text-slate-500">No se han registrado vacaciones para este trabajador.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
