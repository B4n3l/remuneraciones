"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Company {
    id: string;
    razonSocial: string;
    rut: string;
}

interface User {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
    companies: Array<{ company: Company }>;
}

export default function UsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const [formData, setFormData] = useState({
        email: "",
        name: "",
        password: "",
        role: "CONTADOR" as "SUPER_ADMIN" | "CONTADOR" | "CLIENTE",
        companyId: "",
    });

    const fetchUsers = useCallback(async () => {
        try {
            const res = await fetch("/api/admin/users");
            if (res.ok) {
                setUsers(await res.json());
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }, []);

    useEffect(() => {
        if (status === "loading") return;

        if (session?.user?.role !== "SUPER_ADMIN") {
            router.push("/dashboard");
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            await fetchUsers();

            // Fetch companies for association
            const companiesRes = await fetch("/api/companies");
            if (companiesRes.ok) {
                setCompanies(await companiesRes.json());
            }

            setLoading(false);
        };

        fetchData();
    }, [session, status, router, fetchUsers]);

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({
            email: "",
            name: "",
            password: "",
            role: "CONTADOR",
            companyId: "",
        });
        setShowModal(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name || "",
            password: "",
            role: user.role as "SUPER_ADMIN" | "CONTADOR" | "CLIENTE",
            companyId: user.companies[0]?.company.id || "",
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            if (editingUser) {
                // Update
                const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: formData.name,
                        role: formData.role,
                        companyId: formData.companyId || null,
                    }),
                });

                if (!res.ok) {
                    const error = await res.json();
                    alert(error.error || "Error al actualizar");
                    return;
                }
            } else {
                // Create
                if (!formData.password) {
                    alert("La contraseña es requerida");
                    return;
                }

                const res = await fetch("/api/admin/users", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                if (!res.ok) {
                    const error = await res.json();
                    alert(error.error || "Error al crear usuario");
                    return;
                }
            }

            setShowModal(false);
            await fetchUsers();
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Eliminar este usuario?")) return;

        try {
            const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
            if (res.ok) {
                await fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || "Error al eliminar");
            }
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            SUPER_ADMIN: "bg-purple-100 text-purple-800",
            CONTADOR: "bg-blue-100 text-blue-800",
            CLIENTE: "bg-green-100 text-green-800",
        };
        const labels: Record<string, string> = {
            SUPER_ADMIN: "Super Admin",
            CONTADOR: "Contador",
            CLIENTE: "Cliente",
        };
        return (
            <span className={`px-2 py-1 rounded text-sm font-medium ${styles[role] || "bg-gray-100"}`}>
                {labels[role] || role}
            </span>
        );
    };

    if (loading || status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600">Administra los usuarios del sistema</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                    <span>➕</span> Nuevo Usuario
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-gray-900">{users.length}</div>
                    <div className="text-gray-600 text-sm">Total usuarios</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-purple-600">
                        {users.filter((u) => u.role === "SUPER_ADMIN").length}
                    </div>
                    <div className="text-gray-600 text-sm">Super Admins</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-blue-600">
                        {users.filter((u) => u.role === "CONTADOR").length}
                    </div>
                    <div className="text-gray-600 text-sm">Contadores</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-2xl font-bold text-green-600">
                        {users.filter((u) => u.role === "CLIENTE").length}
                    </div>
                    <div className="text-gray-600 text-sm">Clientes</div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{user.name || "Sin nombre"}</div>
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                <td className="px-6 py-4 text-gray-600">
                                    {user.companies.length > 0
                                        ? user.companies.map((c) => c.company.razonSocial).join(", ")
                                        : "-"}
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {new Date(user.createdAt).toLocaleDateString("es-CL")}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleEdit(user)}
                                        className="text-blue-600 hover:text-blue-800 mr-3"
                                    >
                                        Editar
                                    </button>
                                    {user.id !== session?.user.id && (
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            Eliminar
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">
                                {editingUser ? "Editar Usuario" : "Nuevo Usuario"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                ✕
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    disabled={!!editingUser}
                                    className="w-full border rounded-lg px-3 py-2 disabled:bg-gray-100"
                                />
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full border rounded-lg px-3 py-2"
                                />
                            </div>

                            {/* Contraseña (solo crear) */}
                            {!editingUser && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                </div>
                            )}

                            {/* Rol */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value as "SUPER_ADMIN" | "CONTADOR" | "CLIENTE",
                                        })
                                    }
                                    className="w-full border rounded-lg px-3 py-2"
                                >
                                    <option value="CONTADOR">Contador</option>
                                    <option value="CLIENTE">Cliente</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>

                            {/* Empresa (solo para CLIENTE) */}
                            {formData.role === "CLIENTE" && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Empresa asociada *
                                    </label>
                                    <select
                                        value={formData.companyId}
                                        onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                                        className="w-full border rounded-lg px-3 py-2"
                                    >
                                        <option value="">Seleccionar empresa...</option>
                                        {companies.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.razonSocial} ({c.rut})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="border-t px-6 py-4 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {saving ? "Guardando..." : "Guardar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
