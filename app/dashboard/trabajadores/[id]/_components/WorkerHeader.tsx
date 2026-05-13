import { UserIcon, BuildingOfficeIcon, IdentificationIcon } from "@heroicons/react/24/outline";

export default function WorkerHeader({ worker }: { worker: any }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 border-4 border-white shadow-md">
                    <UserIcon className="h-12 w-12" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
                        <h1 className="text-3xl font-bold text-slate-900">
                            {worker.nombres} {worker.apellidoPaterno} {worker.apellidoMaterno}
                        </h1>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            worker.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }`}>
                            {worker.isActive ? "Activo" : "Inactivo"}
                        </span>
                    </div>
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 text-sm">
                        <div className="flex items-center gap-1.5">
                            <IdentificationIcon className="h-4 w-4" />
                            {worker.rut}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <BuildingOfficeIcon className="h-4 w-4" />
                            {worker.company.razonSocial}
                        </div>
                        <div className="bg-slate-100 px-2 py-1 rounded text-slate-700 font-medium">
                            {worker.cargo}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
