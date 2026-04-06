'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import { Debt, DebtSummary } from '@/lib/types';
import {
    Search, Pencil, Trash2, Plus, X,
    ChevronsUpDown, ChevronUp, ChevronDown,
    Filter, ChevronRight, Check, Wallet,
    Package, CreditCard, Clock, CheckCircle2,
    AlertCircle, CircleDashed, Plus as PlusIcon
} from 'lucide-react';

const STATUS_OPTIONS = ['unpaid', 'partial', 'paid'];
const TYPE_OPTIONS = ['money', 'item'];

const statusConfig = {
    unpaid: { label: 'Unpaid', color: 'text-red-400', bg: 'bg-red-400/10', icon: AlertCircle },
    partial: { label: 'Partial', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: CircleDashed },
    paid: { label: 'Paid', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
};

const defaultDebtForm = {
    debtor_name: '',
    type: 'money' as 'money' | 'item',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    due_date: '',
    amount: '',
    items: [{ item_name: '', quantity: '', unit: '', price_per_unit: '', total_price: '' }],
};

const defaultPaymentForm = {
    amount: '',
    payment_type: 'money' as 'money' | 'item',
    notes: '',
    date: new Date().toISOString().split('T')[0],
};

type SortConfig = {
    key: string | null;
    direction: 'asc' | 'desc' | null;
};

export default function DebtPage() {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [summary, setSummary] = useState<DebtSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
    const [isMultiFilterOpen, setIsMultiFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ statuses: string[]; types: string[] }>({
        statuses: [],
        types: [],
    });

    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultDebtForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [detailDebt, setDetailDebt] = useState<Debt | null>(null);
    const [paymentModal, setPaymentModal] = useState<Debt | null>(null);
    const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);

    const multiFilterRef = useRef<HTMLDivElement>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [debtsRes, summaryRes] = await Promise.all([
                axiosInstance.get('/debt/list'),
                axiosInstance.get('/debt/summary'),
            ]);
            setDebts(debtsRes.data.data);
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
            if (multiFilterRef.current && !multiFilterRef.current.contains(e.target as Node)) {
                setIsMultiFilterOpen(false);
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

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric',
        });
    };

    const getDebtAmount = (debt: Debt) => {
        if (debt.type == 'money' && debt.debt_money) {
            return Number(debt.debt_money.amount);
        }
        if (debt.type == 'item' && debt.debt_items) {
            return debt.debt_items.reduce((sum, i) => sum + Number(i.total_price ?? 0), 0);
        }
        return 0;
    };

    const getTotalPaid = (debt: Debt) => {
        return debt.debt_payments?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0;
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

    const toggleFilter = (group: 'statuses' | 'types', value: string) => {
        setActiveFilters(prev => {
            const current = prev[group];
            const next = current.includes(value)
                ? current.filter(v => v != value)
                : [...current, value];
            return { ...prev, [group]: next };
        });
    };

    const processedDebts = useMemo(() => {
        let result = debts.filter(d => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [d.debtor_name, d.notes, d.type, d.status]
                .some(f => f?.toLowerCase().includes(query));
            const matchesStatus = activeFilters.statuses.length == 0 || activeFilters.statuses.includes(d.status);
            const matchesType = activeFilters.types.length == 0 || activeFilters.types.includes(d.type);
            return matchesSearch && matchesStatus && matchesType;
        });

        if (sortConfig.key && sortConfig.direction) {
            result = [...result].sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';

                if (sortConfig.key == 'amount') {
                    aVal = getDebtAmount(a);
                    bVal = getDebtAmount(b);
                } else if (sortConfig.key == 'type') {
                    aVal = a.type;
                    bVal = b.type;
                } else if (sortConfig.key == 'debtor_name') {
                    aVal = a.debtor_name;
                    bVal = b.debtor_name;
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
    }, [debts, searchQuery, sortConfig, activeFilters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setFormError(null);

        try {
            const payload: any = {
                debtor_name: form.debtor_name,
                type: form.type,
                notes: form.notes || undefined,
                date: form.date,
                due_date: form.due_date || undefined,
            };

            if (form.type == 'money') {
                payload.amount = Number(form.amount);
            } else {
                payload.items = form.items.map(item => ({
                    item_name: item.item_name,
                    quantity: Number(item.quantity),
                    unit: item.unit,
                    price_per_unit: item.price_per_unit ? Number(item.price_per_unit) : undefined,
                    total_price: item.total_price ? Number(item.total_price) : undefined,
                }));
            }

            await axiosInstance.post('/debt/create', payload);
            setShowForm(false);
            setForm(defaultDebtForm);
            fetchData();
        } catch (err: any) {
            setFormError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/debt/delete/${id}`);
            fetchData();
        } catch (err) { console.error(err); }
        finally { setDeleteId(null); }
    };

    const handleAddPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentModal) return;
        setIsSubmitting(true);
        try {
            await axiosInstance.post(`/debt/${paymentModal.id}/pay`, {
                amount: Number(paymentForm.amount),
                payment_type: paymentForm.payment_type,
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

    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { item_name: '', quantity: '', unit: '', price_per_unit: '', total_price: '' }],
        }));
    };

    const removeItem = (index: number) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i != index),
        }));
    };

    const updateItem = (index: number, field: string, value: string) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.map((item, i) => {
                if (i != index) return item;
                const updated = { ...item, [field]: value };
                if (field == 'quantity' || field == 'price_per_unit') {
                    const qty = Number(field == 'quantity' ? value : item.quantity);
                    const price = Number(field == 'price_per_unit' ? value : item.price_per_unit);
                    if (qty && price) updated.total_price = String(qty * price);
                }
                return updated;
            }),
        }));
    };

    const totalActiveFilters = activeFilters.statuses.length + activeFilters.types.length;

    const CustomCheckbox = ({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) => (
        <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-800/50 cursor-pointer transition-colors group" onClick={onChange}>
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${checked ? 'bg-blue-600 border-blue-600' : 'border-gray-600 group-hover:border-gray-400'}`}>
                {checked && <Check size={12} className="text-white" strokeWidth={4} />}
            </div>
            <span className={`text-sm transition-colors capitalize ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{label}</span>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto">
            {/* Summary Cards */}
            {!isLoading && summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                        <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Total Debtors</p>
                        <p className="text-white text-2xl font-bold">{summary.totalDebts}</p>
                    </div>
                    <div className="bg-gray-900 border border-red-900/30 rounded-xl p-4">
                        <p className="text-red-400 text-xs uppercase tracking-wide mb-1">Unpaid</p>
                        <p className="text-red-400 text-2xl font-bold">{formatCurrency(summary.totalUnpaid)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.unpaidCount} people</p>
                    </div>
                    <div className="bg-gray-900 border border-yellow-900/30 rounded-xl p-4">
                        <p className="text-yellow-400 text-xs uppercase tracking-wide mb-1">Partial</p>
                        <p className="text-yellow-400 text-2xl font-bold">{formatCurrency(summary.totalPartial)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.partialCount} people</p>
                    </div>
                    <div className="bg-gray-900 border border-green-900/30 rounded-xl p-4">
                        <p className="text-green-400 text-xs uppercase tracking-wide mb-1">Paid</p>
                        <p className="text-green-400 text-2xl font-bold">{formatCurrency(summary.totalPaid)}</p>
                        <p className="text-gray-500 text-xs mt-0.5">{summary.paidCount} people</p>
                    </div>
                </div>
            )}

            {/* Header Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto order-2 md:order-1">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="Search debtor..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 transition"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Multi Filter */}
                    <div className="relative w-full md:w-auto" ref={multiFilterRef}>
                        <button
                            onClick={() => setIsMultiFilterOpen(!isMultiFilterOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-xl transition w-full ${
                                isMultiFilterOpen || totalActiveFilters > 0
                                    ? 'bg-gray-800 border-blue-500 text-white'
                                    : 'bg-gray-900 border-gray-800 text-gray-300 hover:bg-gray-800'
                            }`}
                        >
                            <Filter size={16} className={totalActiveFilters > 0 ? 'text-blue-400' : 'text-gray-500'} />
                            <span>Filters</span>
                            {totalActiveFilters > 0 && (
                                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{totalActiveFilters}</span>
                            )}
                        </button>

                        {isMultiFilterOpen && (
                            <div className="absolute left-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-50 py-2 ring-1 ring-black/50">
                                <div className="relative group px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all">
                                    <span className="font-medium">Filter by Status</span>
                                    <ChevronRight size={14} className="opacity-50" />
                                    <div className="absolute left-[calc(100%+4px)] top-0 w-44 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl hidden group-hover:block py-2">
                                        {STATUS_OPTIONS.map(s => (
                                            <CustomCheckbox key={s} checked={activeFilters.statuses.includes(s)} onChange={() => toggleFilter('statuses', s)} label={s} />
                                        ))}
                                    </div>
                                </div>
                                <div className="relative group px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all">
                                    <span className="font-medium">Filter by Type</span>
                                    <ChevronRight size={14} className="opacity-50" />
                                    <div className="absolute left-[calc(100%+4px)] top-0 w-44 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl hidden group-hover:block py-2">
                                        {TYPE_OPTIONS.map(t => (
                                            <CustomCheckbox key={t} checked={activeFilters.types.includes(t)} onChange={() => toggleFilter('types', t)} label={t} />
                                        ))}
                                    </div>
                                </div>
                                {totalActiveFilters > 0 && (
                                    <div className="px-2 mt-2 pt-2 border-t border-gray-800/50">
                                        <button onClick={() => setActiveFilters({ statuses: [], types: [] })} className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all">
                                            Clear Filters
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="w-full md:w-auto order-1 md:order-2 flex justify-end">
                    <button onClick={() => setShowForm(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-900/20">
                        <Plus size={18} /> Add Debt
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-300 text-[13px] uppercase tracking-wider border-b border-gray-800 select-none">
                                <th onClick={() => requestSort('type')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Type {getSortIcon('type')}</div>
                                </th>
                                <th onClick={() => requestSort('debtor_name')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Debtor {getSortIcon('debtor_name')}</div>
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
                                <th className="px-6 py-4 font-bold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-center">
                            {isLoading ? (
                                [1,2,3].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-4"><div className="h-12 bg-gray-800/50 rounded-lg" /></td>
                                    </tr>
                                ))
                            ) : processedDebts.length > 0 ? (
                                processedDebts.map((debt) => {
                                    const status = statusConfig[debt.status];
                                    const StatusIcon = status.icon;
                                    const amount = getDebtAmount(debt);
                                    const paid = getTotalPaid(debt);

                                    return (
                                        <tr key={debt.id} className="hover:bg-gray-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${debt.type == 'money' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'}`}>
                                                    {debt.type == 'money' ? <Wallet size={12} /> : <Package size={12} />}
                                                    {debt.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-white font-medium text-sm">{debt.debtor_name}</p>
                                                    {debt.notes && <p className="text-gray-500 text-xs mt-0.5 truncate max-w-32">{debt.notes}</p>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${status.bg} ${status.color}`}>
                                                    <StatusIcon size={12} />
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(debt.date)}</td>
                                            <td className="px-6 py-4 text-white font-semibold text-sm">
                                                {amount > 0 ? formatCurrency(amount) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {paid > 0 ? (
                                                    <span className="text-green-400 font-medium">{formatCurrency(paid)}</span>
                                                ) : (
                                                    <span className="text-gray-600">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => setDetailDebt(debt)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition" title="Detail">
                                                        <CreditCard size={16} />
                                                    </button>
                                                    {debt.status != 'paid' && (
                                                        <button onClick={() => { setPaymentModal(debt); setFormError(null); }} className="p-2 text-gray-500 hover:text-green-400 hover:bg-green-400/10 rounded-lg transition" title="Add Payment">
                                                            <CheckCircle2 size={16} />
                                                        </button>
                                                    )}
                                                    <button onClick={() => setDeleteId(debt.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-500 italic text-sm">No debts found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add Debt Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">New Debt</h3>
                            <button onClick={() => { setShowForm(false); setForm(defaultDebtForm); setFormError(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Debtor Name */}
                            <input
                                type="text"
                                value={form.debtor_name}
                                onChange={(e) => setForm({ ...form, debtor_name: e.target.value })}
                                placeholder="Debtor Name"
                                className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                required
                            />

                            {/* Type Toggle */}
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setForm({ ...form, type: 'item' })}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${form.type == 'item' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    <Package size={16} /> Item
                                </button>
                                <button type="button" onClick={() => setForm({ ...form, type: 'money' })}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${form.type == 'money' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    <Wallet size={16} /> Money
                                </button>
                            </div>

                            {/* Money Fields */}
                            {form.type == 'money' && (
                                <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="Amount (IDR)"
                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            )}

                            {/* Item Fields */}
                            {form.type == 'item' && (
                                <div className="space-y-3">
                                    <p className="text-gray-400 text-xs uppercase tracking-wide font-bold">Items</p>
                                    {form.items.map((item, index) => (
                                        <div key={index} className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400 text-xs font-medium">Item {index + 1}</span>
                                                {form.items.length > 1 && (
                                                    <button type="button" onClick={() => removeItem(index)} className="text-red-400 hover:text-red-300 transition">
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                type="text"
                                                value={item.item_name}
                                                onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                                                placeholder="Item Name (e.g. Beras)"
                                                className="w-full bg-gray-800 border-none rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                    placeholder="Quantity"
                                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                                <input
                                                    type="text"
                                                    value={item.unit}
                                                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                                                    placeholder="Unit (kg, pcs)"
                                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="number"
                                                    value={item.price_per_unit}
                                                    onChange={(e) => updateItem(index, 'price_per_unit', e.target.value)}
                                                    placeholder="Price/unit (optional)"
                                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                                <input
                                                    type="number"
                                                    value={item.total_price}
                                                    onChange={(e) => updateItem(index, 'total_price', e.target.value)}
                                                    placeholder="Total price (optional)"
                                                    className="w-full bg-gray-800 border-none rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button type="button" onClick={addItem} className="w-full py-2.5 border border-dashed border-gray-700 hover:border-blue-500 text-gray-400 hover:text-blue-400 rounded-xl text-sm transition flex items-center justify-center gap-2">
                                        <PlusIcon size={16} /> Add Item
                                    </button>
                                </div>
                            )}

                            {/* Notes */}
                            <input
                                type="text"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="Notes (optional)"
                                className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500"
                            />

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-500 text-xs mb-1.5 block">Debt Date</label>
                                    <input
                                        type="date"
                                        value={form.date}
                                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                                        className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-gray-500 text-xs mb-1.5 block">Due Date (optional)</label>
                                    <input
                                        type="date"
                                        value={form.due_date}
                                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                                        className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : 'Save Debt'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Detail Transaction */}
            {detailDebt && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-white font-bold text-lg">{detailDebt.debtor_name}</h3>
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium mt-1 ${statusConfig[detailDebt.status].bg} ${statusConfig[detailDebt.status].color}`}>
                                    {statusConfig[detailDebt.status].label}
                                </span>
                            </div>
                            <button onClick={() => setDetailDebt(null)} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>

                        {/* Debt Info */}
                        <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Type</span>
                                <span className="text-white capitalize">{detailDebt.type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Date</span>
                                <span className="text-white">{formatDate(detailDebt.date)}</span>
                            </div>
                            {detailDebt.due_date && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Due Date</span>
                                    <span className="text-yellow-400">{formatDate(detailDebt.due_date)}</span>
                                </div>
                            )}
                            {detailDebt.notes && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Notes</span>
                                    <span className="text-white">{detailDebt.notes}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-semibold border-t border-gray-700 pt-2 mt-2">
                                <span className="text-gray-300">Total Debt</span>
                                <span className="text-white">{formatCurrency(getDebtAmount(detailDebt))}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-300">Total Paid</span>
                                <span className="text-green-400">{formatCurrency(getTotalPaid(detailDebt))}</span>
                            </div>
                            <div className="flex justify-between text-sm font-bold">
                                <span className="text-gray-300">Remaining</span>
                                <span className="text-red-400">{formatCurrency(Math.max(0, getDebtAmount(detailDebt) - getTotalPaid(detailDebt)))}</span>
                            </div>
                        </div>

                        {/* Items */}
                        {detailDebt.type == 'item' && detailDebt.debt_items.length > 0 && (
                            <div className="mb-4">
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-bold mb-2">Items</p>
                                <div className="space-y-2">
                                    {detailDebt.debt_items.map(item => (
                                        <div key={item.id} className="bg-gray-800/50 rounded-xl p-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-white text-sm font-medium">{item.item_name}</p>
                                                <p className="text-gray-500 text-xs">{item.quantity} {item.unit}</p>
                                            </div>
                                            {item.total_price && (
                                                <span className="text-white text-sm font-semibold">{formatCurrency(Number(item.total_price))}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment History */}
                        {detailDebt.debt_payments.length > 0 && (
                            <div>
                                <p className="text-gray-400 text-xs uppercase tracking-wide font-bold mb-2">Payment History</p>
                                <div className="space-y-2">
                                    {detailDebt.debt_payments.map(p => (
                                        <div key={p.id} className="bg-gray-800/50 rounded-xl p-3 flex justify-between items-center">
                                            <div>
                                                <p className="text-white text-sm font-medium capitalize">{p.payment_type} payment</p>
                                                {p.notes && <p className="text-gray-500 text-xs">{p.notes}</p>}
                                                <p className="text-gray-600 text-xs">{formatDate(p.date)}</p>
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

            {/* Payment Transaction */}
            {paymentModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold text-xl">Add Payment</h3>
                            <button onClick={() => { setPaymentModal(null); setPaymentForm(defaultPaymentForm); setFormError(null); }} className="text-gray-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-gray-400 text-sm mb-6">{paymentModal.debtor_name} — Remaining: <span className="text-red-400 font-semibold">{formatCurrency(Math.max(0, getDebtAmount(paymentModal) - getTotalPaid(paymentModal)))}</span></p>

                        {formError && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{formError}</p>
                            </div>
                        )}

                        <form onSubmit={handleAddPayment} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => setPaymentForm({ ...paymentForm, payment_type: 'money' })}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${paymentForm.payment_type == 'money' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    <Wallet size={16} /> Money
                                </button>
                                <button type="button" onClick={() => setPaymentForm({ ...paymentForm, payment_type: 'item' })}
                                    className={`py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 ${paymentForm.payment_type == 'item' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-500'}`}>
                                    <Package size={16} /> Item
                                </button>
                            </div>
                            <input type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} placeholder="Amount (IDR)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" required />
                            <input type="text" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} placeholder="Notes (optional)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500" />
                            <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl shadow-lg transition disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : 'Record Payment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Transaction */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Trash2 size={30} /></div>
                        <h3 className="text-white font-bold text-lg mb-2">Delete Debt?</h3>
                        <p className="text-gray-500 text-sm mb-8">All payment history will also be deleted.</p>
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