import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Sidebar />
            <div className="lg:pl-64">
                <Header user={session.user} />
                <main className="py-6 px-4 sm:px-6 lg:px-8">{children}</main>
            </div>
        </div>
    );
}
