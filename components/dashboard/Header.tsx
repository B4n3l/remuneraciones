"use client";

import { signOut } from "next-auth/react";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

interface HeaderProps {
    user: {
        name: string | null;
        email: string;
        role: string;
    };
}

export default function Header({ user }: HeaderProps) {
    return (
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
            <div className="flex-1 px-4 flex justify-between items-center">
                <div className="flex-1"></div>
                <div className="ml-4 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 transition-colors"
                    >
                        <ArrowRightOnRectangleIcon className="h-5 w-5" />
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        </div>
    );
}
