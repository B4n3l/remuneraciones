"use client";

import { DocumentDuplicateIcon, ArrowUpTrayIcon, ArrowDownTrayIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function DocumentosExtras({ worker }: { worker: any }) {
    // Filtrar documentos que no sean CONTRATO ni VACACIONES para esta pestaña, o mostrar todos
    const documentos = worker.documentos || [];

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Archivo de Documentos</h2>
                    <p className="text-sm text-slate-500">Historial completo de documentos generados y subidos.</p>
                </div>
                <div className="flex gap-2">
                    <button className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95">
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Subir Documento
                    </button>
                    <button className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all active:scale-95">
                        Generar Finiquito
                    </button>
                </div>
            </div>

            {documentos.length > 0 ? (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {documentos.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <DocumentTextIcon className="h-5 w-5 text-slate-400" />
                                            <span className="text-sm font-medium text-slate-900">{doc.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800 uppercase">
                                            {doc.tipo}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {format(new Date(doc.createdAt), "dd/MM/yyyy HH:mm")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1">
                                            <ArrowDownTrayIcon className="h-4 w-4" />
                                            Ver/Descargar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 py-12 text-center">
                    <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-slate-300" />
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No hay documentos</h3>
                    <p className="mt-1 text-sm text-slate-500">Los documentos que generes o subas aparecerán aquí.</p>
                </div>
            )}
        </div>
    );
}
