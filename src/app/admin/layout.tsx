"use client"

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { Loader2 } from 'lucide-react'
import AdamChatbot from '@/components/chatbot/AdamChatbot'

export default function AdminLayout({ children }: { children: ReactNode }) {
    const { isLoading, isAuthenticated } = useAuth()

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!isAuthenticated) {
        return null // Will be redirected by AuthContext
    }

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-3 md:p-6">
                    <div className="mx-auto w-full max-w-[1600px]">
                        {children}
                    </div>
                </main>
            </div>
            <AdamChatbot />
        </div>
    )
}
