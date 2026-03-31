'use client';

import { useAuth } from "@/context/auth_context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from 'lucide-react';
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading]);

    const getLinkStyle = (path: string) => {
        return pathname == path 
            ? "text-white font-medium" 
            : "text-gray-400 hover:text-white transition";
    }

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
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="relative w-8 h-8 transition-transform group-hover:scale-110">
                            <Image 
                                src="/image/VestyLogo.svg"
                                alt="Vesty Logo Icon"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-white font-bold text-xl tracking-tight">Vesty</h1>
                    </Link>
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