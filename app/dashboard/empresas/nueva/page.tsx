"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRut, cleanRut, validateRut } from "@/lib/utils/rut";

export default function NuevaEmpresaPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        rut: "",
        razonSocial: "",
        direccion: "",
        comuna: "",
    });
    const [rutError, setRutError] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatRut(e.target.value);
        setFormData({
            ...formData,
            rut: formatted,
        });

        // Validate RUT if it's complete
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

    const handleRazonSocialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            razonSocial: e.target.value.toUpperCase(),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        // Validate RUT before submitting
        if (!validateRut(formData.rut)) {
            setError("El RUT ingresado no es válido");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/companies", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...formData,
                    rut: cleanRut(formData.rut), // Store without formatting
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Error al crear la empresa");
                return;
            }

            router.push("/dashboard/empresas");
            router.refresh();
        } catch (error) {
            setError("Error al crear la empresa");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Nueva Empresa</h1>
                <p className="mt-2 text-sm text-gray-600">
                    Ingresa los datos de la empresa
                </p>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                            {error}
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="rut"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            RUT
                        </label>
                        <input
                            id="rut"
                            name="rut"
                            type="text"
                            required
                            value={formData.rut}
                            onChange={handleRutChange}
                            placeholder="76.xxx.xxx-x"
                            maxLength={12}
                            className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${rutError ? "border-red-500" : "border-gray-300"
                                }`}
                        />
                        {rutError && (
                            <p className="mt-1 text-sm text-red-600">{rutError}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Ingresa el RUT sin puntos ni guión, se formateará automáticamente
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="razonSocial"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Razón Social
                        </label>
                        <input
                            id="razonSocial"
                            name="razonSocial"
                            type="text"
                            required
                            value={formData.razonSocial}
                            onChange={handleRazonSocialChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                            placeholder="EMPRESA S.A."
                        />
                        <p className="mt-1 text-xs text-gray-500">
                            Se convertirá automáticamente a mayúsculas
                        </p>
                    </div>

                    <div>
                        <label
                            htmlFor="direccion"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Dirección
                        </label>
                        <input
                            id="direccion"
                            name="direccion"
                            type="text"
                            required
                            value={formData.direccion}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Calle 123"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="comuna"
                            className="block text-sm font-medium text-gray-700 mb-2"
                        >
                            Comuna
                        </label>
                        <input
                            id="comuna"
                            name="comuna"
                            type="text"
                            required
                            value={formData.comuna}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Santiago"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || !!rutError}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creando..." : "Crear Empresa"}
                        </button>
                        <Link
                            href="/dashboard/empresas"
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition-colors text-center"
                        >
                            Cancelar
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
