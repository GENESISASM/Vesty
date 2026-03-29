'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth_context';
import axiosInstance from '@/lib/axios';

const loginSchema = z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        try {
        setIsLoading(true);
        setError(null);

        const response = await axiosInstance.post('/auth/user/login', data);
        const { user, token } = response.data.data;

        login(user, token);
        router.push('/dashboard');
        } catch (err: any) {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
        setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Vesty</h1>
            <p className="text-gray-400 text-sm">
                Manage your finances & stock together
            </p>
            </div>

            {/* Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
            <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Email
                </label>
                <input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
                </div>

                {/* Password */}
                <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Password
                </label>
                <input
                    {...register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                />
                {errors.password && (
                    <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
                )}
                </div>

                {/* Submit */}
                <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-2.5 text-sm transition mt-2"
                >
                {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
            </form>
            </div>

            <p className="text-center text-gray-600 text-xs mt-6">
            Vesty © {new Date().getFullYear()}
            </p>
        </div>
        </div>
    );
}