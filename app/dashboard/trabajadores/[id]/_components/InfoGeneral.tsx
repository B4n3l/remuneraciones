import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function InfoGeneral({ worker }: { worker: any }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Personales */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Datos Personales
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <DetailItem label="Nombre Completo" value={`${worker.nombres} ${worker.apellidoPaterno} ${worker.apellidoMaterno}`} />
                        <DetailItem label="RUT" value={worker.rut} />
                        <DetailItem label="Cargo" value={worker.cargo} />
                        <DetailItem label="Fecha de Ingreso" value={format(new Date(worker.fechaIngreso), "PPP", { locale: es })} />
                        <DetailItem label="Estado" value={worker.isActive ? "Activo" : "Inactivo"} />
                    </div>
                </div>

                {/* Previsión y Salud */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Previsión y Salud
                        </h3>
                    </div>
                    <div className="p-4 space-y-4">
                        <DetailItem label="AFP" value={worker.afp.nombre} />
                        <DetailItem label="Sistema de Salud" value={worker.tipoSalud} />
                        {worker.tipoSalud === "ISAPRE" && (
                            <DetailItem label="Isapre/Plan" value={`${worker.healthPlan?.isapre || "N/A"} (${worker.healthPlan?.planUF || 0} UF)`} />
                        )}
                    </div>
                </div>

                {/* Datos de Sueldo */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm md:col-span-2">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Remuneración Fija
                        </h3>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <DetailItem 
                            label="Sueldo Base" 
                            value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(worker.sueldoBase))} 
                        />
                        <DetailItem label="Gratificación" value={worker.tipoGratificacion === "LEGAL_25" ? "Legal 25%" : `Pactada (${worker.gratificacionPactada || 0})`} />
                        <DetailItem 
                            label="Colación" 
                            value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(worker.bonoColacion))} 
                        />
                        <DetailItem 
                            label="Movilización" 
                            value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(worker.bonoMovilizacion))} 
                        />
                        <DetailItem 
                            label="Viático" 
                            value={new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(Number(worker.bonoViatico))} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-xs font-medium text-slate-500 uppercase">{label}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-900">{value}</dd>
        </div>
    );
}
