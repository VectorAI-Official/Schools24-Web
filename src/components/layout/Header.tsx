"use client"

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Bell, Search, Moon, Sun, LogOut, Settings, Monitor, Check, School, Menu } from 'lucide-react'
import { useTheme } from 'next-themes'
import { getInitials } from '@/lib/utils'

const ROLE_PILL: Record<string, { grad: string; icon: string; border: string }> = {
    student:     { grad: 'from-orange-500/45 via-amber-400/40 to-orange-400/45 dark:from-orange-500/55 dark:via-amber-400/50 dark:to-orange-400/55',   icon: 'bg-orange-500/20 text-orange-600 dark:bg-orange-500/30 dark:text-orange-400',   border: 'border-orange-300/50 dark:border-orange-400/20' },
    teacher:     { grad: 'from-emerald-500/45 via-green-400/40 to-emerald-400/45 dark:from-emerald-500/55 dark:via-green-400/50 dark:to-emerald-400/55',   icon: 'bg-emerald-500/20 text-emerald-600 dark:bg-emerald-500/30 dark:text-emerald-400', border: 'border-emerald-300/50 dark:border-emerald-400/20' },
    admin:       { grad: 'from-violet-500/45 via-purple-400/40 to-fuchsia-400/45 dark:from-violet-500/55 dark:via-purple-400/50 dark:to-fuchsia-400/55', icon: 'bg-violet-500/20 text-violet-600 dark:bg-violet-500/30 dark:text-violet-400',   border: 'border-violet-300/50 dark:border-violet-400/20' },
    super_admin: { grad: 'from-rose-500/45 via-pink-400/40 to-fuchsia-400/45 dark:from-rose-500/55 dark:via-pink-400/50 dark:to-fuchsia-400/55',         icon: 'bg-rose-500/20 text-rose-600 dark:bg-rose-500/30 dark:text-rose-400',         border: 'border-rose-300/50 dark:border-rose-400/20' },
}

export function Header() {
    const { user, logout } = useAuth()
    const { theme, setTheme } = useTheme()
    const rolePill = ROLE_PILL[user?.role ?? ''] ?? ROLE_PILL.admin

    const toggleMobileSidebar = () => {
        window.dispatchEvent(new Event('toggle-mobile-sidebar'))
    }

    return (
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
            {/* Left Side: Mobile menu + School Name */}
            <div className="flex min-w-0 items-center gap-2">
                {/* Hamburger — mobile only */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleMobileSidebar}
                    className="md:hidden h-10 w-10 rounded-xl hover:bg-accent/50"
                    aria-label="Open menu"
                >
                    <Menu className="h-5 w-5" />
                </Button>

                {user?.school_name && (
                    <div className="relative flex min-w-0 max-w-[42vw] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[380px] items-center gap-2.5 px-4 py-2 rounded-xl overflow-hidden">
                        {/* Colored gradient background layer */}
                        <div className={`absolute inset-0 bg-gradient-to-r ${rolePill.grad}`} />
                        {/* Blur/Glass effect */}
                        <div className="absolute inset-0 backdrop-blur-md bg-background/40" />
                        {/* Border glow */}
                        <div className={`absolute inset-0 rounded-xl border ${rolePill.border}`} />

                        {/* Content */}
                        <div className={`relative z-10 hidden md:flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${rolePill.icon}`}>
                            <School className="h-5 w-5" />
                        </div>
                        <span className="relative z-10 min-w-0 block truncate text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-50">
                            {user.school_name}
                        </span>
                    </div>
                )}
            </div>

            {/* Right Side: Role Badge & Profile */}
            <div className="flex items-center gap-2 sm:gap-4">
                {/* Role Badge */}
                {user?.role && (
                    <div className={`
                        hidden sm:block
                        px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide
                        ${user.role === 'super_admin' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                        ${user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : ''}
                        ${user.role === 'teacher' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : ''}
                        ${user.role === 'student' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : ''}
                        ${user.role === 'parent' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : ''}
                    `}>
                        {user.role.replace('_', ' ')}
                    </div>
                )}

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user?.avatar} alt={user?.name} />
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                    {user?.name ? getInitials(user.name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.name}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user?.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Theme</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => setTheme('light')}>
                                        <Sun className="mr-2 h-4 w-4" />
                                        <span>Light</span>
                                        {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme('dark')}>
                                        <Moon className="mr-2 h-4 w-4" />
                                        <span>Dark</span>
                                        {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setTheme('system')}>
                                        <Monitor className="mr-2 h-4 w-4" />
                                        <span>System</span>
                                        {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} className="text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

