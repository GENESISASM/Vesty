'use client';

import { useAuth } from '@/context/auth_context';
import { useRef, useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance, FinanceSummary } from '@/lib/types';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { RefreshCw } from 'lucide-react';

type FilterType = 'monthly' | '7days' | 'yearly';

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [finances, setFinances] = useState<Finance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('monthly');
    const filterRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLDivElement>(null);
    const filters: FilterType[] = ['7days', 'monthly', 'yearly'];
    const filterLabels = { '7days': '7D', monthly: 'Month', yearly: 'Year' };

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [summaryRes, financesRes] = await Promise.all([
                axiosInstance.get('/finance/summary'),
                axiosInstance.get('/finance/list'),
            ]);
            setSummary(summaryRes.data.data);
            setFinances(financesRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!filterRef.current || !sliderRef.current) return;
        const buttons = filterRef.current.querySelectorAll('button');
        const activeIndex = filters.indexOf(filter);
        const activeBtn = buttons[activeIndex] as HTMLButtonElement;
        if (activeBtn) {
            sliderRef.current.style.width = `${activeBtn.offsetWidth}px`;
            sliderRef.current.style.left = `${activeBtn.offsetLeft}px`;
        }
    }, [filter]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const getChartData = () => {
        if (!finances.length) return [];

        if (filter == '7days') {
            const days: { [key: string]: { date: string; income: number; expense: number } } = {};
            const today = new Date();

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                days[key] = { date: label, income: 0, expense: 0 };
            }

            finances.forEach((f) => {
                const key = new Date(f.date).toISOString().split('T')[0];
                if (days[key]) {
                    if (f.type == 'income') {
                        days[key].income += Number(f.amount)
                    } else {
                        days[key].expense += Number(f.amount)
                    }
                }
            });

            return Object.values(days);
        } else if (filter == 'monthly') {
            const months: { [key: string]: { date: string; income: number; expense: number } } = {};

            finances.forEach((f) => {
                const d = new Date(f.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                if (!months[key]) {
                    months[key] = { date: label, income: 0, expense: 0 }
                }

                if (f.type == 'income') {
                    months[key].income += Number(f.amount)
                } else {
                    months[key].expense += Number(f.amount)
                }
            });

            return Object.keys(months).sort().map(key => months[key]);
        } else {
            const years: { [key: string]: { date: string; income: number; expense: number } } = {};

            finances.forEach((f) => {
                const key = String(new Date(f.date).getFullYear());
                if (!years[key]) {
                    years[key] = { date: key, income: 0, expense: 0 }
                }

                if (f.type == 'income') {
                    years[key].income += Number(f.amount)
                } else {
                    years[key].expense += Number(f.amount)
                }
            })
            return Object.keys(years).sort().map(key => years[key]);
        }
    };

    const chartData = getChartData();

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
        return (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
                <p className="text-gray-400 mb-2">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-medium">
                    {p.name == 'income' ? 'Income' : 'Expense'}: {formatCurrency(p.value)}
                    </p>
                ))}
            </div>
        );
        }
        return null;
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Here's your financial overview
                    </p>
                </div>
                <button
                    onClick={fetchData}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition border border-gray-700 disabled:opacity-50"
                >
                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    Refresh
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
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Total Income</p>
                        <p className="text-green-400 text-2xl font-bold">
                            {formatCurrency(summary?.totalIncome ?? 0)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Total Expense</p>
                        <p className="text-red-400 text-2xl font-bold">
                            {formatCurrency(summary?.totalExpense ?? 0)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="text-gray-400 text-sm mb-1">Balance</p>
                        <p className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {formatCurrency(summary?.balance ?? 0)}
                        </p>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mt-6">
                {/* Chart Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-white font-semibold">Income vs Expense</h3>
                    {/* Filter Toggle */}
                    <div ref={filterRef} className="relative flex bg-gray-800 rounded-lg p-1">
                        {/* Sliding background */}
                        <div
                            ref={sliderRef}
                            className="absolute top-1 bottom-1 bg-gray-600 rounded-md transition-all duration-300 ease-in-out"
                            style={{ left: 0, width: 0 }}
                        />
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-300 ${
                                    filter == f ? 'text-white' : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {filterLabels[f]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Line Chart */}
                {isLoading ? (
                    <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
                ) : chartData.length == 0 ? (
                <div className="h-64 flex items-center justify-center">
                    <p className="text-gray-500 text-sm">No data available yet.</p>
                </div>
                ) : (
                <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        axisLine={{ stroke: '#374151' }}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatYAxis}
                        tick={{ fill: '#6b7280', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        formatter={(value) => (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>
                            {value == 'income' ? 'Income' : 'Expense'}
                        </span>
                        )}
                    />
                    <Line
                        type="monotone"
                        dataKey="income"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                    />
                    </LineChart>
                </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}