"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GraduationCap, Eye, EyeOff, Shield, BookOpen, Award, Loader2, ArrowRight, Lock, Mail, ArrowLeft, Users, Calendar, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

type RoleType = 'admin' | 'teacher' | 'student'

interface RoleDataItem {
    role: RoleType
    title: string
    email: string
    password: string
    icon: typeof Shield | typeof BookOpen | typeof Award
    gradient: string
    color: string
    description: string
    tagline: string
}

const roleData: RoleDataItem[] = [
    {
        role: 'admin',
        title: 'Admin',
        email: '',
        password: '',
        icon: Shield,
        gradient: 'from-violet-600 via-indigo-600 to-blue-700',
        color: 'indigo',
        description: 'Full system control',
        tagline: 'Manage Everything'
    },
    {
        role: 'teacher',
        title: 'Teacher',
        email: '',
        password: '',
        icon: BookOpen,
        gradient: 'from-teal-500 via-emerald-500 to-green-600',
        color: 'teal',
        description: 'Classroom management',
        tagline: 'Educate & Inspire'
    },
    {
        role: 'student',
        title: 'Student',
        email: '',
        password: '',
        icon: Award,
        gradient: 'from-orange-500 via-amber-500 to-yellow-600',
        color: 'orange',
        description: 'Learning journey',
        tagline: 'Learn & Grow'
    },
]

// Fixed particle configurations to prevent hydration mismatch
const particles = [
    { size: 4, left: 20, top: 30, delay: 0, duration: 15, color: 'indigo' },
    { size: 3, left: 80, top: 60, delay: 1, duration: 18, color: 'teal' },
    { size: 5, left: 50, top: 80, delay: 2, duration: 12, color: 'orange' },
    { size: 3, left: 10, top: 50, delay: 3, duration: 20, color: 'emerald' },
    { size: 4, left: 90, top: 20, delay: 1.5, duration: 16, color: 'indigo' },
    { size: 6, left: 40, top: 40, delay: 2.5, duration: 14, color: 'teal' },
    { size: 3, left: 70, top: 70, delay: 0.5, duration: 19, color: 'orange' },
    { size: 5, left: 25, top: 15, delay: 3.5, duration: 13, color: 'emerald' },
    { size: 4, left: 60, top: 90, delay: 1, duration: 17, color: 'indigo' },
    { size: 3, left: 15, top: 25, delay: 2, duration: 15, color: 'teal' },
    { size: 5, left: 85, top: 55, delay: 0, duration: 18, color: 'orange' },
    { size: 4, left: 35, top: 65, delay: 3, duration: 14, color: 'emerald' },
    { size: 3, left: 55, top: 35, delay: 1.5, duration: 16, color: 'indigo' },
    { size: 6, left: 75, top: 45, delay: 2.5, duration: 12, color: 'teal' },
    { size: 4, left: 45, top: 75, delay: 0.5, duration: 20, color: 'orange' },
    { size: 3, left: 5, top: 10, delay: 3.5, duration: 15, color: 'emerald' },
    { size: 5, left: 95, top: 85, delay: 1, duration: 17, color: 'indigo' },
    { size: 4, left: 30, top: 20, delay: 2, duration: 13, color: 'teal' },
    { size: 3, left: 65, top: 50, delay: 0, duration: 19, color: 'orange' },
    { size: 5, left: 12, top: 70, delay: 3, duration: 14, color: 'emerald' },
]

export default function LoginPage() {
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loadingRole, setLoadingRole] = useState<RoleType | null>(null)
    const [selectedRole, setSelectedRole] = useState<RoleType>('student')
    const [rememberMe, setRememberMe] = useState(false)
    const { login } = useAuth()

    const currentRole = roleData.find(r => r.role === selectedRole)!

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    // Handle form submission
    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true)
        setLoadingRole(null)

        try {
            const user = await login(data.email, data.password, rememberMe)
            if (user) {
                let redirectPath = '/login'
                if (user.role === 'super_admin' || user.role === 'admin') {
                    setSelectedRole('admin')
                    setLoadingRole('admin')
                    redirectPath = user.role === 'super_admin' ? '/super-admin' : '/admin/dashboard'
                } else if (user.role === 'teacher') {
                    setSelectedRole('teacher')
                    setLoadingRole('teacher')
                    redirectPath = '/teacher/dashboard'
                } else if (user.role === 'student') {
                    setSelectedRole('student')
                    setLoadingRole('student')
                    redirectPath = '/student/dashboard'
                }

                toast.success(`Welcome back, ${user.name || 'User'}!`, {
                    description: `Successfully signed in. Accessing your dashboard...`,
                    duration: 3000,
                })

                window.location.assign(redirectPath)
            }
        } catch (error: any) {
            console.error('Login component error:', error)
        } finally {
            setIsLoading(false)
            setLoadingRole(null)
        }
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-start p-4 md:p-6 pt-20 md:pt-28 relative overflow-hidden bg-gradient-to-br from-gray-50 via-gray-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
            {/* Animated Background Layers */}
            <div className="absolute inset-0">
                <div className={`absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br ${currentRole.gradient} opacity-20 rounded-full blur-3xl animate-float-slow transition-all duration-1000 mix-blend-multiply dark:mix-blend-screen`} />
                <div className={`absolute bottom-0 right-0 w-[700px] h-[700px] bg-gradient-to-tl ${currentRole.gradient} opacity-20 rounded-full blur-3xl animate-float transition-all duration-1000 mix-blend-multiply dark:mix-blend-screen`} style={{ animationDelay: '2s' }} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r ${currentRole.gradient} opacity-15 rounded-full blur-3xl animate-pulse mix-blend-multiply dark:mix-blend-screen`} />
            </div>

            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((particle, i) => (
                    <div
                        key={i}
                        className={`absolute rounded-full bg-${particle.color}-400/20 animate-float`}
                        style={{
                            width: `${particle.size}px`,
                            height: `${particle.size}px`,
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: `${particle.duration}s`,
                        }}
                    />
                ))}
            </div>

            {/* Subtle Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)] opacity-30" />

            {/* Back Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-300 group shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="text-sm font-semibold">Back to Home</span>
            </Link>

            {/* Main Content */}
            <div className="w-full max-w-7xl relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    {/* Left Side - Info Section */}
                    <div className="hidden lg:block space-y-8 animate-fade-in">
                        {/* Header */}
                        <div className="text-left">
                            <Link href="/" className="inline-flex items-center gap-6 mb-6 group">
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${currentRole.gradient} rounded-3xl blur-2xl opacity-40 group-hover:opacity-70 transition-all duration-700 animate-pulse`} />
                                    <div className={`absolute -inset-1 bg-gradient-to-br ${currentRole.gradient} rounded-3xl opacity-20 group-hover:opacity-40 transition-all duration-500 animate-spin`} style={{ animationDuration: '8s' }} />

                                    <div className={`relative flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${currentRole.gradient} shadow-xl group-hover:shadow-2xl group-hover:scale-110 transition-all duration-500 transform group-hover:rotate-3`}>
                                        <GraduationCap className="h-12 w-12 text-white animate-float" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h1 className="font-bold text-5xl md:text-6xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
                                        schools24
                                    </h1>
                                    <p className="text-base text-slate-600 dark:text-slate-400 mt-2 font-medium">
                                        Education Management System
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Features */}
                        <div className="space-y-4">
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Why Choose schools24?</h3>
                            {[
                                { icon: Users, title: 'Collaborative Learning', desc: 'Connect teachers, students, and parents seamlessly', delay: '0.1s' },
                                { icon: Calendar, title: 'Smart Scheduling', desc: 'Automated timetables and attendance tracking', delay: '0.2s' },
                                { icon: TrendingUp, title: 'Performance Analytics', desc: 'Real-time insights and progress monitoring', delay: '0.3s' },
                                { icon: Shield, title: 'Secure & Reliable', desc: 'Enterprise-grade security for your data', delay: '0.4s' },
                            ].map((feature, index) => {
                                const Icon = feature.icon
                                return (
                                    <div
                                        key={index}
                                        className="flex items-start gap-3 p-3 rounded-xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all duration-300 group animate-slide-in-left"
                                        style={{ animationDelay: feature.delay }}
                                    >
                                        <div className={`p-3 rounded-lg bg-gradient-to-br ${currentRole.gradient} shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-slate-900 dark:text-white mb-1">{feature.title}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">{feature.desc}</p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>


                    </div>

                    {/* Right Side - Login Form */}
                    <div className="w-full">
                        {/* Mobile Header - Only visible on mobile */}
                        <div className="lg:hidden text-center mb-8 animate-bounce-in">
                            <Link href="/" className="inline-flex items-center gap-4 group">
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${currentRole.gradient} rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-700 animate-pulse`} />

                                    <div className={`relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${currentRole.gradient} shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                                        <GraduationCap className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h1 className="font-bold text-3xl bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent">
                                        schools24
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                        Education Management
                                    </p>
                                </div>
                            </Link>
                        </div>

                        {/* Login Card */}
                        <Card className="shadow-2xl border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 relative overflow-hidden animate-scale-in max-w-xl mx-auto backdrop-blur-sm">
                            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${currentRole.gradient} transition-all duration-700`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                            </div>

                            <div className={`absolute inset-0 bg-gradient-to-br ${currentRole.gradient} opacity-5 transition-opacity duration-700`} />

                            <CardHeader className="relative pb-6 pt-8 px-6 md:px-8">
                                <div className="mb-2 min-h-[80px]">
                                    <CardTitle
                                        key={currentRole.role}
                                        className="text-3xl md:text-4xl mb-3 font-bold text-slate-900 dark:text-white tracking-tight animate-fade-in"
                                    >
                                        Welcome, {currentRole.title}!
                                    </CardTitle>
                                    <CardDescription
                                        key={`${currentRole.role}-desc`}
                                        className="text-base text-slate-600 dark:text-slate-400 font-medium animate-fade-in"
                                    >
                                        {currentRole.tagline}. Sign in to continue.
                                    </CardDescription>
                                </div>
                            </CardHeader>

                            <CardContent className="relative space-y-5 px-6 md:px-8 pb-8">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-3 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                                        <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                            <Mail className="h-4 w-4" />
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="your.email@schools24.com"
                                                {...register('email')}
                                                className={`h-11 text-base bg-white dark:bg-slate-700 border-2 rounded-xl transition-all duration-300 shadow-sm focus:shadow-md ${errors.email
                                                    ? 'border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:border-red-500'
                                                    : 'border-slate-300 dark:border-slate-600 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'
                                                    }`}
                                            />
                                        </div>
                                        {errors.email && (
                                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 font-medium animate-slide-in-left">
                                                <span className="text-xs">⚠</span> {errors.email.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-3 animate-slide-in-right" style={{ animationDelay: '0.2s' }}>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                <Lock className="h-4 w-4" />
                                                Password
                                            </Label>
                                            <Link href="#" className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                                Forgot password?
                                            </Link>
                                        </div>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="Enter your password"
                                                {...register('password')}
                                                className={`h-11 pr-12 text-base bg-white dark:bg-slate-700 border-2 rounded-xl transition-all duration-300 shadow-sm focus:shadow-md ${errors.password
                                                    ? 'border-red-500 focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:border-red-500'
                                                    : 'border-slate-300 dark:border-slate-600 focus-visible:ring-4 focus-visible:ring-blue-500/30 focus-visible:border-blue-500 hover:border-slate-400 dark:hover:border-slate-500'
                                                    }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all hover:scale-110"
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 font-medium animate-slide-in-right">
                                                <span className="text-xs">⚠</span> {errors.password.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={rememberMe}
                                                onChange={(e) => setRememberMe(e.target.checked)}
                                                className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-4 focus:ring-blue-500/30 cursor-pointer transition-all hover:scale-110"
                                            />
                                            <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors font-medium">
                                                Remember me for 30 days
                                            </span>
                                        </label>
                                    </div>

                                    <Button
                                        type="submit"
                                        className={`relative w-full h-12 bg-gradient-to-r ${currentRole.gradient} hover:opacity-95 border-0 text-white text-base font-bold shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500 overflow-hidden group mt-6 rounded-xl`}
                                        disabled={isLoading}
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    <span>Signing in...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>Sign In</span>
                                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Footer */}
                        <div className="text-center mt-8 space-y-3 animate-fade-in" style={{ animationDelay: '0.7s' }}>
                            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                By signing in, you agree to our{' '}
                                <Link href="#" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-4 transition-colors font-semibold">
                                    Terms of Service
                                </Link>
                                {' '}and{' '}
                                <Link href="#" className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 underline underline-offset-4 transition-colors font-semibold">
                                    Privacy Policy
                                </Link>
                            </p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                                © 2026 schools24. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
