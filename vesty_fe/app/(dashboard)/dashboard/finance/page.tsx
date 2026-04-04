'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance } from '@/lib/types';
import {
    Search, Pencil, Trash2,
    Plus, CalendarDays, X,
    ChevronsUpDown, ChevronUp, ChevronDown,
    Filter, ChevronRight, Check
} from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const CATEGORIES = ['Salary', 'Commission', 'Food', 'Transport', 'Shopping', 'Health', 'Maintenance', 'Entertainment', 'Bills', 'Liability','Other'];
const TYPES = ['income', 'expense'];

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
    const [isMultiFilterOpen, setIsMultiFilterOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<'type' | 'category' | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ types: string[], categories: string[] }>({
        types: [],
        categories: []
    });
    const [isFormDatePickerOpen, setIsFormDatePickerOpen] = useState(false);

    const formDateRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const multiFilterRef = useRef<HTMLDivElement>(null);

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
            if (multiFilterRef.current && !multiFilterRef.current.contains(event.target as Node)) {
                setIsMultiFilterOpen(false);
                setActiveSubmenu(null);
            }
            if (formDateRef.current && !formDateRef.current.contains(event.target as Node)) {
                setIsFormDatePickerOpen(false);
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
            if (sortConfig.direction == 'asc') direction = 'desc';
            else if (sortConfig.direction == 'desc') direction = null;
        }
        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortIcon = (key: keyof Finance | 'amount_num') => {
        const isSelected = sortConfig.key == key;
        const direction = sortConfig.direction;
        if (!isSelected || !direction) return <ChevronsUpDown size={14} className="ml-1 opacity-50" />;
        const Icons = { asc: ChevronUp, desc: ChevronDown };
        const Icon = Icons[direction];
        return <Icon size={14} className="ml-1 text-blue-500" />;
    };

    const toggleFilter = (group: 'types' | 'categories', value: string) => {
        setActiveFilters(prev => {
            const current = prev[group];
            const next = current.includes(value) 
                ? current.filter(item => item != value) 
                : [...current, value];
            return { ...prev, [group]: next };
        });
    };

    const processedFinances = useMemo(() => {
        let result = finances.filter(f => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [f.type, f.category, f.description].some(field => field?.toLowerCase().includes(query))
            const matchesType = activeFilters.types.length == 0 || activeFilters.types.includes(f.type);
            const matchesCategory = activeFilters.categories.length == 0 || activeFilters.categories.includes(f.category);

            if (!dateRange?.from || !dateRange?.to) return matchesSearch && matchesType && matchesCategory;

            const fDate = new Date(f.date);
            const start = new Date(dateRange.from); start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.to); end.setHours(23, 59, 59, 999);
            return matchesSearch && matchesType && matchesCategory && (fDate >= start && fDate <= end);
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
    }, [finances, searchQuery, dateRange, sortConfig, activeFilters]);

    const handleCancel = () => {
        setForm(defaultForm);
        setShowForm(false);
        setEditId(null);
        setError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = { ...form, amount: Number(form.amount) };
            if (editId) await axiosInstance.put(`/finance/update/${editId}`, payload);
            else await axiosInstance.post('/finance/create', payload);
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
        } catch (err) { console.error(err); }
        finally { setDeleteId(null); }
    };

    const totalActiveFilters = activeFilters.types.length + activeFilters.categories.length;

    const CustomCheckbox = ({ checked, onChange, label }: { checked: boolean, onChange: () => void, label: string }) => (
        <div 
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 cursor-pointer transition-colors group"
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
        >
            <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${
                checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-400'
            }`}>
                {checked && <Check size={12} className="text-white" strokeWidth={4} />}
            </div>
            <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>
                {label}
            </span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center mb-6 gap-2">
                {/* Search */}
                <div className="relative grow min-w-0">
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
                <div className="relative shrink-0" ref={dropdownRef}>
                    <button
                        onClick={() => { setTempRange(dateRange); setIsFilterOpen(!isFilterOpen); }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border text-sm font-medium rounded-xl transition ${
                            isFilterOpen ? 'bg-gray-800 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                        <CalendarDays size={18} className="text-gray-400" />
                        <span className="hidden md:inline">{dateRange?.from && dateRange?.to ? `${formatDateLabel(dateRange.from)} – ${formatDateLabel(dateRange.to)}` : 'Date'}</span>
                    </button>

                    {isFilterOpen && (
                        <div className="absolute right-0 mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden sm:w-max max-w-[95vw]">
                            <div className="p-2.5 rdp-dark">
                                <DayPicker mode="range" selected={tempRange} onSelect={setTempRange} numberOfMonths={window.innerWidth < 640 ? 1 : 2} showOutsideDays={false} />
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/80">
                                <div className="flex gap-2 ml-auto">
                                    <button onClick={() => { setTempRange(undefined); setDateRange(undefined); setIsFilterOpen(false); }} className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-800 rounded-lg">Reset</button>
                                    <button onClick={() => { if (tempRange?.from && tempRange?.to) { setDateRange(tempRange); } setIsFilterOpen(false); }} className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg">Apply</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Multiple Filter */}
                <div className="relative shrink-0" ref={multiFilterRef}>
                    <button
                        onClick={() => {
                            setIsMultiFilterOpen(!isMultiFilterOpen);
                            setActiveSubmenu(null);
                        }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border text-sm font-medium rounded-xl transition ${
                            isMultiFilterOpen || totalActiveFilters > 0
                            ? 'bg-gray-800 border-blue-500 text-white' 
                            : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                        }`}
                    >
                        <Filter size={18} className={totalActiveFilters > 0 ? 'text-blue-400' : 'text-gray-500'} />
                        <span className="hidden md:inline">Filters</span>
                        {totalActiveFilters > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                                {totalActiveFilters}
                            </span>
                        )}
                    </button>

                    {isMultiFilterOpen && (
                        <div className="absolute right-0 md:left-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-60 py-2 overflow-visible ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100">
                            {/* Type Submenu */}
                            <div 
                                className="relative group px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                onClick={() => setActiveSubmenu(activeSubmenu == 'type' ? null : 'type')}
                            >
                                <span className="font-medium">Type</span>
                                <ChevronRight size={14} className={`opacity-50 transition-transform ${activeSubmenu == 'type' ? 'rotate-90 md:rotate-0' : ''}`} />
                                
                                <div className={`absolute right-full md:left-full top-0 mr-1 md:mr-0 md:ml-1 w-44 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl py-2 ${activeSubmenu == 'type' ? 'block' : 'hidden group-hover:block'}`}>
                                    {TYPES.map(t => (
                                        <CustomCheckbox key={t} checked={activeFilters.types.includes(t)} onChange={() => toggleFilter('types', t)} label={t.charAt(0).toUpperCase() + t.slice(1)} />
                                    ))}
                                </div>
                            </div>

                            {/* Category Submenu */}
                            <div 
                                className="relative group px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                onClick={() => setActiveSubmenu(activeSubmenu == 'category' ? null : 'category')}
                            >
                                <span className="font-medium">Category</span>
                                <ChevronRight size={14} className={`opacity-50 transition-transform ${activeSubmenu == 'category' ? 'rotate-90 md:rotate-0' : ''}`} />
                                
                                <div className={`absolute right-full md:left-full top-0 mr-1 md:mr-0 md:ml-1 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl py-2 max-h-72 overflow-y-auto custom-scrollbar ${activeSubmenu == 'category' ? 'block' : 'hidden group-hover:block'}`}>
                                    {CATEGORIES.map(c => (
                                        <CustomCheckbox key={c} checked={activeFilters.categories.includes(c)} onChange={() => toggleFilter('categories', c)} label={c} />
                                    ))}
                                </div>
                            </div>

                            {totalActiveFilters > 0 && (
                                <div className="px-2 mt-2 pt-2 border-t border-gray-800/50">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFilters({ types: [], categories: [] });
                                        }} 
                                        className="w-full text-center py-2 text-xs font-semibold text-red-400 hover:text-red-300"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Add Transaction */}
                <button 
                    onClick={() => setShowForm(true)} 
                    className="shrink-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-900/20"
                >
                    <Plus size={18} />
                    <span className="hidden md:inline">Add Transaction</span>
                </button>
            </div>

            {/* Table Section */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-300 text-[13px] uppercase tracking-wider border-b border-gray-800 select-none text-center">
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
                                        <td className="px-6 py-4 text-gray-100 text-sm capitalize">{f.type}</td>
                                        <td className="px-6 py-4 text-gray-100 text-sm">{f.category}</td>
                                        <td className="px-6 py-4 text-gray-100 text-sm">{f.description || '-'}</td>
                                        <td className="px-6 py-4 text-gray-100 text-sm">{formatDateLabel(new Date(f.date))}</td>
                                        <td className={`px-6 py-4 font-bold text-sm ${f.type == 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {f.type == 'income' ? '+' : '-'}{formatCurrency(Number(f.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-center">
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

            {/* Form Input Transaction */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{editId ? 'Edit Transaction' : 'New Transaction'}</h3>
                            <button onClick={handleCancel} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={`py-2.5 rounded-xl text-sm font-bold transition ${form.type == 'income' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Income</button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`py-2.5 rounded-xl text-sm font-bold transition ${form.type == 'expense' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-500'}`}>Expense</button>
                            </div>
                            <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount (IDR)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 shadow-inner" required />
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" />
                            <div className="relative" ref={formDateRef}>
                                <button type="button" onClick={() => setIsFormDatePickerOpen(!isFormDatePickerOpen)} className="w-full bg-gray-800 text-left px-4 py-3 rounded-xl text-white text-sm flex items-center justify-between border border-transparent focus:border-blue-500 transition">
                                    <span className={form.date ? "text-white" : "text-gray-500"}>{form.date ? formatDateLabel(new Date(form.date)) : "Select Date"}</span>
                                    <CalendarDays size={18} className="text-gray-500" />
                                </button>
                                {isFormDatePickerOpen && (
                                    <div className="absolute left-0 bottom-full mb-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-110 p-2 rdp-dark animate-in fade-in zoom-in-95 duration-200">
                                        <DayPicker mode="single" selected={new Date(form.date)} onSelect={(date) => { if (date) { setForm({ ...form, date: date.toISOString().split('T')[0] }); setIsFormDatePickerOpen(false); }}} />
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition">
                                {isSubmitting ? 'Processing...' : 'Save Transaction'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Transaction */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-100 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Trash2 size={30} /></div>
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