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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center">
                <p className="text-gray-400 text-sm">Loading...</p>
            </div>
        )
    }

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/dashboard/finance', label: 'Finance' },
        { href: '/dashboard/stock', label:'Stock' }
    ];

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

                    {/* Nav Links */}
                    <div className="flex items-center gap-1">
                        {navLinks.map(({ href, label }) => {
                        const isActive = pathname == href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                                    isActive
                                    ? 'bg-gray-800 text-white font-medium'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                                }`}
                            >
                                {label}
                            </Link>
                        );
                        })}
                        <button
                            onClick={() => { logout(); router.push('/login'); }}
                            className="ml-3 text-gray-400 hover:text-red-400 transition p-1.5 rounded-lg hover:bg-gray-800/50"
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