"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Documento {
    id: string;
    nombre: string;
    descripcion: string | null;
    mimeType: string;
    tamanioBytes: number;
    periodo: string | null;
    createdAt: string;
    categoria: { id: string; nombre: string };
    subidoPor: { name: string; email: string };
}

interface Categoria {
    id: string;
    nombre: string;
}

interface Empresa {
    id: string;
    razonSocial: string;
    rut: string;
}

export default function DocumentosEmpresaPage() {
    const params = useParams();
    const empresaId = params.id as string;

    const [empresa, setEmpresa] = useState<Empresa | null>(null);
    const [documentos, setDocumentos] = useState<Documento[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [categoriaFilter, setCategoriaFilter] = useState<string>("");

    // Form state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        nombre: "",
        descripcion: "",
        categoriaId: "",
        periodo: "",
    });

    const fetchDocumentos = useCallback(async () => {
        try {
            let url = `/api/documentos?empresaId=${empresaId}`;
            if (categoriaFilter) {
                url += `&categoriaId=${categoriaFilter}`;
            }
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setDocumentos(data);
            }
        } catch (error) {
            console.error("Error fetching documentos:", error);
        }
    }, [empresaId, categoriaFilter]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch empresa
                const empresaRes = await fetch(`/api/companies/${empresaId}`);
                if (empresaRes.ok) {
                    setEmpresa(await empresaRes.json());
                }

                // Fetch categorias
                const catRes = await fetch("/api/categorias");
                if (catRes.ok) {
                    setCategorias(await catRes.json());
                }

                // Fetch documentos
                await fetchDocumentos();
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [empresaId, fetchDocumentos]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            if (!formData.nombre) {
                setFormData({ ...formData, nombre: file.name });
            }
        }
    };

    const handleUpload = async () => {
        if (!selectedFile || !formData.categoriaId) {
            alert("Seleccione un archivo y categoría");
            return;
        }

        setUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append("file", selectedFile);
            uploadData.append("empresaId", empresaId);
            uploadData.append("categoriaId", formData.categoriaId);
            uploadData.append("nombre", formData.nombre || selectedFile.name);
            uploadData.append("descripcion", formData.descripcion);
            uploadData.append("periodo", formData.periodo);

            const res = await fetch("/api/documentos", {
                method: "POST",
                body: uploadData,
            });

            if (res.ok) {
                setShowModal(false);
                setSelectedFile(null);
                setFormData({ nombre: "", descripcion: "", categoriaId: "", periodo: "" });
                await fetchDocumentos();
            } else {
                const error = await res.json();
                alert(error.error || "Error al subir documento");
            }
        } catch (error) {
            console.error("Error uploading:", error);
            alert("Error al subir documento");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (doc: Documento) => {
        try {
            const res = await fetch(`/api/documentos/${doc.id}`);
            if (res.ok) {
                const data = await res.json();
                window.open(data.url, "_blank");
            }
        } catch (error) {
            console.error("Error downloading:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este documento?")) return;

        try {
            const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchDocumentos();
            }
        } catch (error) {
            console.error("Error deleting:", error);
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
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Link href={`/dashboard/empresas/${empresaId}`} className="text-blue-600 hover:underline mb-2 inline-block">
                    ← Volver a empresa
                </Link>
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
                        <p className="text-gray-600">{empresa?.razonSocial}</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <span>📤</span> Subir Documento
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="mb-6 flex gap-4">
                <select
                    value={categoriaFilter}
                    onChange={(e) => setCategoriaFilter(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Lista de documentos */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Documento</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tamaño</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {documentos.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No hay documentos. Sube el primero!
                                </td>
                            </tr>
                        ) : (
                            documentos.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">
                                                {doc.mimeType.includes("pdf") ? "📄" : "📎"}
                                            </span>
                                            <div>
                                                <div className="font-medium text-gray-900">{doc.nombre}</div>
                                                {doc.descripcion && (
                                                    <div className="text-sm text-gray-500">{doc.descripcion}</div>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                                            {doc.categoria.nombre}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{doc.periodo || "-"}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatBytes(doc.tamanioBytes)}</td>
                                    <td className="px-6 py-4 text-gray-600">{formatDate(doc.createdAt)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="text-blue-600 hover:text-blue-800 mr-3"
                                        >
                                            Descargar
                                        </button>
                                        <button
                                            onClick={() => handleDelete(doc.id)}
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

            {/* Modal de subida */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Subir Documento</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* File input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Archivo *
                                </label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                                    onChange={handleFileChange}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                                {selectedFile && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        {selectedFile.name} ({formatBytes(selectedFile.size)})
                                    </p>
                                )}
                            </div>

                            {/* Categoría */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría *
                                </label>
                                <select
                                    value={formData.categoriaId}
                                    onChange={(e) => setFormData({ ...formData, categoriaId: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categorias.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre del documento
                                </label>
                                <input
                                    type="text"
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Ej: Liquidación Enero 2026"
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Período */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Período (opcional)
                                </label>
                                <input
                                    type="month"
                                    value={formData.periodo}
                                    onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    rows={2}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !selectedFile || !formData.categoriaId}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {uploading ? "Subiendo..." : "Subir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
