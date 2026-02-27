"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { UserRole } from '@/types'
import { api } from '@/lib/api'
import { toast } from 'sonner'

interface User {
    id: string
    name: string
    full_name?: string
    email: string
    role: UserRole
    avatar?: string
    phone?: string
    profile_picture_url?: string
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

const STORAGE_KEYS = {
    USER: 'School24_user',
    TOKEN: 'School24_token',
    EXPIRY: 'School24_token_expiry',
    REMEMBER: 'School24_remember'
} as const

const getStorage = (): Storage => {
    if (typeof window === 'undefined') return localStorage
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
    return remembered ? localStorage : sessionStorage
}

const isTokenExpired = (): boolean => {
    const storage = getStorage()
    const expiryStr = storage.getItem(STORAGE_KEYS.EXPIRY)
    if (!expiryStr) return true
    const expiry = parseInt(expiryStr, 10)
    return Date.now() > expiry
}

const clearAuthData = () => {
    [localStorage, sessionStorage].forEach(storage => {
        Object.values(STORAGE_KEYS).forEach(key => storage.removeItem(key))
    })
    // Clear the middleware cookie
    if (typeof document !== 'undefined') {
        document.cookie = 'School24_token=; path=/; max-age=0; SameSite=Lax'
    }
}

const isValidRole = (role: unknown): role is UserRole => {
    return role === 'super_admin' || role === 'admin' || role === 'teacher' || role === 'student' || role === 'staff' || role === 'parent'
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const storage = getStorage()
        const storedUser = storage.getItem(STORAGE_KEYS.USER)
        const storedToken = storage.getItem(STORAGE_KEYS.TOKEN)

        if (storedUser && storedToken) {
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

        if (user && pathname === '/login') {
            router.push(getDashboardPath(user.role));
            return;
        }

        if (!user) {
            const protectedPaths = ['/admin', '/teacher', '/student', '/super-admin']
            const isProtected = protectedPaths.some(path => pathname.startsWith(path))
            if (isProtected) {
                router.push('/login')
            }
            return;
        }

        const pathSegments = pathname.split('/').filter(Boolean);
        const baseSegment = pathSegments[0];

        const roleAllowedMap: Record<string, UserRole[]> = {
            'admin': ['admin', 'super_admin'],
            'teacher': ['teacher', 'admin', 'super_admin'],
            'student': ['student', 'admin', 'super_admin'],
            'super-admin': ['super_admin']
        };

        if (roleAllowedMap[baseSegment] && !roleAllowedMap[baseSegment].includes(user.role)) {
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

            if (!isValidRole(response.user?.role)) {
                throw new Error('Invalid user role returned by server')
            }

            const userData: User = {
                ...response.user,
                role: response.user.role,
                name: response.user.full_name || response.user.name || 'User'
            };

            const expiryTimestamp = Date.now() + (response.expires_in * 1000)
            clearAuthData()
            localStorage.setItem(STORAGE_KEYS.REMEMBER, rememberMe ? 'true' : 'false')

            const storage = rememberMe ? localStorage : sessionStorage
            storage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData))
            storage.setItem(STORAGE_KEYS.TOKEN, response.access_token)
            storage.setItem(STORAGE_KEYS.EXPIRY, expiryTimestamp.toString())

            // Set cookie for Next.js middleware (edge runtime can't read localStorage)
            const maxAge = Math.floor(response.expires_in)
            document.cookie = `School24_token=${response.access_token}; path=/; max-age=${maxAge}; SameSite=Lax`

            setUser(userData);
            toast.success('Login successful');
            return userData;
        } catch (error: any) {
            toast.error('Login failed', { description: error.message || 'Invalid credentials' });
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
