"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    BuildingOfficeIcon,
    UsersIcon,
    DocumentTextIcon,
    Cog6ToothIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar() {
    const pathname = usePathname();

    const navigation = [
        {
            name: "Empresas",
            href: "/dashboard/empresas",
            icon: BuildingOfficeIcon,
        },
        {
            name: "Trabajadores",
            href: "/dashboard/trabajadores",
            icon: UsersIcon,
        },
        {
            name: "Liquidaciones",
            href: "/dashboard/liquidaciones",
            icon: DocumentTextIcon,
        },
        {
            name: "Configuración",
            href: "/dashboard/configuracion",
            icon: Cog6ToothIcon,
        },
        {
            name: "Admin",
            href: "/dashboard/admin",
            icon: ShieldCheckIcon,
        },
    ];

    return (
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <div className="flex flex-col flex-grow bg-blue-700 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 py-6">
                    <h1 className="text-white text-xl font-bold">
                        Sistema de Remuneraciones
                    </h1>
                </div>
                <div className="mt-5 flex-1 flex flex-col">
                    <nav className="flex-1 px-2 space-y-1">
                        {navigation.map((item) => {
                            const isActive = pathname?.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors
                    ${isActive
                                            ? "bg-blue-800 text-white"
                                            : "text-blue-100 hover:bg-blue-600"
                                        }
                  `}
                                >
                                    <item.icon
                                        className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? "text-white" : "text-blue-300"
                                            }`}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>
        </div>
    );
}
