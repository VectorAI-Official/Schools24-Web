"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
    Trophy, TrendingUp, Star, Award, Medal, ArrowLeft, Target, Zap,
    BookOpen, CheckCircle, ArrowRight, Sparkles, Crown, BarChart3,
    FlaskConical, Calculator, Globe, Languages, ChevronRight
} from 'lucide-react'
import { mockStudents, leaderboardData } from '@/lib/mockData'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'
import {
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
    ResponsiveContainer,
} from 'recharts'

const student = mockStudents[0]

// Subject icon mapping
const subjectIcons: Record<string, any> = {
    'Science': FlaskConical,
    'Maths': Calculator,
    'Social': Globe,
    'English': BookOpen,
    'Hindi': Languages,
}

const subjectColors: Record<string, { color: string; bgColor: string; accentColor: string }> = {
    'Science': { color: '#0d9488', bgColor: '#ccfbf1', accentColor: '#14b8a6' },
    'Maths': { color: '#4f46e5', bgColor: '#e0e7ff', accentColor: '#6366f1' },
    'Social': { color: '#0284c7', bgColor: '#e0f2fe', accentColor: '#0ea5e9' },
    'English': { color: '#7c3aed', bgColor: '#f3e8ff', accentColor: '#a855f7' },
    'Hindi': { color: '#ea580c', bgColor: '#ffedd5', accentColor: '#f97316' },
}

export default function StudentPerformancePage() {
    const router = useRouter()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const radarData = student.performance.subjects.map(s => ({
        subject: s.name,
        score: s.score,
        fullMark: 100,
    }))

    const getGradeStyle = (grade: string) => {
        if (grade.startsWith('A')) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' }
        if (grade.startsWith('B')) return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' }
        if (grade.startsWith('C')) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
        return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                                    <BarChart3 className="h-4.5 w-4.5 text-white" />
                                </div>
                                My Performance
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-0.5 ml-[3.25rem]">Track your academic progress</p>
                        </div>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm tracking-wide border-0"
                        onClick={() => router.push('/student/leaderboard')}
                    >
                        <Trophy className="w-4 h-4 mr-2" />
                        View Leaderboard
                    </Button>
                </div>

                {/* Overall Stats */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Rank */}
                    <Card className="border border-amber-200/80 shadow-sm bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50/60 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/20 rounded-full -translate-y-10 translate-x-10" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25 transition-transform group-hover:scale-110">
                                    <Trophy className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xl md:text-3xl font-bold text-amber-600">#{student.performance.rank}</p>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Class Rank</p>
                                    <p className="text-[10px] text-slate-400 font-medium">of {student.performance.totalStudents} students</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Average Score */}
                    <Card className="border border-teal-200/80 shadow-sm bg-gradient-to-br from-teal-50 via-emerald-50/80 to-cyan-50/60 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-teal-200/20 rounded-full -translate-y-10 translate-x-10" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25 transition-transform group-hover:scale-110">
                                    <Target className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xl md:text-3xl font-bold text-teal-600">{student.performance.averageScore}%</p>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Average Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grade */}
                    <Card className="border border-emerald-200/80 shadow-sm bg-gradient-to-br from-green-50 via-emerald-50/80 to-teal-50/60 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/20 rounded-full -translate-y-10 translate-x-10" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 transition-transform group-hover:scale-110">
                                    <Award className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-xl md:text-3xl font-bold text-emerald-600">{student.grade}</p>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Grade</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Improvement */}
                    <Card className="border border-blue-200/80 shadow-sm bg-gradient-to-br from-blue-50 via-cyan-50/80 to-sky-50/60 overflow-hidden group hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer">
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full -translate-y-10 translate-x-10" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/25 transition-transform group-hover:scale-110">
                                    <TrendingUp className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <p className="text-xl md:text-3xl font-bold text-blue-600">+5%</p>
                                        <Zap className="h-4 w-4 text-blue-500" />
                                    </div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Improvement</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Radar & Subject Details */}
                <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
                    {/* Radar Chart */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                                    <Target className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">Performance Overview</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Strength areas across subjects</p>
                                </div>
                            </div>
                            {mounted && (
                                <div className="h-[320px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart data={radarData}>
                                            <PolarGrid stroke="#e2e8f0" />
                                            <PolarAngleAxis
                                                dataKey="subject"
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                                            />
                                            <PolarRadiusAxis
                                                angle={30}
                                                domain={[0, 100]}
                                                tick={{ fill: '#94a3b8', fontSize: 10 }}
                                            />
                                            <Radar
                                                name="Score"
                                                dataKey="score"
                                                stroke="#14b8a6"
                                                fill="#14b8a6"
                                                fillOpacity={0.2}
                                                strokeWidth={2.5}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Subject Performance */}
                    <Card className="border-0 shadow-sm bg-white overflow-hidden">
                        <CardContent className="p-4 md:p-6">
                            <div className="flex items-center gap-2.5 mb-5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/25">
                                    <BookOpen className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">Subject-wise Performance</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Scores across all subjects</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {student.performance.subjects.map((subject, index) => {
                                    const gradeStyle = getGradeStyle(subject.grade)
                                    const colors = subjectColors[subject.name] || { color: '#64748b', bgColor: '#f1f5f9', accentColor: '#94a3b8' }
                                    const IconComponent = subjectIcons[subject.name] || BookOpen

                                    return (
                                        <div key={subject.name} className="group p-3 rounded-xl bg-slate-50/50 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all duration-300" style={{ borderLeft: `3px solid ${colors.accentColor}` }}>
                                            <div className="flex items-center justify-between mb-2.5">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                                                        style={{ backgroundColor: colors.bgColor }}
                                                    >
                                                        <IconComponent className="w-4.5 h-4.5" style={{ color: colors.color }} />
                                                    </div>
                                                    <span className="font-semibold text-sm text-slate-800">{subject.name}</span>
                                                    <Badge className={`${gradeStyle.bg} ${gradeStyle.text} border ${gradeStyle.border} text-[10px] font-bold uppercase tracking-wider`}>
                                                        {subject.grade}
                                                    </Badge>
                                                </div>
                                                <span className="font-bold text-base" style={{ color: colors.color }}>{subject.score}%</span>
                                            </div>
                                            <Progress value={subject.score} className="h-2 bg-slate-100 rounded-full" />
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Class Leaderboard Preview */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <Trophy className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">Class Leaderboard</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Top performers</p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all"
                                onClick={() => router.push('/student/leaderboard')}
                            >
                                View Full
                                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {leaderboardData.students.slice(0, 5).map((s, index) => {
                                const isCurrentUser = s.name === student.name
                                const podiumGradients = ['from-amber-400 via-yellow-400 to-amber-500', 'from-slate-300 via-slate-400 to-slate-500', 'from-orange-400 via-amber-500 to-orange-500']

                                return (
                                    <div
                                        key={s.rank}
                                        className={`flex items-center gap-3.5 p-3 rounded-xl transition-all duration-300 hover:shadow-sm cursor-pointer group ${isCurrentUser
                                            ? 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 border border-teal-200'
                                            : 'bg-slate-50/50 border border-transparent hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ${index < 3
                                            ? `bg-gradient-to-br ${podiumGradients[index]} text-white`
                                            : 'bg-slate-200 text-slate-600'
                                            }`}>
                                            {index < 3 ? (
                                                index === 0 ? <Crown className="h-4 w-4" /> : index === 1 ? <Medal className="h-4 w-4" /> : <Star className="h-4 w-4" />
                                            ) : s.rank}
                                        </div>
                                        <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
                                            <AvatarFallback className={`text-xs font-bold ${isCurrentUser
                                                ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {getInitials(s.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-slate-800 truncate">{s.name}</p>
                                                {isCurrentUser && (
                                                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">Class {s.class}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`text-[10px] font-bold uppercase tracking-wider ${s.trend === 'up'
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                    : s.trend === 'down'
                                                        ? 'bg-red-100 text-red-600 border-red-300'
                                                        : 'bg-slate-100 text-slate-600 border-slate-300'
                                                    } border`}
                                            >
                                                {s.trend === 'up' ? '↑ Rising' : s.trend === 'down' ? '↓ Declining' : '→ Stable'}
                                            </Badge>
                                            <p className={`text-base font-bold min-w-[2.5rem] text-right ${isCurrentUser ? 'text-teal-600' : 'text-slate-700'}`}>
                                                {s.score}%
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-2.5 mb-6">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                <Sparkles className="h-4.5 w-4.5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 text-sm tracking-wide">Achievements</h3>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">Your academic milestones</p>
                            </div>
                        </div>
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                            {[
                                {
                                    icon: Trophy,
                                    title: 'Top 5',
                                    subtitle: 'Class Rank',
                                    gradient: 'from-amber-400 to-orange-500',
                                    shadow: 'shadow-amber-500/25',
                                    bg: 'from-amber-50 via-yellow-50/80 to-orange-50/60',
                                    border: 'border-amber-200/80',
                                },
                                {
                                    icon: CheckCircle,
                                    title: 'Perfect Attendance',
                                    subtitle: 'December 2025',
                                    gradient: 'from-emerald-400 to-green-500',
                                    shadow: 'shadow-emerald-500/25',
                                    bg: 'from-green-50 via-emerald-50/80 to-teal-50/60',
                                    border: 'border-emerald-200/80',
                                },
                                {
                                    icon: Award,
                                    title: 'Math Champion',
                                    subtitle: '95% in Unit Test',
                                    gradient: 'from-blue-400 to-cyan-500',
                                    shadow: 'shadow-blue-500/25',
                                    bg: 'from-blue-50 via-cyan-50/80 to-sky-50/60',
                                    border: 'border-blue-200/80',
                                },
                                {
                                    icon: TrendingUp,
                                    title: 'Most Improved',
                                    subtitle: '+15% in Science',
                                    gradient: 'from-violet-400 to-purple-500',
                                    shadow: 'shadow-violet-500/25',
                                    bg: 'from-violet-50 via-purple-50/80 to-fuchsia-50/60',
                                    border: 'border-violet-200/80',
                                },
                            ].map((achievement) => (
                                <div
                                    key={achievement.title}
                                    className={`p-5 rounded-xl bg-gradient-to-br ${achievement.bg} border ${achievement.border} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg cursor-pointer group`}
                                >
                                    <div className="flex flex-col items-center text-center">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${achievement.gradient} flex items-center justify-center ${achievement.shadow} shadow-lg mb-3 transition-transform group-hover:scale-110`}>
                                            <achievement.icon className="h-6 w-6 text-white" />
                                        </div>
                                        <p className="font-bold text-sm text-slate-800 mb-0.5">{achievement.title}</p>
                                        <p className="text-[11px] text-slate-500 font-medium">{achievement.subtitle}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
