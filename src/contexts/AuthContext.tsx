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
    school_id?: string
    school_name?: string
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
    login: (email: string, password: string, rememberMe?: boolean) => Promise<User | null>
    logout: () => void
    userRole: UserRole | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys
const STORAGE_KEYS = {
    USER: 'School24_user',
    TOKEN: 'School24_token',
    EXPIRY: 'School24_token_expiry',
    REMEMBER: 'School24_remember'
} as const

// Helper to get storage based on remember me preference
const getStorage = (): Storage => {
    if (typeof window === 'undefined') return localStorage
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
    return remembered ? localStorage : sessionStorage
}

// Check if token is expired
const isTokenExpired = (): boolean => {
    const storage = getStorage()
    const expiryStr = storage.getItem(STORAGE_KEYS.EXPIRY)
    if (!expiryStr) return true
    const expiry = parseInt(expiryStr, 10)
    return Date.now() > expiry
}

// Clear all auth data from both storages
const clearAuthData = () => {
    [localStorage, sessionStorage].forEach(storage => {
        Object.values(STORAGE_KEYS).forEach(key => storage.removeItem(key))
    })
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check for stored auth on mount with expiry validation
        const storage = getStorage()
        const storedUser = storage.getItem(STORAGE_KEYS.USER)
        const storedToken = storage.getItem(STORAGE_KEYS.TOKEN)

        if (storedUser && storedToken) {
            // Check if token is expired
            if (isTokenExpired()) {
                clearAuthData()
                setUser(null)
            } else {
                try {
                    setUser(JSON.parse(storedUser))
                } catch {
                    clearAuthData()
                }
            }
        }
        setIsLoading(false)
    }, [])

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === STORAGE_KEYS.TOKEN && event.newValue == null) {
                setUser(null)
            }
        }

        window.addEventListener('storage', handleStorage)
        return () => window.removeEventListener('storage', handleStorage)
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

    const login = async (email: string, password: string, rememberMe: boolean = false): Promise<User | null> => {
        setIsLoading(true);
        try {
            const response = await api.post<{ access_token: string, user: any, expires_in: number }>('/auth/login', {
                email,
                password,
                remember_me: rememberMe
            });

            // Map backend fields to frontend interface
            const userData: User = {
                ...response.user,
                name: response.user.full_name || response.user.name || 'User'
            };

            // Calculate expiry timestamp
            const expiryTimestamp = Date.now() + (response.expires_in * 1000)

            // Clear any existing data first
            clearAuthData()

            // Set remember preference in localStorage (always)
            localStorage.setItem(STORAGE_KEYS.REMEMBER, rememberMe ? 'true' : 'false')

            // Choose storage based on remember me
            const storage = rememberMe ? localStorage : sessionStorage
            storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
            storage.setItem(STORAGE_KEYS.TOKEN, response.access_token)
            storage.setItem(STORAGE_KEYS.EXPIRY, expiryTimestamp.toString())

            setUser(userData);
            toast.success("Login successful");
            return userData;
        } catch (error: any) {
            toast.error("Login failed", { description: error.message || "Invalid credentials" });
            return null;
        } finally {
            setIsLoading(false);
        }
    }

    const logout = () => {
        setUser(null)
        clearAuthData()
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

