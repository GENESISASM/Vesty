'use client';

import { useAuth } from "@/context/auth_context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <h1 className="text-white font-bold text-xl">Vesty</h1>
                    <div className="flex items-center gap-6">
                        <a href="/dashboard" className="text-gray-400 hover:text-white text-sm transition">
                            Dashboard
                        </a>
                        <a href="/dashboard/finance" className="text-gray-400 hover:text-white text-sm transition">
                            Finance
                        </a>
                        <a href="/dashboard/stock" className="text-gray-400 hover:text-white text-sm transition">
                            Stock
                        </a>
                        <button
                            onClick={() => { logout(); router.push('/login'); }}
                            className="text-gray-400 hover:text-red-400 transition"
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    )
}