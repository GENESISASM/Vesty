'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance } from '@/lib/types';
import {
    Search, Pencil, Trash2,
    Plus, CalendarDays, X,
    ChevronsUpDown, ChevronUp, ChevronDown
} from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const CATEGORIES = ['Salary', 'Commission', 'Food', 'Transport', 'Shopping', 'Health', 'Maintenance', 'Entertainment', 'Bills', 'Liability','Other'];

const defaultForm = {
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: 'Salary',
    description: '',
    date: new Date().toISOString().split('T')[0],
};

type SortConfig = {
    key: keyof Finance | 'amount_num' | null;
    direction: 'asc' | 'desc' | null;
};

export default function FinancePage() {
    const [finances, setFinances] = useState<Finance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchFinances = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axiosInstance.get('/finance/list');
            setFinances(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchFinances(); }, [fetchFinances]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsFilterOpen(false);
                setTempRange(dateRange);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dateRange]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDateLabel = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const requestSort = (key: keyof Finance | 'amount_num') => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key == key) {
            if (sortConfig.direction == 'asc') {
                direction = 'desc';
            } else if (sortConfig.direction == 'desc') {
                direction = null;
            }
        }

        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortIcon = (key: keyof Finance | 'amount_num') => {
        const isSelected = sortConfig.key == key;
        const direction = sortConfig.direction;
        if (!isSelected || !direction) {
            return <ChevronsUpDown size={14} className="ml-1 opacity-50" />;
        }

        const Icons = { asc: ChevronUp, desc: ChevronDown,};
        const Icon = Icons[direction];
        return <Icon size={14} className="ml-1 text-blue-500" />;
    };

    const processedFinances = useMemo(() => {
        let result = finances.filter(f => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [f.type, f.category, f.description].some(field => field?.toLowerCase().includes(query))
            if (!dateRange?.from || !dateRange?.to) return matchesSearch;

            const fDate = new Date(f.date);
            const start = new Date(dateRange.from); start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.to); end.setHours(23, 59, 59, 999);
            return matchesSearch && (fDate >= start && fDate <= end);
        });

        if (sortConfig.key && sortConfig.direction) {
            result = [...result].sort((a, b) => {
                let aValue: any = a[sortConfig.key as keyof Finance] || '';
                let bValue: any = b[sortConfig.key as keyof Finance] || '';
                if (sortConfig.key == 'amount_num') {
                    aValue = Number(a.amount);
                    bValue = Number(b.amount);
                }

                if (aValue < bValue) return sortConfig.direction == 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction == 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [finances, searchQuery, dateRange, sortConfig]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = { ...form, amount: Number(form.amount) };
            if (editId) {
                await axiosInstance.put(`/finance/update/${editId}`, payload);
            } else {
                await axiosInstance.post('/finance/create', payload);
            }
            handleCancel();
            fetchFinances();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (finance: Finance) => {
        setForm({
            type: finance.type,
            amount: String(finance.amount),
            category: finance.category,
            description: finance.description ?? '',
            date: new Date(finance.date).toISOString().split('T')[0],
        });
        setEditId(finance.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/finance/delete/${id}`);
            fetchFinances();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteId(null);
        }
    };

    const handleCancel = () => {
        setForm(defaultForm);
        setShowForm(false);
        setEditId(null);
        setError(null);
    };

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto order-2 md:order-1">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            type="text"
                            placeholder="Search"
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="relative w-full md:w-auto" ref={dropdownRef}>
                        <button
                            onClick={() => { setTempRange(dateRange); setIsFilterOpen(!isFilterOpen); }}
                            className={`flex items-center justify-between gap-3 px-4 py-2.5 border text-sm font-medium rounded-xl transition w-full ${
                                isFilterOpen ? 'bg-gray-800 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                            }`}
                        >
                            <CalendarDays size={16} className="text-blue-400 shrink-0" />
                            <span>{dateRange?.from && dateRange?.to ? `${formatDateLabel(dateRange.from)} – ${formatDateLabel(dateRange.to)}` : 'Date Filter'}</span>
                        </button>

                        {isFilterOpen && (
                            <div className="absolute left-0 mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden sm:w-max max-w-[95vw]">
                                <div className="p-2.5 rdp-dark">
                                    <DayPicker mode="range" selected={tempRange} onSelect={setTempRange} numberOfMonths={2} showOutsideDays={false} />
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/80">
                                    <span className="text-gray-400 text-xs font-medium">{tempRange?.from && tempRange?.to ? `${formatDateLabel(tempRange.from)} – ${formatDateLabel(tempRange.to)}` : 'Select range'}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setTempRange(undefined); setDateRange(undefined); setIsFilterOpen(false); }} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg transition">Reset</button>
                                        <button onClick={() => { if (tempRange?.from && tempRange?.to) { setDateRange(tempRange); } setIsFilterOpen(false); }} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg transition">Apply</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-auto order-1 md:order-2 flex justify-end">
                    <button onClick={() => setShowForm(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-900/20">
                        <Plus size={18} /> Add Transaction
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-300 text-[13px] uppercase tracking-wider border-b border-gray-800 select-none">
                                <th onClick={() => requestSort('type')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition group">
                                    <div className="flex items-center justify-center">Type {getSortIcon('type')}</div>
                                </th>
                                <th onClick={() => requestSort('category')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition group">
                                    <div className="flex items-center justify-center">Category {getSortIcon('category')}</div>
                                </th>
                                <th onClick={() => requestSort('description')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition group">
                                    <div className="flex items-center justify-center">Description {getSortIcon('description')}</div>
                                </th>
                                <th onClick={() => requestSort('date')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition group">
                                    <div className="flex items-center justify-center">Date {getSortIcon('date')}</div>
                                </th>
                                <th onClick={() => requestSort('amount_num')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition group">
                                    <div className="flex items-center justify-center">Amount {getSortIcon('amount_num')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-center">
                            {isLoading ? (
                                [1,2,3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-4"><div className="h-12 bg-gray-800/50 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : processedFinances.length > 0 ? (
                                processedFinances.map((f) => (
                                    <tr key={f.id} className="hover:bg-gray-800/30 transition-colors group">
                                        <td className="px-6 py-4"><span className="text-gray-100 text-sm capitalize">{f.type}</span></td>
                                        <td className="px-6 py-4"><p className="text-gray-100 text-sm">{f.category}</p></td>
                                        <td className="px-6 py-4"><p className="text-gray-100 text-sm">{f.description || '-'}</p></td>
                                        <td className="px-6 py-4 text-gray-100 text-sm">{formatDateLabel(new Date(f.date))}</td>
                                        <td className={`px-6 py-4 font-bold text-sm ${f.type == 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {f.type == 'income' ? '+' : '-'}{formatCurrency(Number(f.amount))}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => handleEdit(f)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition"><Pencil size={16} /></button>
                                                <button onClick={() => setDeleteId(f.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition"><Trash2 size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500 italic text-sm">No transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Form */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{editId ? 'Edit Transaction' : 'New Transaction'}</h3>
                            <button onClick={handleCancel} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={`py-2.5 rounded-xl text-sm font-bold transition ${form.type == 'income' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Income</button>
                                    <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`py-2.5 rounded-xl text-sm font-bold transition ${form.type == 'expense' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Expense</button>
                                </div>
                            </div>
                            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount (IDR)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 shadow-inner" required />
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" />
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition">
                                {isSubmitting ? 'Processing...' : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm text-center">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={30} /></div>
                        <h3 className="text-white font-bold text-lg mb-2">Are you sure?</h3>
                        <p className="text-gray-500 text-sm mb-8">This transaction will be permanently removed</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteId(null)} className="py-3 bg-gray-800 text-white rounded-xl font-bold">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="py-3 bg-red-600 text-white rounded-xl font-bold">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}