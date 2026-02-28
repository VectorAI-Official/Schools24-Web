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

const getCookieValue = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const parts = document.cookie.split('; ').find(row => row.startsWith(`${name}=`))
    return parts ? decodeURIComponent(parts.split('=')[1]) : null
}

const decodeJwtPayload = (token: string): Record<string, any> | null => {
    try {
        const payloadPart = token.split('.')[1]
        if (!payloadPart) return null
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
        const json = atob(base64)
        return JSON.parse(json)
    } catch {
        return null
    }
}

const getStorage = (): Storage => {
    if (typeof window === 'undefined') return localStorage
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
    return remembered ? localStorage : sessionStorage
}

const isTokenExpired = (token?: string | null): boolean => {
    const expiryStr = getStoredValue(STORAGE_KEYS.EXPIRY)
    if (expiryStr) {
        const expiry = parseInt(expiryStr, 10)
        if (!Number.isNaN(expiry)) {
            return Date.now() > expiry
        }
    }

    if (token) {
        const payload = decodeJwtPayload(token)
        const exp = payload?.exp
        if (typeof exp === 'number') {
            return Date.now() > exp * 1000
        }
    }

    // If we cannot determine expiry, avoid forcing logout immediately.
    return false
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

const getStoredValue = (key: string): string | null => {
    if (typeof window === 'undefined') return null
    const primary = getStorage()
    return (
        primary.getItem(key) ||
        localStorage.getItem(key) ||
        sessionStorage.getItem(key)
    )
}

const getActiveToken = (): string | null => {
    return getStoredValue(STORAGE_KEYS.TOKEN) || getCookieValue(STORAGE_KEYS.TOKEN)
}

const rehydrateUserFromSources = (): User | null => {
    const storedUser = getStoredValue(STORAGE_KEYS.USER)
    const token = getActiveToken()

    if (!token) return null

    if (storedUser) {
        try {
            return JSON.parse(storedUser) as User
        } catch {
            // continue to JWT fallback
        }
    }

    const payload = decodeJwtPayload(token)
    if (!payload || !isValidRole(payload.role)) return null

    const email = (payload.email as string) || ''
    const fallbackName = (email && email.includes('@')) ? email.split('@')[0] : 'User'

    return {
        id: (payload.user_id as string) || (payload.sub as string) || '',
        name: (payload.full_name as string) || (payload.name as string) || fallbackName,
        full_name: (payload.full_name as string) || (payload.name as string) || fallbackName,
        email,
        role: payload.role as UserRole,
        school_id: payload.school_id as string | undefined,
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const activeToken = getActiveToken()
        const hydratedUser = rehydrateUserFromSources()

        if (!activeToken) {
            setUser(null)
            setIsLoading(false)
            return
        }

        if (isTokenExpired(activeToken)) {
            clearAuthData()
            setUser(null)
            setIsLoading(false)
            return
        }

        if (hydratedUser) {
            setUser(hydratedUser)

            // Ensure active tab has token/user available for API calls
            const storage = getStorage()
            if (!storage.getItem(STORAGE_KEYS.TOKEN)) {
                storage.setItem(STORAGE_KEYS.TOKEN, activeToken)
            }
            if (!storage.getItem(STORAGE_KEYS.USER)) {
                storage.setItem(STORAGE_KEYS.USER, JSON.stringify(hydratedUser))
            }
        } else {
            // Token exists but we cannot reconstruct a valid user session.
            // Clear invalid auth to prevent redirect loops across tabs.
            clearAuthData()
            setUser(null)
        }

        setIsLoading(false)
    }, [])

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (!event.key) return
            if (
                event.key === STORAGE_KEYS.TOKEN ||
                event.key === STORAGE_KEYS.USER ||
                event.key === STORAGE_KEYS.REMEMBER ||
                event.key === STORAGE_KEYS.EXPIRY
            ) {
                const hydratedUser = rehydrateUserFromSources()
                setUser(hydratedUser)
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
