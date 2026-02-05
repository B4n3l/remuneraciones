import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Link from "next/link";

export default async function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    // Solo permitir acceso a CLIENTE (o SUPER_ADMIN para testing)
    if (session.user.role !== "CLIENTE" && session.user.role !== "SUPER_ADMIN") {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header simplificado */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Portal de Cliente</h1>
                                <p className="text-sm text-gray-500">Centro Contable</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">{session.user.name || session.user.email}</span>
                            <Link
                                href="/api/auth/signout"
                                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 text-sm"
                            >
                                Cerrar Sesión
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="border-t bg-white mt-auto">
                <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-gray-500">
                    © 2026 Centro Contable. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    );
}
