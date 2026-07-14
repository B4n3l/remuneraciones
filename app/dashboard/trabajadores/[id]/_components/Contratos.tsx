"use client";

import { DocumentTextIcon, PlusIcon, ArrowDownTrayIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Contratos({ worker }: { worker: any }) {
    const [generating, setGenerating] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const router = useRouter();

    // PDF de contrato más reciente (los documentos vienen ordenados por createdAt desc)
    const contratoDoc = (worker.documentos || []).find((doc: any) => doc.tipo === "CONTRATO");

    const handleDownload = async () => {
        if (!contratoDoc) return;
        setDownloading(true);
        try {
            const response = await fetch(`/api/workers/${worker.id}/documents/${contratoDoc.id}/download`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al descargar contrato");
            }

            const data = await response.json();
            window.open(data.url, "_blank");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDownloading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const response = await fetch(`/api/workers/${worker.id}/documents/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "CONTRATO" })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al generar contrato");
            }

            alert("Contrato generado y archivado con éxito");
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Contratos del Trabajador</h2>
                    <p className="text-sm text-slate-500">Gestión de contratos laborales y anexos.</p>
                </div>
                <button 
                    onClick={handleGenerate}
                    disabled={generating}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                    {generating ? (
                        <ArrowPathIcon className="h-5 w-5 animate-spin" />
                    ) : (
                        <PlusIcon className="h-5 w-5" />
                    )}
                    {generating ? "Generando..." : "Generar Contrato"}
                </button>
            </div>

            {worker.contracts && worker.contracts.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {worker.contracts.map((contract: any) => (
                                <tr key={contract.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                <DocumentTextIcon className="h-5 w-5" />
                                            </div>
                                            <div className="text-sm font-medium text-slate-900">{contract.type}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        {format(new Date(contract.startDate), "PPP", { locale: es })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Vigente
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={handleDownload}
                                            disabled={!contratoDoc || downloading}
                                            title={!contratoDoc ? "Genera el contrato primero para poder descargarlo" : undefined}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {downloading ? (
                                                <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ArrowDownTrayIcon className="h-4 w-4" />
                                            )}
                                            Descargar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <DocumentTextIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No hay contratos registrados</h3>
                    <p className="mt-1 text-sm text-slate-500">Comienza generando el primer contrato laboral.</p>
                </div>
            )}
        </div>
    );
}
