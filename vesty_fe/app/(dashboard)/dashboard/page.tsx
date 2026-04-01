'use client';

import { useAuth } from '@/context/auth_context';
import { useRef, useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance, FinanceSummary } from '@/lib/types';
import {
    AreaChart, Area,
    PieChart, Pie,
    XAxis, YAxis,
    CartesianGrid,
    Tooltip, Legend,
    ResponsiveContainer, Sector
} from 'recharts';
import { RefreshCw } from 'lucide-react';

type FilterType = 'monthly' | '7days' | 'yearly';
const INCOME_COLORS  = [ '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#06b6d4' ];
const EXPENSE_COLORS = [ '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08' ];

const renderPieShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, isActive } = props;
    return (
        <g>
        <Sector
            cx={cx}
            cy={cy}
            innerRadius={innerRadius}
            outerRadius={isActive ? outerRadius + 5 : outerRadius} 
            startAngle={startAngle}
            endAngle={endAngle}
            fill={fill}
            cornerRadius={isActive ? 6 : 4}
            stroke="none"
        />
        </g>
    );
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [summary, setSummary] = useState<FinanceSummary | null>(null);
    const [finances, setFinances] = useState<Finance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<FilterType>('monthly');
    const [pieType, setPieType] = useState<'income' | 'expense'>('expense');
    const [refreshKey, setRefreshKey] = useState(0);

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
            setRefreshKey(prev => prev + 1);
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

    const getFilteredFinances = useCallback((): Finance[] => {
        if (!finances.length) return [];
        const today = new Date();
 
        if (filter == '7days') {
            const start = new Date(today);
            start.setDate(today.getDate() - 6);
            start.setHours(0, 0, 0, 0);
            return finances.filter(f => new Date(f.date) >= start);
        } else if (filter == 'monthly') {
            const currentMonth = today.getMonth();
            const currentYear = today.getFullYear();
            return finances.filter(f => {
                const d = new Date(f.date);
                return d.getMonth() === currentMonth && d.getFullYear() == currentYear;
            });
        } else {
            const currentYear = today.getFullYear();
            return finances.filter(f => new Date(f.date).getFullYear() == currentYear);
        }
    }, [finances, filter]);

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

    const getPieData = () => {
        const colors = pieType == 'income' ? INCOME_COLORS : EXPENSE_COLORS;
        const filtered = getFilteredFinances().filter(f => f.type == pieType);
        const categoryMap: { [key: string]: number } = {};
        filtered.forEach(f => {
            if (!categoryMap[f.category]) categoryMap[f.category] = 0;
            categoryMap[f.category] += Number(f.amount);
        });
        return Object.entries(categoryMap)
            .map(([name, value], index) => ({ 
                name, 
                value,
                fill: colors[index % colors.length]
            }))
            .sort((a, b) => b.value - a.value);
    };

    const chartData = getChartData();
    const pieData = getPieData();

    const formatYAxis = (value: number) => {
        if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
        return value.toString();
    };

    const AreaTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 shadow-2xl rounded-xl p-4 min-w-40">
                    <p className="text-gray-400 text-xs mb-3 font-medium border-b border-gray-800 pb-2">
                        {label}
                    </p>
                    <div className="space-y-2">
                        {payload.map((p: any) => (
                            <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                    <span className="text-gray-300 capitalize">
                                        {p.name == 'income' ? 'Income' : 'Expense'}
                                    </span>
                                </div>
                                <span style={{ color: p.color }} className="font-semibold">
                                    {formatCurrency(p.value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }
        return null;
    };

    const PieTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const p = payload[0];
            return (
                <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 shadow-2xl rounded-xl p-4 min-w-40">
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.payload.fill }}></span>
                            <span className="text-gray-300">{p.name}</span>
                        </div>
                        <span style={{ color: p.payload.fill }} className="font-semibold">
                            {formatCurrency(p.value)}
                        </span>
                    </div>
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
                        <p className="font-quicksand text-gray-400 text-sm mb-1">BALANCE</p>
                        <p className={`text-2xl font-bold ${(summary?.balance ?? 0) >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {formatCurrency(summary?.balance ?? 0)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="font-quicksand text-gray-400 text-sm mb-1">INCOME</p>
                        <p className="text-green-400 text-2xl font-bold">
                            {formatCurrency(summary?.totalIncome ?? 0)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="font-quicksand text-gray-400 text-sm mb-1">EXPENSE</p>
                        <p className="text-red-400 text-2xl font-bold">
                            {formatCurrency(summary?.totalExpense ?? 0)}
                        </p>
                    </div>
                </div>
            )}

            {/* Area Chart & Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* PIE CHART */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold capitalize">{pieType} Allocation</h3>
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => setPieType('income')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${pieType == 'income' ? 'bg-green-600 text-white' : 'text-gray-400'}`}
                            >
                                INC
                            </button>
                            <button
                                onClick={() => setPieType('expense')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${pieType == 'expense' ? 'bg-red-600 text-white' : 'text-gray-400'}`}
                            >
                                EXP
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie key={`${refreshKey}-${filter}-${pieType}`}
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                            stroke="none"
                                            shape={renderPieShape}
                                            animationBegin={0}
                                            animationDuration={900}
                                        />
                                        <Tooltip content={<PieTooltip/>} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-4 space-y-2">
                                    {pieData.slice(0, 4).map((entry) => (
                                        <div key={entry.name} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                <span className="text-gray-400 truncate max-w-20">{entry.name}</span>
                                            </div>
                                            <span className="text-gray-200 font-medium">
                                                {((entry.value / pieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 text-xs italic">No data found</p>
                        )}
                    </div>
                </div>

                {/* Area Chart */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">Income vs Expense</h3>
                        <div ref={filterRef} className="relative flex bg-gray-800 rounded-lg p-1">
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

                    {isLoading ? (
                        <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
                    ) : chartData.length == 0 ? (
                        <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-500 text-sm">No data available yet.</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={{ stroke: '#374151' }}
                                    tickLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={formatYAxis}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                    dx={-10}
                                />
                                <Tooltip content={<AreaTooltip/>} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    formatter={(value) => (
                                        <span className="text-gray-400 text-xs font-medium capitalize ml-1">
                                            {value == 'income' ? 'Income' : 'Expense'}
                                        </span>
                                    )}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="income"
                                    stroke="#22c55e"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorIncome)"
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#111827' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#ef4444"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorExpense)"
                                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#111827' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}