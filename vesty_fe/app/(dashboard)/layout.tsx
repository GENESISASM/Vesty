'use client';

import { useAuth } from "@/context/auth_context";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { 
    LayoutDashboard, Wallet,
    Package, LogOut,
    Menu, Languages,
    User, Check
} from 'lucide-react';
import Image from "next/image";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [lang, setLang] = useState('EN');

    useEffect(() => {
        if (!isLoading && !user) router.push("/login");
    }, [user, isLoading, router]);

    useEffect(() => {
        if (isMobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileOpen]);

    if (isLoading) return null;

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/dashboard/finance', label: 'Finance', icon: Wallet },
        { href: '/dashboard/stock', label: 'Stock', icon: Package },
    ];

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800 transition-all duration-300 font-poppins text-white">
            {/* Hide SideBar Desktop */}
            <div className="p-6">
                <button onClick={() => setIsDashboardOpen(!isDashboardOpen)}
                    className={`flex items-center gap-3 hover:opacity-80 transition-all w-full cursor-pointer group ${isDashboardOpen ? 'justify-center' : 'justify-start'}`}
                >
                    <div className="relative w-8 h-8 shrink-0">
                        <Image src="/image/VestyLogo.svg" alt="Vesty" fill className="object-contain" />
                    </div>
                    {!isDashboardOpen && (
                        <h1 className="text-white font-bold text-xl tracking-tight uppercase animate-in fade-in duration-300">
                            Vesty
                        </h1>
                    )}
                </button>
            </div>

            {/* SideBar Mobile Settings */}
            <nav className="flex-1 px-3 space-y-1">
                {navLinks.map(({ href, label, icon: Icon }) => (
                    <Link key={href} href={href} onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${pathname == href ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                        <Icon size={20} className="shrink-0" />
                        {!isDashboardOpen && <span className="font-medium text-sm">{label}</span>}
                    </Link>
                ))}
                
                <button onClick={() => { logout(); router.push('/login'); }} 
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-400/10 mt-4 transition-all cursor-pointer group"
                >
                    <LogOut size={20} className="shrink-0" />
                    {!isDashboardOpen && <span className="text-sm font-medium">Logout</span>}
                </button>
            </nav>

            {/* Mobile Settings */}
            <div className="md:hidden border-t border-gray-800 p-5 space-y-6 bg-gray-900/50">
                {/* Button Language */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3 text-gray-400 text-[14px] font-bold uppercase tracking-wider">
                        <div className="w-5 h-5 flex items-center justify-center">
                            <Languages size={18} />
                        </div>
                        <span>Language</span>
                    </div>
                    <div className="flex bg-gray-800 rounded-xl p-1 gap-1 border border-gray-700 w-20 h-9 items-center justify-center relative">
                        <button onClick={() => setLang('EN')}
                            className={`flex-1 h-full text-[11px] font-bold rounded-lg transition relative z-10 ${lang == 'EN' ? 'text-white' : 'text-gray-500'}`}
                        >
                            EN
                        </button>
                        <button onClick={() => setLang('ID')}
                            className={`flex-1 h-full text-[11px] font-bold rounded-lg transition relative z-10 ${lang == 'ID' ? 'text-white' : 'text-gray-500'}`}
                        >
                            ID
                        </button>
                        <div className={`absolute top-1 bottom-1 w-8.5 bg-blue-600 rounded-lg transition-all duration-300 ${lang == 'ID' ? 'left-10.25' : 'left-1'}`} />
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-950 flex overflow-hidden font-poppins text-white">
            <aside className={`hidden md:block transition-all duration-300 ${isDashboardOpen ? 'w-20' : 'w-64'}`}>
                <SidebarContent />
            </aside>

            <div className={`md:hidden fixed inset-0 z-60 ${isMobileOpen ? 'visible' : 'invisible'}`}>
                <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setIsMobileOpen(false)} />
                <aside className={`absolute top-0 left-0 h-full w-72 transition-transform duration-300 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <SidebarContent />
                </aside>
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-gray-950/50 backdrop-blur-md sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsMobileOpen(true)} className="md:hidden text-gray-400 hover:text-white p-1"><Menu size={24} /></button>
                        <h2 className="text-white font-bold font-poppins text-lg md:text-lg capitalize tracking-tight">{pathname.split('/').pop() || 'Overview'}</h2>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden md:flex items-center gap-4">
                        <div className="relative group py-2">
                            <button className="flex items-center gap-1.5 px-3 py-1.5 w-12 h-9 bg-gray-900 border border-gray-800 rounded-lg text-gray-400 hover:text-white transition cursor-pointer group">
                                <span className="text-[14px] font-bold uppercase tracking-widest">{lang}</span>
                            </button>
                            
                            {/* Dropdown Languages */}
                            <div className="absolute right-0 mt-1 w-40 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                                <button onClick={() => setLang('EN')} 
                                    className={`w-full flex items-center justify-between px-4 py-3 text-[14px] hover:bg-gray-800 transition cursor-pointer group 
                                    ${lang == 'EN' ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'}`}
                                >
                                    <div className="flex items-center gap-2"><span className="text-base text-[14px]">US</span> English</div>
                                    {lang == 'EN' && <Check size={14} />}
                                </button>
                                <button onClick={() => setLang('ID')} 
                                    className={`w-full flex items-center justify-between px-4 py-3 text-[14px] hover:bg-gray-800 transition cursor-pointer group
                                    ${lang == 'ID' ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400'}`}
                                >
                                    <div className="flex items-center gap-2"><span className="text-base text-[14px]">ID</span> Indonesia</div>
                                    {lang == 'ID' && <Check size={14} />}
                                </button>
                            </div>
                        </div>

                        {/* Button Account */}
                        <button className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-blue-400 transition shadow-inner cursor-pointer group">
                            <User size={18} />
                        </button>
                    </div>

                    {/* Mobile Account */}
                    <div className="md:hidden">
                        <button className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400">
                            <User size={18} />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-6xl mx-auto">{children}</div>
                </main>
            </div>
        </div>
    );
}