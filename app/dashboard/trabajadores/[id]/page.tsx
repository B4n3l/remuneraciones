import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import WorkerHeader from "./_components/WorkerHeader";
import WorkerTabs from "./_components/WorkerTabs";
import InfoGeneral from "./_components/InfoGeneral";
import Contratos from "./_components/Contratos";
import Vacaciones from "./_components/Vacaciones";
import DocumentosExtras from "./_components/DocumentosExtras";

export default async function WorkerProfilePage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}) {
    const { id } = await params;
    const { tab } = await searchParams;
    const activeTab = tab || "info";

    const worker = await prisma.worker.findUnique({
        where: { id },
        include: {
            company: true,
            afp: true,
            healthPlan: true,
            contracts: {
                orderBy: { startDate: 'desc' }
            },
            vacaciones: {
                orderBy: { fechaInicio: 'desc' }
            },
            documentos: {
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!worker) {
        notFound();
    }

    // Los tabs de abajo son Client Components: no pueden recibir campos Decimal de Prisma
    // (sueldoBase, baseSalary, afp.porcentaje, etc.) directamente como prop.
    const serializedWorker = JSON.parse(JSON.stringify(worker));

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <WorkerHeader worker={worker} />
            <WorkerTabs />

            <div className="mt-6">
                {activeTab === "info" && <InfoGeneral worker={worker} />}
                {activeTab === "contratos" && <Contratos worker={serializedWorker} />}
                {activeTab === "vacaciones" && <Vacaciones worker={serializedWorker} />}
                {activeTab === "documentos" && <DocumentosExtras worker={serializedWorker} />}
            </div>
        </div>
    );
}
