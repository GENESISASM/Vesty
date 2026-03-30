'use client';

import { useEffect, useState, useCallback } from 'react';
import axiosInstance from '@/lib/axios';
import { Finance } from '@/lib/types';

const CATEGORIES = ['Salary', 'Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Bills', 'Liabilitas','Other'];

const defaultForm = {
    type: 'income' as 'income' | 'expense',
    amount: '',
    category: 'Salary',
    description: '',
    date: new Date().toISOString().split('T')[0],
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

    useEffect(() => {
        fetchFinances();
    }, [fetchFinances]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        try {
        const payload = {
            ...form,
            amount: Number(form.amount),
        };

        if (editId) {
            await axiosInstance.put(`/finance/update/${editId}`, payload);
        } else {
            await axiosInstance.post('/finance/create', payload);
        }

        setForm(defaultForm);
        setShowForm(false);
        setEditId(null);
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
        <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <div>
            <h2 className="text-2xl font-bold text-white">Finance</h2>
            <p className="text-gray-400 text-sm mt-1">Track your income & expenses</p>
            </div>
            <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition"
            >
            + Add Transaction
            </button>
        </div>

        {/* Form Modal */}
        {showForm && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md">
                <h3 className="text-white font-semibold text-lg mb-4">
                {editId ? 'Edit Transaction' : 'Add Transaction'}
                </h3>

                {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Type</label>
                    <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, type: 'income' })}
                        className={`py-2 rounded-lg text-sm font-medium transition ${
                        form.type === 'income'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Income
                    </button>
                    <button
                        type="button"
                        onClick={() => setForm({ ...form, type: 'expense' })}
                        className={`py-2 rounded-lg text-sm font-medium transition ${
                        form.type === 'expense'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        Expense
                    </button>
                    </div>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Amount (IDR)</label>
                    <input
                    type="number"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0"
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Category</label>
                    <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                    >
                    {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                    </select>
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Description <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                    type="text"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Add a note..."
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {/* Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Date</label>
                    <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 transition"
                    />
                </div>

                {/* Buttons */}
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

        {/* Delete Confirmation Modal */}
        {deleteId && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-sm">
                <h3 className="text-white font-semibold text-lg mb-2">Delete Transaction</h3>
                <p className="text-gray-400 text-sm mb-6">
                Are you sure you want to delete this transaction? This action cannot be undone.
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

        {/* Finance List */}
        {isLoading ? (
            <div className="space-y-3">
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-32 mb-2"></div>
                <div className="h-6 bg-gray-800 rounded w-48"></div>
                </div>
            ))}
            </div>
        ) : finances.length === 0 ? (
            <div className="text-center py-16">
            <p className="text-gray-500 text-sm">No transactions yet.</p>
            <button
                onClick={() => setShowForm(true)}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition"
            >
                Add your first transaction →
            </button>
            </div>
        ) : (
            <div className="space-y-3">
            {finances.map((finance) => (
                <div
                key={finance.id}
                className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between"
                >
                <div className="flex items-center gap-4">
                    {/* Type indicator */}
                    <div className={`w-2 h-10 rounded-full ${finance.type === 'income' ? 'bg-green-500' : 'bg-red-500'}`} />
                    <div>
                    <p className="text-white font-medium text-sm">{finance.category}</p>
                    {finance.description && (
                        <p className="text-gray-500 text-xs mt-0.5">{finance.description}</p>
                    )}
                    <p className="text-gray-600 text-xs mt-0.5">{formatDate(finance.date)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <p className={`font-semibold text-sm ${finance.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {finance.type === 'income' ? '+' : '-'}{formatCurrency(Number(finance.amount))}
                    </p>
                    <div className="flex gap-2">
                    <button
                        onClick={() => handleEdit(finance)}
                        className="text-gray-500 hover:text-blue-400 text-xs transition"
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => setDeleteId(finance.id)}
                        className="text-gray-500 hover:text-red-400 text-xs transition"
                    >
                        Delete
                    </button>
                    </div>
                </div>
                </div>
            ))}
            </div>
        )}
        </div>
    );
}