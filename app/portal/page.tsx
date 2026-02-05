"use client";

import { useState, useEffect } from "react";

interface Documento {
    id: string;
    nombre: string;
    descripcion: string | null;
    mimeType: string;
    tamanioBytes: number;
    periodo: string | null;
    createdAt: string;
    categoria: { id: string; nombre: string };
    empresa: { id: string; razonSocial: string };
}

interface Categoria {
    id: string;
    nombre: string;
}

export default function PortalPage() {
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriaFilter, setCategoriaFilter] = useState<string>("");
    const [downloading, setDownloading] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch categorias
                const catRes = await fetch("/api/categorias");
                if (catRes.ok) {
                    setCategorias(await catRes.json());
                }

                // Fetch documentos del cliente
                let url = "/api/documentos";
                if (categoriaFilter) {
                    url += `?categoriaId=${categoriaFilter}`;
                }
                const docsRes = await fetch(url);
                if (docsRes.ok) {
                    setDocumentos(await docsRes.json());
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoriaFilter]);

    const handleDownload = async (doc: Documento) => {
        setDownloading(doc.id);
        try {
            const res = await fetch(`/api/documentos/${doc.id}`);
            if (res.ok) {
                const data = await res.json();
                // Crear un link temporal para descargar
                const link = document.createElement("a");
                link.href = data.url;
                link.download = doc.nombre;
                link.target = "_blank";
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error("Error downloading:", error);
        } finally {
            setDownloading(null);
        }
    };

    const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
        return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    // Agrupar documentos por categoría
    const documentosPorCategoria = documentos.reduce((acc, doc) => {
        const catName = doc.categoria.nombre;
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(doc);
        return acc;
    }, {} as Record<string, Documento[]>);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Welcome card */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
                <h2 className="text-2xl font-bold mb-2">Bienvenido a tu Portal</h2>
                <p className="opacity-90">
                    Aquí encontrarás todos tus documentos contables organizados por categoría.
                    Puedes descargarlos cuando los necesites.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-blue-600">{documentos.length}</div>
                    <div className="text-gray-600">Documentos disponibles</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-green-600">
                        {Object.keys(documentosPorCategoria).length}
                    </div>
                    <div className="text-gray-600">Categorías</div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-3xl font-bold text-purple-600">
                        {documentos.length > 0 ? formatDate(documentos[0].createdAt) : "-"}
                    </div>
                    <div className="text-gray-600">Última actualización</div>
                </div>
            </div>

            {/* Filtro */}
            <div className="flex justify-end">
                <select
                    value={categoriaFilter}
                    onChange={(e) => setCategoriaFilter(e.target.value)}
                    className="border rounded-lg px-4 py-2 bg-white"
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Documentos */}
            {documentos.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <div className="text-6xl mb-4">📂</div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        No hay documentos disponibles
                    </h3>
                    <p className="text-gray-500">
                        Tu contador aún no ha subido documentos a tu portal.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(documentosPorCategoria).map(([categoria, docs]) => (
                        <div key={categoria} className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b">
                                <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                                    <span>📁</span> {categoria}
                                    <span className="text-sm font-normal text-gray-500">
                                        ({docs.length} documentos)
                                    </span>
                                </h3>
                            </div>
                            <div className="divide-y">
                                {docs.map((doc) => (
                                    <div
                                        key={doc.id}
                                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="text-3xl">
                                                {doc.mimeType.includes("pdf") ? "📄" : "📎"}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">{doc.nombre}</div>
                                                <div className="text-sm text-gray-500">
                                                    {doc.periodo && <span className="mr-3">📅 {doc.periodo}</span>}
                                                    {formatBytes(doc.tamanioBytes)} • {formatDate(doc.createdAt)}
                                                </div>
                                                {doc.descripcion && (
                                                    <div className="text-sm text-gray-600 mt-1">{doc.descripcion}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            disabled={downloading === doc.id}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {downloading === doc.id ? (
                                                <>
                                                    <span className="animate-spin">⏳</span>
                                                    Descargando...
                                                </>
                                            ) : (
                                                <>
                                                    <span>⬇️</span>
                                                    Descargar
                                                </>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
