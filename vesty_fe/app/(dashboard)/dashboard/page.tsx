'use client';

import { useAuth } from '@/context/auth_context';
import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { FinanceSummary } from '@/lib/types';

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axiosInstance.get('/finance/summary');
            setSummary(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div>
            {/* Welcome & Refresh Button Section */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Here's your financial overview
                    </p>
                </div>
                
                {/* 2. Tombol Refresh */}
                <button 
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition border border-gray-700 disabled:opacity-50"
                >
                    {isLoading ? (
                        <span className="animate-spin">🔄</span>
                    ) : (
                        <span>🔄</span>
                    )}
                    Refresh Data
                </button>
            </div>

            {/* Summary Cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-6 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-24 mb-3"></div>
                    <div className="h-8 bg-gray-800 rounded w-36"></div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Income */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Total Income</p>
                    <p className="text-green-400 text-2xl font-bold">
                    {formatCurrency(summary?.totalIncome ?? 0)}
                    </p>
                </div>

                {/* Total Expense */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Total Expense</p>
                    <p className="text-red-400 text-2xl font-bold">
                    {formatCurrency(summary?.totalExpense ?? 0)}
                    </p>
                </div>

                {/* Balance */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Balance</p>
                    <p className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                    {formatCurrency(summary?.balance ?? 0)}
                    </p>
                </div>
                </div>
            )}

            {/* Quick Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <a href="/dashboard/finance"
                className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl p-6 transition group">
                <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition">
                    💰 Finance
                </h3>
                <p className="text-gray-400 text-sm">Track your income & expenses</p>
                </a>
                <a href="/dashboard/stock"
                className="bg-gray-900 border border-gray-800 hover:border-blue-500 rounded-xl p-6 transition group">
                <h3 className="text-white font-semibold mb-1 group-hover:text-blue-400 transition">
                    📦 Stock
                </h3>
                <p className="text-gray-400 text-sm">Manage your item inventory</p>
                </a>
            </div>
        </div>
    );
}