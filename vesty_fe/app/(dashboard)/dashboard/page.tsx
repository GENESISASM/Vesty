'use client';

import { useAuth } from '@/context/auth_context';
import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance } from '@/lib/types';
import {
    AreaChart, Area,
    PieChart, Pie,
    XAxis, YAxis,
    CartesianGrid,
    Tooltip, Legend,
    ResponsiveContainer, Sector
} from 'recharts';
import { RefreshCw, Filter } from 'lucide-react';

const INCOME_COLORS  = [ '#10b981', '#0ea5e9', '#6366f1', '#8b5cf6', '#06b6d4' ];
const EXPENSE_COLORS = [ '#dc2f02', '#e85d04', '#f48c06', '#faa307', '#ffba08' ];

const renderPieShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, isActive } = props;
    return (
        <g>
            <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={isActive ? outerRadius + 5 : outerRadius} 
                startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={isActive ? 6 : 4} stroke="none"
            />
        </g>
    );
};

export default function DashboardPage() {
    const { user } = useAuth();
    const [finances, setFinances] = useState<Finance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Set default date range to Current Month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
    
    // Filter State
    const [dateRange, setDateRange] = useState({ start: firstDay, end: lastDay });
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // Local Chart State
    const [pieType, setPieType] = useState<'income' | 'expense'>('expense');
    const [refreshKey, setRefreshKey] = useState(0);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const financesRes = await axiosInstance.get('/finance/list');
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

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
        }).format(amount);
    };

    // 1. Dapatkan data yang difilter berdasarkan Date Range
    const getFilteredFinances = useCallback((): Finance[] => {
        if (!finances.length) return [];
        if (!dateRange.start || !dateRange.end) return finances;

        const start = new Date(dateRange.start);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateRange.end);
        end.setHours(23, 59, 59, 999);

        return finances.filter(f => {
            const d = new Date(f.date);
            return d >= start && d <= end;
        });
    }, [finances, dateRange]);

    const filteredFinances = getFilteredFinances();

    // 2. Kalkulasi Summary Dinamis
    const currentSummary = {
        totalIncome: filteredFinances.filter(f => f.type == 'income').reduce((sum, f) => sum + Number(f.amount), 0),
        totalExpense: filteredFinances.filter(f => f.type == 'expense').reduce((sum, f) => sum + Number(f.amount), 0),
        get balance() { return this.totalIncome - this.totalExpense; }
    };

    // 3. Olah Data untuk Chart (Auto detect Daily vs Monthly grouping)
    const getChartData = () => {
        if (!filteredFinances.length) return [];
        
        const startTime = new Date(dateRange.start).getTime();
        const endTime = new Date(dateRange.end).getTime();
        // Jika rentang <= 31 hari, tampilkan per hari. Jika lebih, per bulan.
        const isDailyGrouping = (endTime - startTime) <= 31 * 24 * 60 * 60 * 1000;

        if (isDailyGrouping) {
            const days: { [key: string]: { date: string; income: number; expense: number } } = {};
            filteredFinances.forEach((f) => {
                const d = new Date(f.date);
                const key = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                if (!days[key]) days[key] = { date: label, income: 0, expense: 0 };
                f.type == 'income' ? days[key].income += Number(f.amount) : days[key].expense += Number(f.amount);
            });
            return Object.keys(days).sort().map(k => days[k]);
        } else {
            const months: { [key: string]: { date: string; income: number; expense: number } } = {};
            filteredFinances.forEach((f) => {
                const d = new Date(f.date);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                if (!months[key]) months[key] = { date: label, income: 0, expense: 0 };
                f.type == 'income' ? months[key].income += Number(f.amount) : months[key].expense += Number(f.amount);
            });
            return Object.keys(months).sort().map(k => months[k]);
        }
    };

    const getPieData = () => {
        const colors = pieType == 'income' ? INCOME_COLORS : EXPENSE_COLORS;
        const targetFinances = filteredFinances.filter(f => f.type == pieType);
        const categoryMap: { [key: string]: number } = {};
        targetFinances.forEach(f => {
            if (!categoryMap[f.category]) categoryMap[f.category] = 0;
            categoryMap[f.category] += Number(f.amount);
        });
        return Object.entries(categoryMap)
            .map(([name, value], index) => ({ name, value, fill: colors[index % colors.length] }))
            .sort((a, b) => b.value - a.value);
    };

    const chartData = getChartData();
    const pieData = getPieData();

    return (
        <div>
            {/* Header with Direct Date Filter */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">
                        Welcome back, {user?.name?.split(' ')[0]} 👋
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        Here's your financial overview
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Direct Date Filter */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2 border hover:bg-gray-800 text-sm font-medium rounded-lg transition ${isFilterOpen ? 'bg-gray-800 border-gray-700 text-white' : 'bg-gray-900 border-gray-800 text-gray-300'}`}
                        >
                            <Filter size={16} className="text-blue-400" />
                            <span>Filter by Date</span>
                        </button>

                        {isFilterOpen && (
                            <div className="absolute right-0 mt-2 w-64 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1.5 block tracking-wider">Start Date</label>
                                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                                            className="w-full scheme-dark bg-gray-950 border border-gray-800 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-400 uppercase font-bold mb-1.5 block tracking-wider">End Date</label>
                                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                                            className="w-full scheme-dark bg-gray-950 border border-gray-800 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-blue-500 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button onClick={fetchData} disabled={isLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>
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
                        <p className="font-quicksand text-gray-400 text-sm mb-1 uppercase tracking-wide">Balance</p>
                        <p className={`text-2xl font-bold ${currentSummary.balance >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                            {formatCurrency(currentSummary.balance)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="font-quicksand text-gray-400 text-sm mb-1 uppercase tracking-wide">Income</p>
                        <p className="text-green-400 text-2xl font-bold">
                            {formatCurrency(currentSummary.totalIncome)}
                        </p>
                    </div>
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                        <p className="font-quicksand text-gray-400 text-sm mb-1 uppercase tracking-wide">Expense</p>
                        <p className="text-red-400 text-2xl font-bold">
                            {formatCurrency(currentSummary.totalExpense)}
                        </p>
                    </div>
                </div>
            )}

            {/* Area Chart & Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* PIE CHART */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold capitalize">Allocation</h3>
                        <div className="flex bg-gray-800 rounded-lg p-1">
                            <button onClick={() => setPieType('income')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${pieType == 'income' ? 'bg-green-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >Income</button>
                            <button onClick={() => setPieType('expense')}
                                className={`px-3 py-1 text-xs font-bold rounded-md transition ${pieType == 'expense' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >Expense</button>
                        </div>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {pieData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie key={`${refreshKey}-${dateRange.start}-${pieType}`}
                                            data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5}
                                            dataKey="value" nameKey="name" stroke="none" shape={renderPieShape}
                                        />
                                        <Tooltip content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const p = payload[0];
                                                return (
                                                    <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 rounded-xl p-3 shadow-xl">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.payload.fill }} />
                                                            <span className="text-gray-200 text-sm">{p.name}</span>
                                                            <span className="font-bold ml-2" style={{ color: p.payload.fill }}>{formatCurrency(p.payload.value)}</span>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null;
                                        }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="w-full mt-4 space-y-2">
                                    {pieData.slice(0, 4).map((entry) => (
                                        <div key={entry.name} className="flex items-center justify-between text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                <span className="text-gray-400 truncate max-w-24">{entry.name}</span>
                                            </div>
                                            <span className="text-gray-200 font-medium">
                                                {((entry.value / pieData.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 text-xs italic">No data in this period</p>
                        )}
                    </div>
                </div>

                {/* AREA CHART */}
                <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-white font-semibold">Cash Flow Overview</h3>
                    </div>

                    {isLoading ? (
                        <div className="h-64 bg-gray-800 rounded-lg animate-pulse" />
                    ) : chartData.length == 0 ? (
                        <div className="h-64 flex items-center justify-center">
                            <p className="text-gray-500 text-sm">No transactions in this period.</p>
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
                                <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={{ stroke: '#374151' }} tickLine={false} dy={10} />
                                <YAxis tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toString()} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div className="bg-gray-900/90 backdrop-blur-md border border-gray-700 shadow-2xl rounded-xl p-4 min-w-40">
                                                <p className="text-gray-400 text-xs mb-3 font-medium border-b border-gray-800 pb-2">{label}</p>
                                                <div className="space-y-2">
                                                    {payload.map((p: any) => (
                                                        <div key={p.name} className="flex items-center justify-between gap-4 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                                                                <span className="text-gray-300 capitalize">{p.name}</span>
                                                            </div>
                                                            <span style={{ color: p.color }} className="font-semibold">{formatCurrency(p.value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null;
                                }} cursor={{ stroke: '#374151', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                <Legend verticalAlign="top" height={36} formatter={(value) => <span className="text-gray-400 text-xs font-medium capitalize ml-1">{value}</span>} />
                                <Area type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#111827' }} />
                                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, strokeWidth: 2, stroke: '#111827' }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
}