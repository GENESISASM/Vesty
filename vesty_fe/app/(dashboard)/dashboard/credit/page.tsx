'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import { Credit } from '@/lib/types';
import {
    Search, Trash2, Plus, X, Pencil,
    ChevronsUpDown, ChevronUp, ChevronDown,
    Filter, ChevronRight, Check, CalendarDays,
    CreditCard, RefreshCw, CheckCircle2,
    AlertCircle, CircleDashed, ChevronLeft
} from 'lucide-react';
import { DayPicker, DateRange } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

const STATUS_OPTIONS = ['unpaid', 'partial', 'paid'];

const statusConfig = {
    unpaid: { label: 'Unpaid', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle },
    partial: { label: 'Partial', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: CircleDashed },
    paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
};

const defaultCreditForm = {
    creditor_name: '',
    amount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
};

const defaultPaymentForm = {
    amount: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
};

const toLocalISO = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

type SortConfig = {
    key: string | null;
    direction: 'asc' | 'desc' | null;
};

interface CreditSummary {
    totalCredits: number;
    unpaidCount: number;
    partialCount: number;
    paidCount: number;
    totalUnpaid: number;
    totalPartial: number;
    totalPaid: number;
}

export default function CreditPage() {
    const [credits, setCredits] = useState<Credit[]>([]);
    const [summary, setSummary] = useState<CreditSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
    const [isMultiFilterOpen, setIsMultiFilterOpen] = useState(false);
    const [activeSubmenu, setActiveSubmenu] = useState<'status' | 'name' | 'rows' | null>(null);
    const [activeFilters, setActiveFilters] = useState<{ statuses: string[]; names: string[] }>({
        statuses: [],
        names: [],
    });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(defaultCreditForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [detailCredit, setDetailCredit] = useState<Credit | null>(null);
    const [paymentModal, setPaymentModal] = useState<Credit | null>(null);
    const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
    const [tempRange, setTempRange] = useState<DateRange | undefined>(undefined);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [isDateOpen, setIsDateOpen] = useState(false);
    const [isDueDateOpen, setIsDueDateOpen] = useState(false);
    const [isPaymentDateOpen, setIsPaymentDateOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const dropdownRef = useRef<HTMLDivElement>(null);
    const multiFilterRef = useRef<HTMLDivElement>(null);
    const dateRef = useRef<HTMLDivElement>(null);
    const dueDateRef = useRef<HTMLDivElement>(null);
    const paymentDateRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [creditsRes, summaryRes] = await Promise.all([
                axiosInstance.get('/credit/list'),
                axiosInstance.get('/credit/summary'),
            ]);
            setCredits(creditsRes.data.data);
            setSummary(summaryRes.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsFilterOpen(false);
                setTempRange(dateRange);
            }
            if (multiFilterRef.current && !multiFilterRef.current.contains(e.target as Node)) {
                setIsMultiFilterOpen(false);
                setActiveSubmenu(null);
            }
            if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
                setIsDateOpen(false);
            }
            if (dueDateRef.current && !dueDateRef.current.contains(e.target as Node)) {
                setIsDueDateOpen(false);
            }
            if (paymentDateRef.current && !paymentDateRef.current.contains(e.target as Node)) {
                setIsPaymentDateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [dateRange]);

    const allCreditorNames = useMemo(() => {
        const names = credits.map(c => c.creditor_name).filter(Boolean);
        return [...new Set(names)].sort();
    }, [credits]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const getTotalPaid = (credit: Credit) => {
        return credit.credit_payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
    };

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key == key) {
            if (sortConfig.direction == 'asc') direction = 'desc';
            else if (sortConfig.direction == 'desc') direction = null;
        }
        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortIcon = (key: string) => {
        if (sortConfig.key != key || !sortConfig.direction) {
            return <ChevronsUpDown size={14} className="ml-1 opacity-50" />;
        }
        const Icon = sortConfig.direction == 'asc' ? ChevronUp : ChevronDown;
        return <Icon size={14} className="ml-1 text-blue-500" />;
    };

    const toggleFilter = (group: 'statuses' | 'names', value: string) => {
        setActiveFilters(prev => {
            const current = prev[group];
            const next = current.includes(value)
                ? current.filter(v => v != value)
                : [...current, value];
            return { ...prev, [group]: next };
        });
    };

    const processedCredits = useMemo(() => {
        let result = credits.filter(c => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [c.creditor_name, c.notes, c.status]
                .some(f => f?.toLowerCase().includes(query));
            const matchesStatus = activeFilters.statuses.length == 0 || activeFilters.statuses.includes(c.status);
            const matchesName = activeFilters.names.length == 0 || activeFilters.names.includes(c.creditor_name);

            if (!dateRange?.from || !dateRange?.to) {
                return matchesSearch && matchesStatus && matchesName;
            }

            const fDate = new Date(c.date);
            const start = new Date(dateRange.from); start.setHours(0, 0, 0, 0);
            const end = new Date(dateRange.to); end.setHours(23, 59, 59, 999);

            return matchesSearch && matchesStatus && matchesName && (fDate >= start && fDate <= end);
        });

        if (sortConfig.key && sortConfig.direction) {
            result = [...result].sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                if (sortConfig.key == 'amount') {
                    aVal = Number(a.amount);
                    bVal = Number(b.amount);
                } else if (sortConfig.key == 'creditor_name') {
                    aVal = a.creditor_name;
                    bVal = b.creditor_name;
                } else if (sortConfig.key == 'date') {
                    aVal = new Date(a.date).getTime();
                    bVal = new Date(b.date).getTime();
                } else if (sortConfig.key == 'status') {
                    aVal = a.status;
                    bVal = b.status;
                }

                if (aVal < bVal) return sortConfig.direction == 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction == 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [credits, searchQuery, sortConfig, activeFilters, dateRange]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, dateRange, sortConfig, activeFilters]);

    const totalPages = Math.ceil(processedCredits.length / itemsPerPage);
    const paginatedCredits = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return processedCredits.slice(startIndex, startIndex + itemsPerPage);
    }, [processedCredits, currentPage, itemsPerPage]);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    const handleEdit = (credit: Credit) => {
        setForm({
            creditor_name: credit.creditor_name,
            amount: String(credit.amount),
            notes: credit.notes || '',
            date: new Date(credit.date).toISOString().split('T')[0],
            due_date: credit.due_date ? new Date(credit.due_date).toISOString().split('T')[0] : '',
        });
        setEditId(credit.id);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);
        try {
            const payload = {
                creditor_name: form.creditor_name,
                amount: Number(form.amount),
                notes: form.notes || undefined,
                date: form.date,
                due_date: form.due_date || undefined,
            };

            if (editId) {
                await axiosInstance.put(`/credit/update/${editId}`, payload);
            } else {
                await axiosInstance.post('/credit/create', payload);
            }

            setShowForm(false);
            setForm(defaultCreditForm);
            setEditId(null);
            fetchData();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message
                || err.response?.data?.error
                || err.message
                || 'Gagal menyimpan kredit. Cek kembali input Anda.';
            setFormError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/credit/delete/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
        finally { setDeleteId(null); }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModal) return;
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/credit/${paymentModal.id}/payment`, {
                amount: Number(paymentForm.amount),
                notes: paymentForm.notes || undefined,
                date: paymentForm.date,
            });
            setPaymentModal(null);
            setPaymentForm(defaultPaymentForm);
            fetchData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalActiveFilters = activeFilters.statuses.length + activeFilters.names.length;

    const CustomCheckbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
        <div
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 cursor-pointer transition-colors group"
            onClick={(e) => {
                e.stopPropagation();
                onChange();
            }}
        >
            <div className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-400'}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={4} />}
            </div>
            <span className={`text-sm transition-colors capitalize ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{label}</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-0">

            {/* Summary Cards */}
            {!isLoading && summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Creditors</p>
                        <p className="text-white text-2xl font-bold">{summary.totalCredits}</p>
                    </div>
                    <div className="bg-gray-900 border border-red-900/30 rounded-xl p-4">
                        <p className="text-red-400 text-xs uppercase tracking-wide mb-1">Unpaid</p>
                        <p className="text-red-400 text-2xl font-bold">{formatCurrency(summary.totalUnpaid)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.unpaidCount} creditors</p>
                    </div>
                    <div className="bg-gray-900 border border-yellow-900/30 rounded-xl p-4">
                        <p className="text-yellow-400 text-xs uppercase tracking-wide mb-1">Partial</p>
                        <p className="text-yellow-400 text-2xl font-bold">{formatCurrency(summary.totalPartial)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.partialCount} creditors</p>
                    </div>
                    <div className="bg-gray-900 border border-green-900/30 rounded-xl p-4">
                        <p className="text-green-400 text-xs uppercase tracking-wide mb-1">Paid</p>
                        <p className="text-green-400 text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.paidCount} creditors</p>
                    </div>
                </div>
            )}

            {/* Header Controls */}
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
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border text-sm font-medium rounded-xl transition ${isFilterOpen ? 'bg-gray-800 border-blue-500 text-white' : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        <CalendarDays size={18} className="text-gray-400" />
                        <span className="hidden md:inline">{dateRange?.from && dateRange?.to ? `${formatDate(dateRange.from)} – ${formatDate(dateRange.to)}` : 'Date'}</span>
                    </button>

                    {isFilterOpen && (
                        <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:right-0 md:translate-x-0 mt-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 overflow-hidden w-[90vw] sm:w-max">
                            <div className="p-2.5 rdp-dark flex justify-center">
                                <DayPicker
                                    mode="range"
                                    selected={tempRange}
                                    onSelect={setTempRange}
                                    numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                                    showOutsideDays={false}
                                />
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

                {/* Multi Filter */}
                <div className="relative shrink-0" ref={multiFilterRef}>
                    <button
                        onClick={() => { setIsMultiFilterOpen(!isMultiFilterOpen); setActiveSubmenu(null); }}
                        className={`flex items-center justify-center gap-2 px-3 py-2.5 border text-sm font-medium rounded-xl transition ${isMultiFilterOpen || totalActiveFilters > 0
                            ? 'bg-gray-800 border-blue-500 text-white'
                            : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                            }`}
                    >
                        <Filter size={18} className={totalActiveFilters > 0 ? 'text-blue-400' : 'text-gray-500'} />
                        <span className="hidden md:inline">Filters</span>
                        {totalActiveFilters > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{totalActiveFilters}</span>
                        )}
                    </button>

                    {isMultiFilterOpen && (
                        <div className="absolute right-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-60 py-2 overflow-visible ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100">

                            {/* Name Filter */}
                            <div className="relative group border-t border-gray-800/50 md:border-t-0">
                                <div
                                    className="px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                    onClick={() => { if (window.innerWidth < 768) setActiveSubmenu(activeSubmenu == 'name' ? null : 'name'); }}
                                >
                                    <span className="font-medium">Filter by Name</span>
                                    <ChevronRight size={14} className={`opacity-50 transition-transform ${activeSubmenu == 'name' ? 'rotate-90' : ''}`} />
                                </div>
                                <div className={`bg-gray-950/50 md:bg-gray-900 md:border md:border-gray-800 md:rounded-2xl md:shadow-2xl md:absolute md:right-full md:top-0 md:mr-1 md:w-52 py-1 max-h-60 overflow-y-auto custom-scrollbar ${activeSubmenu == 'name' ? 'block' : 'hidden md:group-hover:block'}`}>
                                    {allCreditorNames.length > 0 ? allCreditorNames.map(n => (
                                        <CustomCheckbox key={n} checked={activeFilters.names.includes(n)} onChange={() => toggleFilter('names', n)} label={n} />
                                    )) : (
                                        <p className="px-4 py-2 text-xs text-gray-500 italic">No creditors yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="relative group">
                                <div
                                    className="px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                    onClick={() => { if (window.innerWidth < 768) setActiveSubmenu(activeSubmenu == 'status' ? null : 'status'); }}
                                >
                                    <span className="font-medium">Filter by Status</span>
                                    <ChevronRight size={14} className={`opacity-50 transition-transform ${activeSubmenu == 'status' ? 'rotate-90' : ''}`} />
                                </div>
                                <div className={`bg-gray-950/50 md:bg-gray-900 md:border md:border-gray-800 md:rounded-2xl md:shadow-2xl md:absolute md:right-full md:top-0 md:mr-1 md:w-44 py-1 ${activeSubmenu == 'status' ? 'block' : 'hidden md:group-hover:block'}`}>
                                    {STATUS_OPTIONS.map(s => (
                                        <CustomCheckbox key={s} checked={activeFilters.statuses.includes(s)} onChange={() => toggleFilter('statuses', s)} label={s} />
                                    ))}
                                </div>
                            </div>

                            {/* Rows Per Page Filter */}
                            <div className="relative group border-t border-gray-800/50">
                                <div
                                    className="px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            setActiveSubmenu(activeSubmenu == 'rows' ? null : 'rows');
                                        }
                                    }}
                                >
                                    <span className="font-medium">Rows per page</span>
                                    <ChevronRight size={14} className={`opacity-50 transition-transform md:group-hover:rotate-0 ${activeSubmenu == 'rows' ? 'rotate-90' : ''}`} />
                                </div>

                                <div className={`bg-gray-950/50 md:bg-gray-900 md:border md:border-gray-800 md:rounded-2xl md:shadow-2xl md:absolute md:right-full md:top-0 md:mr-1 md:w-44 py-1
                                        ${activeSubmenu == 'rows' ? 'block' : 'hidden md:group-hover:block'}
                                    `}>
                                    {[10, 25, 50, 100].map(val => (
                                        <div
                                            key={val}
                                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-800/50 cursor-pointer transition-colors group"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setItemsPerPage(val);
                                                setCurrentPage(1);
                                                if (window.innerWidth < 768) setActiveSubmenu(null);
                                            }}
                                        >
                                            <div className={`w-4 h-4 shrink-0 rounded-full border flex items-center justify-center transition-all ${itemsPerPage == val ? 'border-blue-600 bg-blue-600/20' : 'border-gray-600 group-hover:border-gray-400'
                                                }`}>
                                                {itemsPerPage == val && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                                            </div>
                                            <span className={`text-sm transition-colors ${itemsPerPage == val ? 'text-white font-semibold' : 'text-gray-400 group-hover:text-gray-200'}`}>
                                                {val} Rows
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {totalActiveFilters > 0 && (
                                <div className="px-2 mt-2 pt-2 border-t border-gray-800/50">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setActiveFilters({ statuses: [], names: [] }); }}
                                        className="w-full text-center py-2 text-xs font-semibold text-red-400 hover:text-red-300"
                                    >
                                        Clear All
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Refresh */}
                <button onClick={fetchData} disabled={isLoading}
                    className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    <span className="hidden md:inline">Refresh</span>
                </button>

                {/* Add Credit */}
                <button onClick={() => setShowForm(true)}
                    className="shrink-0 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-900/20"
                >
                    <Plus size={18} /> <span className="hidden md:inline">Add Credit</span>
                </button>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-300 text-[13px] uppercase tracking-wider border-b border-gray-800 select-none text-center">
                                <th onClick={() => requestSort('creditor_name')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Creditor {getSortIcon('creditor_name')}</div>
                                </th>
                                <th onClick={() => requestSort('status')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Status {getSortIcon('status')}</div>
                                </th>
                                <th onClick={() => requestSort('date')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Date {getSortIcon('date')}</div>
                                </th>
                                <th onClick={() => requestSort('amount')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Amount {getSortIcon('amount')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-center">Paid</th>
                                <th className="px-6 py-4 font-bold text-center">Remaining</th>
                                <th className="px-6 py-4 font-bold text-center">Notes</th>
                                <th className="px-6 py-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-center">
                            {isLoading ? (
                                [1, 2, 3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={8} className="px-6 py-4"><div className="h-12 bg-gray-800/50 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : paginatedCredits.length > 0 ? (
                                paginatedCredits.map((credit) => {
                                    const status = statusConfig[credit.status];
                                    const StatusIcon = status.icon;
                                    const amount = Number(credit.amount);
                                    const paid = getTotalPaid(credit);
                                    const remaining = Math.max(0, amount - paid);

                                    return (
                                        <tr key={credit.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium text-sm">{credit.creditor_name}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white text-sm">{formatDate(new Date(credit.date))}</td>
                                            <td className="px-6 py-4 text-white font-semibold text-sm">{amount > 0 ? formatCurrency(amount) : '-'}</td>
                                            <td className="px-6 py-4 text-sm">
                                                {paid > 0
                                                    ? <span className="text-green-400 font-medium">{formatCurrency(paid)}</span>
                                                    : <span className="text-white">-</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {remaining > 0
                                                    ? <span className="text-red-400 font-medium">{formatCurrency(remaining)}</span>
                                                    : <span className="text-green-400 font-medium">✓ Lunas</span>
                                                }
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-white font-medium text-sm">{credit.notes || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleEdit(credit)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition" title="Edit">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button onClick={() => setDetailCredit(credit)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition" title="Detail">
                                                        <CreditCard size={16} />
                                                    </button>
                                                    {credit.status != 'paid' && (
                                                        <button onClick={() => { setPaymentModal(credit); setFormError(null); }} className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition" title="Add Payment">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setDeleteId(credit.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center text-gray-500 italic text-sm">No credits found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Button Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-gray-900 border-t border-gray-800 gap-4">
                        <span className="text-sm text-gray-400">
                            Displays {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, processedCredits.length)} From {processedCredits.length}
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage == 1}
                                className="flex items-center gap-1 px-2 py-2 text-[15px] font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition bg-transparent"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} /> Previous
                            </button>

                            <div className="flex items-center gap-1 mx-2">
                                {getPageNumbers().map((page, index) => (
                                    page == '...' ? (
                                        <span key={`ellipsis-${index}`} className="px-2 py-2 text-white font-bold tracking-widest">...</span>
                                    ) : (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentPage(page as number)}
                                            className={`min-w-9.5 h-9.5 flex items-center justify-center rounded-xl text-[15px] font-bold transition-all ${currentPage == page
                                                ? 'bg-gray-800 border border-gray-700 text-white shadow-sm'
                                                : 'text-blue-500 hover:bg-gray-800/40 hover:text-blue-400 bg-transparent'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage == totalPages}
                                className="flex items-center gap-1 px-2 py-2 text-[15px] font-semibold text-blue-500 hover:text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition bg-transparent"
                            >
                                Next <ChevronRight size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Add / Edit Credit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{editId ? 'Edit Credit' : 'New Credit'}</h3>
                            <button onClick={() => { setShowForm(false); setForm(defaultCreditForm); setFormError(null); setEditId(null); }} className="text-gray-500 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                value={form.creditor_name}
                                onChange={(e) => setForm({ ...form, creditor_name: e.target.value })}
                                placeholder="Creditor Name (e.g. Bank BCA, John)"
                                className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            <div>
                                <label className="text-gray-500 text-xs mb-1.5 block">Total Amount (IDR)</label>
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="Amount"
                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <input
                                type="text"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <div className="relative" ref={dateRef}>
                                    <label className="text-gray-500 text-xs mb-1.5 block">Credit Date</label>
                                    <button type="button" onClick={() => setIsDateOpen(!isDateOpen)} className="w-full bg-gray-800 text-left px-4 py-3 rounded-xl text-white text-sm flex items-center justify-between border border-transparent focus:border-blue-500 transition">
                                        <span className={form.date ? 'text-white' : 'text-gray-500'}>{form.date ? formatDate(new Date(form.date)) : 'Select Date'}</span>
                                        <CalendarDays size={18} className="text-gray-500" />
                                    </button>
                                    {isDateOpen && (
                                        <div className="absolute left-0 bottom-full mb-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-110 p-2 rdp-dark animate-in fade-in zoom-in-95 duration-200">
                                            <DayPicker mode="single" selected={new Date(form.date)} onSelect={(date) => { if (date) { setForm({ ...form, date: toLocalISO(date) }); setIsDateOpen(false); } }} />
                                        </div>
                                    )}
                                </div>
                                <div className="relative" ref={dueDateRef}>
                                    <label className="text-gray-500 text-xs mb-1.5 block">Due Date (optional)</label>
                                    <button type="button" onClick={() => setIsDueDateOpen(!isDueDateOpen)} className="w-full bg-gray-800 text-left px-4 py-3 rounded-xl text-white text-sm flex items-center justify-between border border-transparent focus:ring-2 focus:ring-blue-500 transition">
                                        <span className={form.due_date ? 'text-white' : 'text-gray-500'}>{form.due_date ? formatDate(new Date(form.due_date)) : 'Due Date'}</span>
                                        <CalendarDays size={18} className="text-gray-500" />
                                    </button>
                                    {isDueDateOpen && (
                                        <div className="absolute right-0 bottom-full mb-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-110 p-2 rdp-dark animate-in fade-in zoom-in-95 duration-200">
                                            <DayPicker mode="single" selected={form.due_date ? new Date(form.due_date) : undefined} onSelect={(date) => { setForm({ ...form, due_date: date ? toLocalISO(date) : '' }); setIsDueDateOpen(false); }} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : editId ? 'Update Credit' : 'Save Credit'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {detailCredit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-white font-bold text-lg">{detailCredit.creditor_name}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium mt-1 ${statusConfig[detailCredit.status].bg} ${statusConfig[detailCredit.status].color}`}>
                                    {statusConfig[detailCredit.status].label}
                                </span>
                            </div>
                            <button onClick={() => setDetailCredit(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>

                        <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Date</span>
                                <span className="text-white">{formatDate(new Date(detailCredit.date))}</span>
                            </div>
                            {detailCredit.due_date && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Due Date</span>
                                    <span className="text-yellow-400">{formatDate(new Date(detailCredit.due_date))}</span>
                                </div>
                            )}
                            {detailCredit.notes && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Notes</span>
                                    <span className="text-white">{detailCredit.notes}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-2 mt-2">
                                <span className="text-gray-300">Total Credit</span>
                                <span className="text-white">{formatCurrency(Number(detailCredit.amount))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Total Paid</span>
                                <span className="text-green-400">{formatCurrency(getTotalPaid(detailCredit))}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-300">Remaining</span>
                                <span className="text-red-400">{formatCurrency(Math.max(0, Number(detailCredit.amount) - getTotalPaid(detailCredit)))}</span>
                            </div>
                        </div>

                        {detailCredit.credit_payments.length > 0 && (
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-bold mb-2">Payment History</p>
                                <div className="space-y-2">
                                    {detailCredit.credit_payments.map(p => (
                                        <div key={p.id} className="bg-gray-800/50 rounded-xl p-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-white text-sm font-medium">Payment</p>
                                                {p.notes && <p className="text-gray-500 text-xs">{p.notes}</p>}
                                                <p className="text-gray-600 text-xs">{formatDate(new Date(p.date))}</p>
                                            </div>
                                            <span className="text-green-400 font-semibold text-sm">{formatCurrency(Number(p.amount))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold text-xl">Add Payment</h3>
                            <button onClick={() => { setPaymentModal(null); setPaymentForm(defaultPaymentForm); setFormError(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            {paymentModal.creditor_name} — Remaining: <span className="text-red-400 font-semibold">{formatCurrency(Math.max(0, Number(paymentModal.amount) - getTotalPaid(paymentModal)))}</span>
                        </p>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Amount (IDR)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" required />
                            <input type="text" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Notes (optional)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
                            <div className="relative" ref={paymentDateRef}>
                                <button type="button" onClick={() => setIsPaymentDateOpen(!isPaymentDateOpen)} className="w-full bg-gray-800 text-left px-4 py-3 rounded-xl text-white text-sm flex items-center justify-between border border-transparent focus:ring-2 focus:ring-blue-500 transition">
                                    <span className={paymentForm.date ? 'text-white' : 'text-gray-500'}>{paymentForm.date ? formatDate(new Date(paymentForm.date)) : 'Select Date'}</span>
                                    <CalendarDays size={18} className="text-gray-500" />
                                </button>
                                {isPaymentDateOpen && (
                                    <div className="absolute left-0 bottom-full mb-2 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-110 p-2 rdp-dark animate-in fade-in zoom-in-95 duration-200">
                                        <DayPicker mode="single" selected={new Date(paymentForm.date)} onSelect={(date) => { if (date) { setPaymentForm({ ...paymentForm, date: toLocalISO(date) }); setIsPaymentDateOpen(false); } }} />
                                    </div>
                                )}
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Trash2 size={30} /></div>
                        <h3 className="text-white font-bold text-lg mb-2">Delete Credit?</h3>
                        <p className="text-gray-500 text-sm mb-8">
                            All payment history will be deleted. <br />
                            <span className="text-blue-400 font-medium">Any recorded finance expenses will be automatically removed.</span>
                        </p>
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