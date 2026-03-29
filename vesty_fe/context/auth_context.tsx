'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/lib/types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (user: User, token: string) => void;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    let [user, setUser] = useState<User | null>(null);
    let [token, setToken] = useState<string | null>(null);
    let [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let savedToken = localStorage.getItem('vesty_token');
        let savedUser = localStorage.getItem('vesty_user');
        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        
        setIsLoading(false);
    }, []);

    let login = (user: User, token: string) => {
        localStorage.setItem('vesty_token', token);
        localStorage.setItem('vesty_user', JSON.stringify(user));
        setUser(user);
        setToken(token);
    }

    let logout = () => {
        localStorage.removeItem('vesty_token');
        localStorage.removeItem('vesty_user');
        setUser(null);
        setToken(null);
    }

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    let context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}