'use client';

import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Stock, StockHistory } from '@/lib/types';

const defaultStockForm = {
    item_name: '',
    category: '',
    unit: '',
    current_stock: '0',
};

const defaultStockMovementForm = {
    quantity: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
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

    // Stock in/out modal
    const [movementModal, setMovementModal] = useState<{
        type: 'in' | 'out';
        stockId: string;
        stockName: string;
    } | null>(null);
    const [movementForm, setMovementForm] = useState(defaultStockMovementForm);

    // History modal
    const [historyModal, setHistoryModal] = useState<{
        stockId: string;
        stockName: string;
    } | null>(null);
    const [history, setHistory] = useState<StockHistory[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = useState(false);

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

    useEffect(() => {
        fetchStocks();
    }, [fetchStocks]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
            const payload = {
                ...form,
                current_stock: Number(form.current_stock),
            };

            if (editId) {
                await axiosInstance.put(`/stock/update/${editId}`, payload);
            } else {
                await axiosInstance.post('/stock/create', payload);
            }

            setForm(defaultStockForm);
            setShowForm(false);
            setEditId(null);
            fetchStocks();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (stock: Stock) => {
        setForm({
            item_name: stock.item_name,
            category: stock.category ?? '',
            unit: stock.unit,
            current_stock: String(stock.current_stock),
        });
        setEditId(stock.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await axiosInstance.delete(`/stock/delete/${id}`);
            fetchStocks();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleteId(null);
        }
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
            setMovementForm(defaultStockMovementForm);
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
        } catch (err) {
            console.error(err);
        } finally {
            setIsHistoryLoading(false);
        }
    };

    const handleCancel = () => {
        setForm(defaultStockForm);
        setShowForm(false);
        setEditId(null);
        setError(null);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    return (
        <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                <h2 className="text-2xl font-bold text-white">Stock</h2>
                <p className="text-gray-400 text-sm mt-1">Manage your item inventory</p>
                </div>
                <button
                onClick={() => setShowForm(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
                >
                + Add Item
                </button>
            </div>

            {/* Add/Edit Stock Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                    <h3 className="text-white font-semibold text-lg mb-4">
                    {editId ? 'Edit Item' : 'Add Item'}
                    </h3>

                    {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Item Name</label>
                        <input
                        type="text"
                        value={form.item_name}
                        onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                        placeholder="e.g. Beras"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Category <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                        type="text"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        placeholder="e.g. Sembako"
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Unit</label>
                        <input
                        type="text"
                        value={form.unit}
                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                        placeholder="e.g. kg, pcs, liter"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Initial Stock</label>
                        <input
                        type="number"
                        value={form.current_stock}
                        onChange={(e) => setForm({ ...form, current_stock: e.target.value })}
                        placeholder="0"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                        >
                        Cancel
                        </button>
                        <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-medium rounded-lg transition"
                        >
                        {isSubmitting ? 'Saving...' : editId ? 'Update' : 'Save'}
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* Stock In/Out Modal */}
            {movementModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                    <h3 className="text-white font-semibold text-lg mb-1">
                    Stock {movementModal.type === 'in' ? 'In' : 'Out'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4">{movementModal.stockName}</p>

                    {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                    )}

                    <form onSubmit={handleMovementSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Quantity</label>
                        <input
                        type="number"
                        value={movementForm.quantity}
                        onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                        placeholder="0"
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Notes <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                        type="text"
                        value={movementForm.notes}
                        onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                        placeholder="Add a note..."
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                        <input
                        type="date"
                        value={movementForm.date}
                        onChange={(e) => setMovementForm({ ...movementForm, date: e.target.value })}
                        required
                        className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                        type="button"
                        onClick={() => { setMovementModal(null); setMovementForm(defaultStockMovementForm); setError(null); }}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                        >
                        Cancel
                        </button>
                        <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`flex-1 py-2.5 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 ${
                            movementModal.type === 'in'
                            ? 'bg-green-600 hover:bg-green-500'
                            : 'bg-red-600 hover:bg-red-500'
                        }`}
                        >
                        {isSubmitting ? 'Saving...' : `Stock ${movementModal.type === 'in' ? 'In' : 'Out'}`}
                        </button>
                    </div>
                    </form>
                </div>
                </div>
            )}

            {/* Delete Modal */}
            {deleteId && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                    <h3 className="text-white font-semibold text-lg mb-2">Delete Item</h3>
                    <p className="text-gray-400 text-sm mb-6">
                    Are you sure? This will also delete all stock history for this item.
                    </p>
                    <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteId(null)}
                        className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => handleDelete(deleteId)}
                        className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-medium rounded-lg transition"
                    >
                        Delete
                    </button>
                    </div>
                </div>
                </div>
            )}

            {/* History Modal */}
            {historyModal && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-white font-semibold text-lg">Stock History</h3>
                        <p className="text-gray-400 text-sm">{historyModal.stockName}</p>
                    </div>
                    <button
                        onClick={() => setHistoryModal(null)}
                        className="text-gray-500 hover:text-white transition"
                    >
                        ✕
                    </button>
                    </div>

                    {isHistoryLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-800 rounded-lg p-3 animate-pulse h-12" />
                        ))}
                    </div>
                    ) : history.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-8">No history yet.</p>
                    ) : (
                    <div className="space-y-2">
                        {history.map((h) => (
                        <div key={h.id} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                            <div>
                            <p className="text-white text-sm font-medium">
                                {h.type === 'in' ? '📦 Stock In' : '📤 Stock Out'}
                            </p>
                            {h.notes && <p className="text-gray-500 text-xs mt-0.5">{h.notes}</p>}
                            <p className="text-gray-600 text-xs mt-0.5">{formatDate(h.date)}</p>
                            </div>
                            <p className={`font-semibold text-sm ${h.type === 'in' ? 'text-green-400' : 'text-red-400'}`}>
                            {h.type === 'in' ? '+' : '-'}{h.quantity}
                            </p>
                        </div>
                        ))}
                    </div>
                    )}
                </div>
                </div>
            )}

            {/* Stock List */}
            {isLoading ? (
                <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                    <div className="h-6 bg-gray-800 rounded w-48"></div>
                    </div>
                ))}
                </div>
            ) : stocks.length === 0 ? (
                <div className="text-center py-16">
                <p className="text-gray-500 text-sm">No items yet.</p>
                <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition"
                >
                    Add your first item →
                </button>
                </div>
            ) : (
                <div className="space-y-3">
                {stocks.map((stock) => (
                    <div
                    key={stock.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                    >
                    <div className="flex items-center justify-between">
                        <div>
                        <p className="text-white font-medium text-sm">{stock.item_name}</p>
                        {stock.category && (
                            <p className="text-gray-500 text-xs mt-0.5">{stock.category}</p>
                        )}
                        <p className={`text-sm font-semibold mt-1 ${stock.current_stock <= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                            {stock.current_stock} {stock.unit}
                        </p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                        {/* Stock In/Out buttons */}
                        <div className="flex gap-2">
                            <button
                            onClick={() => setMovementModal({ type: 'in', stockId: stock.id, stockName: stock.item_name })}
                            className="px-3 py-1 bg-green-600/20 hover:bg-green-600/40 text-green-400 text-xs font-medium rounded-lg transition"
                            >
                            + In
                            </button>
                            <button
                            onClick={() => setMovementModal({ type: 'out', stockId: stock.id, stockName: stock.item_name })}
                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-xs font-medium rounded-lg transition"
                            >
                            - Out
                            </button>
                        </div>
                        {/* Action buttons */}
                        <div className="flex gap-2">
                            <button
                            onClick={() => fetchHistory(stock.id, stock.item_name)}
                            className="text-gray-500 hover:text-blue-400 text-xs transition"
                            >
                            History
                            </button>
                            <button
                            onClick={() => handleEdit(stock)}
                            className="text-gray-500 hover:text-blue-400 text-xs transition"
                            >
                            Edit
                            </button>
                            <button
                            onClick={() => setDeleteId(stock.id)}
                            className="text-gray-500 hover:text-red-400 text-xs transition"
                            >
                            Delete
                            </button>
                        </div>
                        </div>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
}