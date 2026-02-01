"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole } from '@/lib/mockData'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface User {
    id: string
    name: string
    full_name?: string
    email: string
    role: UserRole
    avatar?: string
}

const getDashboardPath = (role: UserRole): string => {
    switch (role) {
        case 'super_admin': return '/super-admin';
        case 'admin': return '/admin/dashboard';
        case 'teacher': return '/teacher/dashboard';
        case 'student': return '/student/dashboard';
        default: return '/login';
    }
};

interface AuthContextType {
    user: User | null
    isAuthenticated: boolean
    isLoading: boolean
    login: (email: string, password: string) => Promise<boolean>
    logout: () => void
    userRole: UserRole | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock credentials for demo
const mockCredentials = {
    admin: { email: 'admin@school24.com', password: 'admin123', user: { id: '1', name: 'Admin User', email: 'admin@school24.com', role: 'admin' as UserRole } },
    teacher: { email: 'teacher@school24.com', password: 'teacher123', user: { id: '2', name: 'Rajesh Kumar', email: 'rajesh@school24.com', role: 'teacher' as UserRole } },
    student: { email: 'student@school24.com', password: 'student123', user: { id: '3', name: 'Amit Singh', email: 'amit@school24.com', role: 'student' as UserRole } },
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for stored auth on mount
        const storedUser = localStorage.getItem('School24_user')
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch {
                localStorage.removeItem('School24_user')
            }
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        if (isLoading) return;

        // 1. Initial Redirect if on login page
        if (user && pathname === '/login') {
            router.push(getDashboardPath(user.role));
            return;
        }

        // 2. Route protection for unauthenticated users
        if (!user) {
            const protectedPaths = ['/admin', '/teacher', '/student', '/super-admin']
            const isProtected = protectedPaths.some(path => pathname.startsWith(path))
            if (isProtected) {
                router.push('/login')
            }
            return;
        }

        // 3. Role-based access control (RBAC)
        const pathSegments = pathname.split('/').filter(Boolean);
        const baseSegment = pathSegments[0]; // 'admin', 'teacher', 'student', 'super-admin'

        const roleAllowedMap: Record<string, UserRole[]> = {
            'admin': ['admin', 'super_admin'],
            'teacher': ['teacher', 'admin', 'super_admin'],
            'student': ['student', 'admin', 'super_admin'],
            'super-admin': ['super_admin']
        };

        if (roleAllowedMap[baseSegment] && !roleAllowedMap[baseSegment].includes(user.role)) {
            // Unauthorized - redirect to their own dashboard
            router.push(getDashboardPath(user.role));
        }
    }, [isLoading, user, pathname, router])

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await api.post<{ access_token: string, user: any, expires_in: number }>('/auth/login', { email, password });

            // Map backend fields to frontend interface
            const userData: User = {
                ...response.user,
                name: response.user.full_name || response.user.name || 'User'
            };

            setUser(userData);
            localStorage.setItem('School24_user', JSON.stringify(userData));
            localStorage.setItem('School24_token', response.access_token);
            toast.success("Login successful");
            return true;
        } catch (error: any) {
            toast.error("Login failed", { description: error.message || "Invalid credentials" });
            return false;
        } finally {
            setIsLoading(false);
        }
    }

    const logout = () => {
        setUser(null)
        localStorage.removeItem('School24_user')
        localStorage.removeItem('School24_token')
        router.push('/login')
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                userRole: user?.role || null,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
