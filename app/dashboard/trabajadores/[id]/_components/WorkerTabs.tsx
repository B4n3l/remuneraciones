"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
    UserIcon, 
    DocumentTextIcon, 
    CalendarIcon, 
    DocumentDuplicateIcon,
    ArrowLeftIcon
} from "@heroicons/react/24/outline";
import Link from "next/link";

const tabs = [
    { id: "info", name: "Información", icon: UserIcon },
    { id: "contratos", name: "Contratos", icon: DocumentTextIcon },
    { id: "vacaciones", name: "Vacaciones", icon: CalendarIcon },
    { id: "documentos", name: "Otros Docs", icon: DocumentDuplicateIcon },
];

export default function WorkerTabs() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const activeTab = searchParams.get("tab") || "info";

    const handleTabChange = (tabId: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("tab", tabId);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <Link 
                    href="/dashboard/trabajadores"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeftIcon className="h-4 w-4" />
                    Volver a la lista
                </Link>
            </div>

            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`
                                    group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-all
                                    ${isActive 
                                        ? "border-blue-500 text-blue-600" 
                                        : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}
                                `}
                            >
                                <Icon className={`
                                    -ml-0.5 mr-2 h-5 w-5
                                    ${isActive ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"}
                                `} />
                                <span>{tab.name}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
