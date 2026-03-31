'use client';

import { useAuth } from "@/context/auth_context";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, LogOut } from 'lucide-react';
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
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/login");
        }
    }, [user, isLoading]);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMenuOpen]);

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
        <div className="min-h-screen bg-gray-950 overflow-x-hidden">
            {/* Navbar */}
            <nav className="border-b border-gray-800 px-6 py-4 sticky top-0 bg-gray-950/80 backdrop-blur-md z-50">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group z-50">
                        <div className="relative w-8 h-8">
                            <Image 
                                src="/image/VestyLogo.svg"
                                alt="Vesty Logo Icon"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <h1 className="text-white font-bold text-2xl tracking-tight">Vesty</h1>
                    </Link>

                    {/* Desktop Navbar */}
                    <div className="hidden md:flex items-center gap-1">
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

                    {/* Burger Button Mobile Only */}
                    <button 
                        className="md:hidden text-white z-50 p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Navbar */}
                <div className="md:hidden">
                    <div
                        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-60 transition-opacity duration-300 ${
                            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                    />
                    <div className={`
                        fixed top-0 right-0 h-full w-70 bg-gray-900 z-70
                        shadow-[-10px_0_30px_rgba(0,0,0,0.8)] border-l border-gray-800 flex flex-col
                        transition-transform duration-300 ease-in-out
                        ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                    `}>
                        {/* Header */}
                        <div className="p-6 flex items-center justify-between border-b border-gray-800 bg-gray-900">
                            <div className="flex items-center gap-3">
                                <div className="relative w-6 h-6">
                                    <Image src="/image/VestyLogo.svg" alt="Logo" fill className="object-contain" />
                                </div>
                                <span className="text-white font-bold tracking-tight">Vesty</span>
                            </div>
                            <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                                <X size={24} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 flex flex-col p-4 gap-2 bg-gray-900">
                            {navLinks.map(({ href, label }) => {
                                const isActive = pathname == href;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`flex items-center w-full px-5 py-4 rounded-xl text-base font-medium transition-all ${
                                            isActive 
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Logout */}
                        <div className="p-4 border-t border-gray-800 bg-gray-900">
                            <button 
                                onClick={() => { logout(); router.push('/login'); }}
                                className="w-full flex items-center gap-3 px-5 py-4 text-red-400 hover:bg-red-400/10 rounded-xl transition-colors text-base font-medium"
                            >
                                <LogOut size={20} />
                                Logout
                            </button>
                        </div>
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