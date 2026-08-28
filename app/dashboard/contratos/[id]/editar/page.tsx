"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const contractSchema = z.object({
    companyId: z.string().min(1, "Seleccione una empresa"),
    workerId: z.string().min(1, "Seleccione un trabajador"),
    type: z.enum(["INDEFINIDO", "PLAZO_FIJO", "OBRA_FAENA"]),
    startDate: z.string().min(1, "Fecha de inicio requerida"),
    endDate: z.string().optional(),
    cargo: z.string().min(1, "Cargo requerido"),
    jornada: z.string().min(1, "Jornada requerida"),
    schedule: z.string().min(1, "Horario requerido"),
    workplace: z.string().min(1, "Lugar de trabajo requerido"),
    baseSalary: z.number().positive("Sueldo debe ser positivo"),
    benefits: z.string().optional(),
    obraDetails: z.string().optional(),
    // Detalles de pago y colación
    formaPago: z.string().optional(),
    periodicidad: z.string().optional(),
    minutosColacion: z.number().int().positive().optional(),
    comunaTrabajo: z.string().optional(),
    legalRep: z.string().min(1, "Representante legal requerido"),
    legalRepRut: z.string().min(1, "RUT del representante requerido"),
});

type ContractForm = z.infer<typeof contractSchema>;

interface Company {
    id: string;
    razonSocial: string;
    rut: string;
    legalRep?: string | null;
    legalRepRut?: string | null;
}

interface Worker {
    id: string;
    nombres: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    rut: string;
    cargo: string;
    sueldoBase: number;
}

export default function EditContractPage() {
    const router = useRouter();
    const params = useParams();
    const contractId = params.id as string;

    const [companies, setCompanies] = useState<Company[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [notFound, setNotFound] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors },
    } = useForm<ContractForm>({
        resolver: zodResolver(contractSchema),
        defaultValues: {
            formaPago: "Transferencia bancaria",
            periodicidad: "Mensualmente",
            minutosColacion: 30,
        },
    });

    const selectedType = watch("type");
    const selectedCompanyId = watch("companyId");
    const selectedWorkerId = watch("workerId");

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const response = await fetch(`/api/contracts/${contractId}`);
                if (response.status === 404) {
                    setNotFound(true);
                    return;
                }
                if (!response.ok) {
                    console.error("Error fetching contract:", response.status);
                    setNotFound(true);
                    return;
                }
                const data = await response.json();
                reset({
                    companyId: data.companyId,
                    workerId: data.workerId,
                    type: data.type,
                    startDate: data.startDate.slice(0, 10),
                    endDate: data.endDate ? data.endDate.slice(0, 10) : "",
                    cargo: data.cargo,
                    jornada: data.jornada,
                    schedule: data.schedule,
                    workplace: data.workplace,
                    baseSalary: Number(data.baseSalary),
                    benefits: data.benefits || "",
                    obraDetails: data.obraDetails || "",
                    formaPago: data.formaPago || "",
                    periodicidad: data.periodicidad || "",
                    minutosColacion: data.minutosColacion ?? 30,
                    comunaTrabajo: data.comunaTrabajo || "",
                    legalRep: data.legalRep,
                    legalRepRut: data.legalRepRut,
                });
                if (data.companyId) {
                    fetchWorkers(data.companyId);
                }
            } catch (error) {
                console.error("Error fetching contract:", error);
                setNotFound(true);
            } finally {
                setLoadingData(false);
            }
        };
        fetchContract();
    }, [contractId]);

    useEffect(() => {
        if (selectedCompanyId) {
            fetchWorkers(selectedCompanyId);
            const company = companies.find((c) => c.id === selectedCompanyId);
            setSelectedCompany(company || null);
            if (company?.legalRep) setValue("legalRep", company.legalRep);
            if (company?.legalRepRut) setValue("legalRepRut", company.legalRepRut);
        }
    }, [selectedCompanyId, companies]);

    useEffect(() => {
        if (selectedWorkerId) {
            const worker = workers.find((w) => w.id === selectedWorkerId);
            if (worker) {
                setValue("cargo", worker.cargo);
                setValue("baseSalary", Number(worker.sueldoBase));
            }
        }
    }, [selectedWorkerId, workers]);

    const fetchCompanies = async () => {
        try {
            const response = await fetch("/api/companies");
            if (response.ok) {
                const data = await response.json();
                setCompanies(data);
            }
        } catch (error) {
            console.error("Error fetching companies:", error);
        }
    };

    const fetchWorkers = async (companyId: string) => {
        try {
            const response = await fetch(`/api/workers?companyId=${companyId}`);
            if (response.ok) {
                const data = await response.json();
                setWorkers(data);
            }
        } catch (error) {
            console.error("Error fetching workers:", error);
        }
    };

    const onSubmit = async (data: ContractForm) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/contracts/${contractId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                router.push("/dashboard/contratos");
            } else {
                const error = await response.json();
                alert(`Error: ${error.error || "No se pudo actualizar el contrato"}`);
            }
        } catch (error) {
            console.error("Error updating contract:", error);
            alert("Error al actualizar el contrato");
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-gray-600">Cargando contrato...</div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Contrato no encontrado</h1>
                    <p className="text-gray-600 mt-2">
                        El contrato que intenta editar no existe o no tiene acceso a él.
                    </p>
                    <Link
                        href="/dashboard/contratos"
                        className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                    >
                        Volver a Contratos
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Editar Contrato de Trabajo</h1>
                <p className="text-gray-600 mt-1">Modifique la información del contrato</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
                {/* Step 1: Type */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">1. Tipo de Contrato</h2>
                    <div className="grid grid-cols-3 gap-4">
                        {["INDEFINIDO", "PLAZO_FIJO", "OBRA_FAENA"].map((type) => (
                            <label
                                key={type}
                                className={`relative flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${selectedType === type
                                        ? "border-blue-600 bg-blue-50"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                            >
                                <input
                                    type="radio"
                                    value={type}
                                    {...register("type")}
                                    className="sr-only"
                                />
                                <span className="font-medium">
                                    {type === "INDEFINIDO" && "Indefinido"}
                                    {type === "PLAZO_FIJO" && "Plazo Fijo"}
                                    {type === "OBRA_FAENA" && "Obra/Faena"}
                                </span>
                            </label>
                        ))}
                    </div>
                    {errors.type && <p className="text-red-600 text-sm mt-1">{errors.type.message}</p>}
                </div>

                {/* Step 2: Company & Worker */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">2. Empresa y Trabajador</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Empresa
                            </label>
                            <select
                                {...register("companyId")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccione empresa</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.razonSocial}
                                    </option>
                                ))}
                            </select>
                            {errors.companyId && (
                                <p className="text-red-600 text-sm mt-1">{errors.companyId.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Trabajador
                            </label>
                            <select
                                {...register("workerId")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={!selectedCompanyId}
                            >
                                <option value="">Seleccione trabajador</option>
                                {workers.map((worker) => (
                                    <option key={worker.id} value={worker.id}>
                                        {worker.nombres} {worker.apellidoPaterno} - {worker.rut}
                                    </option>
                                ))}
                            </select>
                            {errors.workerId && (
                                <p className="text-red-600 text-sm mt-1">{errors.workerId.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Step 3: Dates */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">3. Fechas</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fecha de Inicio
                            </label>
                            <input
                                type="date"
                                {...register("startDate")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.startDate && (
                                <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
                            )}
                        </div>

                        {selectedType === "PLAZO_FIJO" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fecha de Término
                                </label>
                                <input
                                    type="date"
                                    {...register("endDate")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {errors.endDate && (
                                    <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 4: Job Details */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">4. Detalles del Cargo</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                            <input
                                type="text"
                                {...register("cargo")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Contador Senior"
                            />
                            {errors.cargo && (
                                <p className="text-red-600 text-sm mt-1">{errors.cargo.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
                                <select
                                    {...register("jornada")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Completa">Completa</option>
                                    <option value="Parcial">Parcial</option>
                                    <option value="Part-time">Part-time</option>
                                </select>
                                {errors.jornada && (
                                    <p className="text-red-600 text-sm mt-1">{errors.jornada.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horario</label>
                                <input
                                    type="text"
                                    {...register("schedule")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Lunes a Viernes, 9:00 a 18:00"
                                />
                                {errors.schedule && (
                                    <p className="text-red-600 text-sm mt-1">{errors.schedule.message}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Lugar de Trabajo
                            </label>
                            <input
                                type="text"
                                {...register("workplace")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Oficina central, calle XYZ, Santiago"
                            />
                            {errors.workplace && (
                                <p className="text-red-600 text-sm mt-1">{errors.workplace.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Sueldo Base (CLP)
                            </label>
                            <input
                                type="number"
                                {...register("baseSalary", { valueAsNumber: true })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="500000"
                            />
                            {errors.baseSalary && (
                                <p className="text-red-600 text-sm mt-1">{errors.baseSalary.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Forma de Pago
                                </label>
                                <select
                                    {...register("formaPago")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Transferencia bancaria">Transferencia bancaria</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Periodicidad
                                </label>
                                <select
                                    {...register("periodicidad")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Seleccione</option>
                                    <option value="Mensualmente">Mensualmente</option>
                                    <option value="Quincenalmente">Quincenalmente</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Minutos de Colación
                                </label>
                                <input
                                    type="number"
                                    {...register("minutosColacion", { valueAsNumber: true })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="30"
                                />
                                {errors.minutosColacion && (
                                    <p className="text-red-600 text-sm mt-1">{errors.minutosColacion.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Comuna del Lugar de Trabajo
                                </label>
                                <input
                                    type="text"
                                    {...register("comunaTrabajo")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Ej: Concepción"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Beneficios Adicionales (Opcional)
                            </label>
                            <textarea
                                {...register("benefits")}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Ej: Bono de colación $50.000, seguro complementario de salud"
                            />
                        </div>

                        {selectedType === "OBRA_FAENA" && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción de la Obra/Faena
                                </label>
                                <textarea
                                    {...register("obraDetails")}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Describa la obra o faena específica..."
                                />
                                {errors.obraDetails && (
                                    <p className="text-red-600 text-sm mt-1">{errors.obraDetails.message}</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 5: Legal Representative */}
                <div>
                    <h2 className="text-xl font-semibold mb-4">5. Representante Legal</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del Representante
                            </label>
                            <input
                                type="text"
                                {...register("legalRep")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            {errors.legalRep && (
                                <p className="text-red-600 text-sm mt-1">{errors.legalRep.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                            <input
                                type="text"
                                {...register("legalRepRut")}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="12.345.678-9"
                            />
                            {errors.legalRepRut && (
                                <p className="text-red-600 text-sm mt-1">{errors.legalRepRut.message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 pt-4 border-t">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Guardando..." : "Guardar Cambios"}
                    </button>
                </div>
            </form>
        </div>
    );
}
