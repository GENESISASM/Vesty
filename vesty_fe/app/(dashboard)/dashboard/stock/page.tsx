'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import axiosInstance from '@/lib/axios';
import { Stock, StockHistory } from '@/lib/types';
import {
    Search, Pencil, Trash2,
    Plus, X, ChevronsUpDown,
    ChevronUp, ChevronDown, Filter,
    ChevronRight, Check, History,
    PackagePlus, PackageMinus, RefreshCw
} from 'lucide-react';

const CATEGORIES = ['Apparel', 'Electronics', 'Groceries', 'Hardware & Tools', 'Health & Beauty', 'Homecare', 'Snacks & Beverages', 'Stationery', 'Tobacco'];

const defaultStockForm = {
    item_name: '',
    category: '',
    unit: '',
    current_stock: '',
};

const defaultMovementForm = {
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
};

type SortConfig = {
    key: keyof Stock | null;
    direction: 'asc' | 'desc' | null;
};

export default function StockPage() {
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState(defaultStockForm);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: null });
    const [isMultiFilterOpen, setIsMultiFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<{ categories: string[] }>({ categories: [] });
    const [activeSubmenu, setActiveSubmenu] = useState<'category' | null>(null);
    const [movementModal, setMovementModal] = useState<{
        type: 'in' | 'out';
        stockId: string;
        stockName: string;
    } | null>(null);
    const [movementForm, setMovementForm] = useState(defaultMovementForm);
    const [historyModal, setHistoryModal] = useState<{
        stockId: string;
        stockName: string;
    } | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);
    const [isOtherCategory, setIsOtherCategory] = useState(false);

    const multiFilterRef = useRef<HTMLDivElement>(null);

    const fetchStocks = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await axiosInstance.get('/stock/list');
            setStocks(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchStocks(); }, [fetchStocks]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (multiFilterRef.current && !multiFilterRef.current.contains(event.target as Node)) {
                setIsMultiFilterOpen(false);
                setActiveSubmenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const allCategories = useMemo(() => {
        const cats = stocks.map(s => s.category).filter(Boolean) as string[];
        return [...new Set(cats)];
    }, [stocks]);

    const requestSort = (key: keyof Stock) => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key == key) {
            if (sortConfig.direction == 'asc') direction = 'desc';
            else if (sortConfig.direction == 'desc') direction = null;
        }
        setSortConfig({ key: direction ? key : null, direction });
    };

    const getSortIcon = (key: keyof Stock) => {
        const isSelected = sortConfig.key == key;
        if (!isSelected || !sortConfig.direction) return <ChevronsUpDown size={14} className="ml-1 opacity-50" />;
        const Icon = sortConfig.direction == 'asc' ? ChevronUp : ChevronDown;
        return <Icon size={14} className="ml-1 text-blue-500" />;
    };

    const toggleFilter = (category: string) => {
        setActiveFilters(prev => {
            const current = prev.categories;
            const next = current.includes(category)
                ? current.filter(c => c != category)
                : [...current, category];
            return { categories: next };
        });
    };

    const processedStocks = useMemo(() => {
        let result = stocks.filter(s => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = [s.item_name, s.category, s.unit].some(f => f?.toLowerCase().includes(query));
            const matchesCategory = activeFilters.categories.length == 0 || activeFilters.categories.includes(s.category ?? '');
            return matchesSearch && matchesCategory;
        });

        if (sortConfig.key && sortConfig.direction) {
            result = [...result].sort((a, b) => {
                const aVal = a[sortConfig.key as keyof Stock] ?? '';
                const bVal = b[sortConfig.key as keyof Stock] ?? '';
                if (aVal < bVal) return sortConfig.direction == 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction == 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [stocks, searchQuery, sortConfig, activeFilters]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = { ...form, current_stock: Number(form.current_stock) };
            if (editId) {
                await axiosInstance.put(`/stock/update/${editId}`, payload);
            } else {
                await axiosInstance.post('/stock/create', payload);
            }
            setForm(defaultStockForm);
            setShowForm(false);
            setEditId(null);
            setIsOtherCategory(false);
            fetchStocks();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (stock: Stock) => {
        const isPredefined = CATEGORIES.includes(stock.category ?? '');
        setForm({
            item_name: stock.item_name,
            category: stock.category ?? '',
            unit: stock.unit,
            current_stock: String(stock.current_stock),
        });
        setEditId(stock.id);
        setIsOtherCategory(stock.category ? !isPredefined : false);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/stock/delete/${id}`);
            fetchStocks();
        } catch (err) { console.error(err); }
        finally { setDeleteId(null); }
    };

    const handleMovementSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!movementModal) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const payload = {
                quantity: Number(movementForm.quantity),
                notes: movementForm.notes,
                date: movementForm.date,
            };
            await axiosInstance.post(`/stock/${movementModal.stockId}/${movementModal.type}`, payload);
            setMovementModal(null);
            setMovementForm(defaultMovementForm);
            fetchStocks();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchHistory = async (stockId: string, stockName: string) => {
        setHistoryModal({ stockId, stockName });
        setIsHistoryLoading(true);
        try {
            const res = await axiosInstance.get(`/stock/${stockId}/history`);
            setHistory(res.data.data);
        } catch (err) { console.error(err); }
        finally { setIsHistoryLoading(false); }
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };

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
            <span className={`text-sm transition-colors ${checked ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{label}</span>
        </div>
    );

    const totalActiveFilters = activeFilters.categories.length;

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-0">
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
                            <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{totalActiveFilters}</span>
                        )}
                    </button>

                    {isMultiFilterOpen && (
                        <div className="absolute left-0 mt-2 w-52 bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl z-60 py-2 overflow-visible ring-1 ring-black/50 animate-in fade-in zoom-in-95 duration-100">
                            <div className="relative group border-t border-gray-800/50 md:border-t-0">
                                <div 
                                    className="px-4 py-2.5 hover:bg-gray-800/80 cursor-pointer flex items-center justify-between text-sm text-gray-400 hover:text-white transition-all"
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            setActiveSubmenu(activeSubmenu == 'category' ? null : 'category');
                                        }
                                    }}
                                >
                                    <span className="font-medium">Filter by Category</span>
                                    <ChevronRight size={14} className={`opacity-50 transition-transform md:group-hover:rotate-0 ${activeSubmenu == 'category' ? 'rotate-90' : ''}`} />
                                </div>
                                
                                <div className={`
                                    bg-gray-950/50 md:bg-gray-900 md:border md:border-gray-800 md:rounded-2xl md:shadow-2xl md:absolute md:right-full md:top-0 md:mr-1 md:w-52 py-1 max-h-60 overflow-y-auto custom-scrollbar
                                    ${activeSubmenu == 'category' ? 'block' : 'hidden md:group-hover:block'}
                                `}>
                                    {allCategories.length > 0 ? allCategories.map(c => (
                                        <CustomCheckbox key={c} checked={activeFilters.categories.includes(c)} onChange={() => toggleFilter(c)} label={c} />
                                    )) : (
                                        <p className="px-4 py-2 text-xs text-gray-500 italic">No categories yet</p>
                                    )}
                                </div>
                            </div>

                            {totalActiveFilters > 0 && (
                                <div className="px-2 mt-2 pt-2 border-t border-gray-800/50">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveFilters({ categories: [] });
                                        }} 
                                        className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-red-400 hover:text-white hover:bg-red-500/10 rounded-xl transition-all"
                                    >
                                        Clear Filters
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Button Refresh */}
                <button onClick={fetchStocks} disabled={isLoading}
                    className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
                >
                    <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                    <span className="hidden md:inline">Refresh</span>
                </button>

                {/* Add Record */}
                <div className="w-full md:w-auto order-1 md:order-2 flex justify-end">
                    <button onClick={() => setShowForm(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-900/20">
                        <Plus size={18} /> <span className="hidden md:inline">Add Item</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-800/50 text-gray-300 text-[13px] uppercase tracking-wider border-b border-gray-800 select-none">
                                <th onClick={() => requestSort('item_name')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Item {getSortIcon('item_name')}</div>
                                </th>
                                <th onClick={() => requestSort('category')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Category {getSortIcon('category')}</div>
                                </th>
                                <th onClick={() => requestSort('current_stock')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Stock {getSortIcon('current_stock')}</div>
                                </th>
                                <th onClick={() => requestSort('unit')} className="px-6 py-4 font-bold cursor-pointer hover:text-white transition">
                                    <div className="flex items-center justify-center">Unit {getSortIcon('unit')}</div>
                                </th>
                                <th className="px-6 py-4 font-bold text-center">Movement</th>
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
                            ) : processedStocks.length > 0 ? (
                                processedStocks.map((stock) => (
                                    <tr key={stock.id} className="hover:bg-gray-800/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-100 text-sm font-medium">{stock.item_name}</td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{stock.category || '-'}</td>
                                        <td className={`px-6 py-4 font-bold text-sm ${stock.current_stock <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                                            {stock.current_stock}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400 text-sm">{stock.unit}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => setMovementModal({ type: 'in', stockId: stock.id, stockName: stock.item_name })}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-medium rounded-lg transition"
                                                >
                                                    <PackagePlus size={14} /> In
                                                </button>
                                                <button
                                                    onClick={() => setMovementModal({ type: 'out', stockId: stock.id, stockName: stock.item_name })}
                                                    className="flex items-center gap-1 px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded-lg transition"
                                                >
                                                    <PackageMinus size={14} /> Out
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => fetchHistory(stock.id, stock.item_name)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition" title="History">
                                                    <History size={16} />
                                                </button>
                                                <button onClick={() => handleEdit(stock)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => setDeleteId(stock.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center text-gray-500 italic text-sm">No items found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-white font-bold text-xl">{editId ? 'Edit Item' : 'New Item'}</h3>
                            <button onClick={() => { setShowForm(false); setEditId(null); setForm(defaultStockForm); setError(null); }} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} placeholder="Item Name" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />    
                            <div>
                                {!isOtherCategory ? (
                                    <div className="relative text-gray-300">
                                        <select 
                                            value={CATEGORIES.includes(form.category) ? form.category : (form.category ? "Other" : "")} 
                                            onChange={(e) => {
                                                if (e.target.value == 'Other') {
                                                    setIsOtherCategory(true);
                                                    setForm({ ...form, category: '' });
                                                } else {
                                                    setForm({ ...form, category: e.target.value });
                                                }
                                            }}
                                            className={
                                                `w-full bg-gray-800 border-none rounded-xl px-4 py-3 pr-10 cursor-pointer appearance-none focus:ring-2 focus:ring-blue-500 transition-colors 
                                                ${form.category == '' ? 'text-gray-400' : 'text-white'}`
                                            }
                                        >
                                            <option value="" disabled>Select Category</option>
                                            {CATEGORIES.map(cat => ( <option key={cat} value={cat} className="text-white bg-gray-900">{cat}</option> ))}
                                            <option value="Other">Other</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                                    </div>
                                ) : (
                                    <div className="flex gap-2 w-full items-center">
                                        <input 
                                            type="text" 
                                            value={form.category} 
                                            onChange={(e) => setForm({ ...form, category: e.target.value })} 
                                            placeholder="Enter new category" 
                                            className="grow min-w-0 bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                            required
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setIsOtherCategory(false);
                                                setForm({ ...form, category: '' });
                                            }}
                                            className="shrink-0 w-12 h-12 flex items-center justify-center bg-gray-800 text-gray-400 hover:text-white rounded-xl transition border border-gray-700"
                                            title="Back to list"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>
                            <input type="text" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="e.g. kg, pcs, liter" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />
                            <input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} placeholder="Initial Stock" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 shadow-inner" required />
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/30 transition">
                                {isSubmitting ? 'Saving...' : editId ? 'Update Item' : 'Save Item'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Stock In/Out Modal */}
            {movementModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold text-xl">{movementModal.stockName}</h3>
                            <button onClick={() => { setMovementModal(null); setMovementForm(defaultMovementForm); setError(null); }} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleMovementSubmit} className="space-y-4">
                            <input type="number" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} placeholder="Quantity" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />
                            <input type="text" value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} placeholder="Notes (optional)" className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" />
                            <input type="date" value={movementForm.date} onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })} className="w-full bg-gray-800 border-none rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500" required />
                            <button type="submit" disabled={isSubmitting} className={`w-full py-4 text-white font-bold rounded-xl shadow-lg transition ${movementModal.type == 'in' ? 'bg-green-600 hover:bg-green-500 shadow-green-900/30' : 'bg-red-600 hover:bg-red-500 shadow-red-900/30'}`}>
                                {isSubmitting ? 'Processing...' : `Stock ${movementModal.type == 'in' ? 'In' : 'Out'}`}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse"><Trash2 size={30} /></div>
                        <h3 className="text-white font-bold text-lg mb-2">Delete Item?</h3>
                        <p className="text-gray-500 text-sm mb-8">This will also delete all stock history for this item.</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setDeleteId(null)} className="py-3 bg-gray-800 text-white rounded-xl font-bold">Cancel</button>
                            <button onClick={() => handleDelete(deleteId)} className="py-3 bg-red-600 text-white rounded-xl font-bold">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* History Modal */}
            {historyModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 px-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-white font-bold text-lg">Stock History</h3>
                                <p className="text-gray-400 text-sm">{historyModal.stockName}</p>
                            </div>
                            <button onClick={() => setHistoryModal(null)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                        </div>

                        <div className="overflow-y-auto custom-scrollbar space-y-2">
                            {isHistoryLoading ? (
                                [1,2,3].map(i => <div key={i} className="bg-gray-800 rounded-xl p-3 animate-pulse h-14" />)
                            ) : history.length == 0 ? (
                                <p className="text-gray-500 text-sm text-center py-12 italic">No history yet.</p>
                            ) : (
                                history.map((h) => (
                                    <div key={h.id} className="bg-gray-800 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {h.type == 'in'
                                                    ? <PackagePlus size={16} className="text-green-400" />
                                                    : <PackageMinus size={16} className="text-red-400" />
                                                }
                                                <span className="text-white text-sm font-medium">
                                                    Stock {h.type == 'in' ? 'In' : 'Out'}
                                                </span>
                                            </div>
                                            {h.notes && <p className="text-gray-500 text-xs mt-1 ml-6">{h.notes}</p>}
                                            <p className="text-gray-600 text-xs mt-0.5 ml-6">{formatDate(h.date)}</p>
                                        </div>
                                        <span className={`font-bold text-sm ${h.type == 'in' ? 'text-green-400' : 'text-red-400'}`}>
                                            {h.type == 'in' ? '+' : '-'}{h.quantity}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}