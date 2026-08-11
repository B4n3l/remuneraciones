"use client";

import { DocumentTextIcon, PlusIcon, ArrowDownTrayIcon, ArrowPathIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Contratos({ worker }: { worker: any }) {
    const [generating, setGenerating] = useState(false);
    const [generatingAnexo, setGeneratingAnexo] = useState(false);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [isAnexoModalOpen, setIsAnexoModalOpen] = useState(false);
    const [anexoForm, setAnexoForm] = useState({
        cambioCargo: "",
        nuevoSueldo: "",
        cambioJornada: "",
        otros: "",
        fechaEfectiva: ""
    });
    const router = useRouter();

    // PDF de contrato más reciente (los documentos vienen ordenados por createdAt desc)
    const contratoDoc = (worker.documentos || []).find((doc: any) => doc.tipo === "CONTRATO");
    const anexosDocs = (worker.documentos || []).filter((doc: any) => doc.tipo === "ANEXO");

    const handleDownload = async (docId: string) => {
        setDownloadingId(docId);
        try {
            const response = await fetch(`/api/workers/${worker.id}/documents/${docId}/download`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al descargar documento");
            }

            const data = await response.json();
            window.open(data.url, "_blank");
        } catch (error: any) {
            alert(error.message);
        } finally {
            setDownloadingId(null);
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

    const handleGenerateAnexo = async (e: React.FormEvent) => {
        e.preventDefault();
        setGeneratingAnexo(true);
        try {
            const payload: any = {
                type: "ANEXO",
                fechaEfectiva: anexoForm.fechaEfectiva,
            };
            if (anexoForm.cambioCargo.trim()) payload.cambioCargo = anexoForm.cambioCargo.trim();
            if (anexoForm.nuevoSueldo.trim()) payload.nuevoSueldo = Number(anexoForm.nuevoSueldo.trim());
            if (anexoForm.cambioJornada.trim()) payload.cambioJornada = anexoForm.cambioJornada.trim();
            if (anexoForm.otros.trim()) payload.otros = anexoForm.otros.trim();

            const response = await fetch(`/api/workers/${worker.id}/documents/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Error al generar anexo");
            }

            alert("Anexo generado y archivado con éxito");
            setIsAnexoModalOpen(false);
            setAnexoForm({ cambioCargo: "", nuevoSueldo: "", cambioJornada: "", otros: "", fechaEfectiva: "" });
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setGeneratingAnexo(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Contratos del Trabajador</h2>
                    <p className="text-sm text-slate-500">Gestión de contratos laborales y anexos.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsAnexoModalOpen(true)}
                        className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Generar Anexo
                    </button>
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
            </div>

            {/* Modal Anexo */}
            {isAnexoModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <h3 className="font-semibold text-slate-900">Generar Anexo de Contrato</h3>
                            <button onClick={() => setIsAnexoModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>
                        <form onSubmit={handleGenerateAnexo} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Cambio de cargo</label>
                                <input
                                    type="text"
                                    value={anexoForm.cambioCargo}
                                    onChange={(e) => setAnexoForm({ ...anexoForm, cambioCargo: e.target.value })}
                                    placeholder="Ej: Gerente de Operaciones"
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Nuevo sueldo</label>
                                <input
                                    type="number"
                                    value={anexoForm.nuevoSueldo}
                                    onChange={(e) => setAnexoForm({ ...anexoForm, nuevoSueldo: e.target.value })}
                                    placeholder="Ej: 850000"
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Cambio de jornada/horario</label>
                                <input
                                    type="text"
                                    value={anexoForm.cambioJornada}
                                    onChange={(e) => setAnexoForm({ ...anexoForm, cambioJornada: e.target.value })}
                                    placeholder="Ej: Part-time, lunes a viernes 09:00-14:00"
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Otros</label>
                                <textarea
                                    value={anexoForm.otros}
                                    onChange={(e) => setAnexoForm({ ...anexoForm, otros: e.target.value })}
                                    placeholder="Cualquier otra modificación..."
                                    rows={3}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha efectiva <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    value={anexoForm.fechaEfectiva}
                                    onChange={(e) => setAnexoForm({ ...anexoForm, fechaEfectiva: e.target.value })}
                                    className="w-full rounded-lg border-slate-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAnexoModalOpen(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 border border-slate-200"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={generatingAnexo}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                    {generatingAnexo ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PlusIcon className="h-4 w-4" />}
                                    {generatingAnexo ? "Generando..." : "Generar Anexo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

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
                                            onClick={() => contratoDoc && handleDownload(contratoDoc.id)}
                                            disabled={!contratoDoc || downloadingId === contratoDoc?.id}
                                            title={!contratoDoc ? "Genera el contrato primero para poder descargarlo" : undefined}
                                            className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            {downloadingId === contratoDoc?.id ? (
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

            {/* Anexos Section */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-3">Anexos de Contrato</h3>
                {anexosDocs.length > 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                                {anexosDocs.map((doc: any) => (
                                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                            {doc.nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm")}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleDownload(doc.id)}
                                                disabled={downloadingId === doc.id}
                                                className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1.5 disabled:opacity-50"
                                            >
                                                {downloadingId === doc.id ? (
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
                    <div className="text-center py-8 bg-white rounded-xl border-2 border-dashed border-slate-200">
                        <DocumentTextIcon className="mx-auto h-10 w-10 text-slate-300" />
                        <h3 className="mt-2 text-sm font-medium text-slate-900">Sin anexos registrados</h3>
                        <p className="mt-1 text-sm text-slate-500">Genera un anexo cuando necesites modificar el contrato vigente.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
