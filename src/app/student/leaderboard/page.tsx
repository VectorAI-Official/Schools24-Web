"use client"

import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Trophy, Medal, TrendingUp, Star, ArrowLeft, Crown, Flame, Target,
    ArrowUp, ArrowDown, Minus, Sparkles, BarChart3, ChevronRight, Award, Zap
} from 'lucide-react'
import { leaderboardData, mockStudents } from '@/lib/mockData'
import { getInitials } from '@/lib/utils'

const student = mockStudents[0]

export default function StudentLeaderboardPage() {
    const router = useRouter()

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <Crown className="h-5 w-5 text-amber-500" />
            case 1: return <Medal className="h-5 w-5 text-slate-400" />
            case 2: return <Award className="h-5 w-5 text-orange-500" />
            default: return null
        }
    }

    const getPodiumGradient = (index: number) => {
        switch (index) {
            case 0: return 'from-amber-400 via-yellow-400 to-amber-500'
            case 1: return 'from-slate-300 via-slate-400 to-slate-500'
            case 2: return 'from-orange-400 via-amber-500 to-orange-500'
            default: return 'from-slate-300 to-slate-400'
        }
    }

    const getPodiumBg = (index: number) => {
        switch (index) {
            case 0: return 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50/60'
            case 1: return 'bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100/60'
            case 2: return 'bg-gradient-to-br from-orange-50 via-amber-50/80 to-yellow-50/60'
            default: return 'bg-white'
        }
    }

    const getPodiumBorder = (index: number) => {
        switch (index) {
            case 0: return 'border-amber-200/80'
            case 1: return 'border-slate-200/80'
            case 2: return 'border-orange-200/80'
            default: return 'border-slate-200'
        }
    }

    const getPodiumShadow = (index: number) => {
        switch (index) {
            case 0: return 'shadow-amber-200/40'
            case 1: return 'shadow-slate-200/40'
            case 2: return 'shadow-orange-200/40'
            default: return ''
        }
    }

    const getScoreColor = (index: number) => {
        switch (index) {
            case 0: return 'text-amber-600'
            case 1: return 'text-slate-600'
            case 2: return 'text-orange-600'
            default: return 'text-slate-700'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <Trophy className="h-4.5 w-4.5 text-white" />
                                </div>
                                Class Leaderboard
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-0.5 ml-[3.25rem]">See how you rank among your classmates</p>
                        </div>
                    </div>
                    <Button
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm tracking-wide border-0"
                        onClick={() => router.push('/student/performance')}
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Performance
                    </Button>
                </div>

                {/* Your Position - Highlighted */}
                <Card className="border border-teal-200 shadow-lg shadow-teal-100/50 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full -translate-y-24 translate-x-24" />
                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full translate-y-16 -translate-x-16" />
                    <CardContent className="p-4 md:p-6 relative z-10">
                        <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                                #{student.performance.rank}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <Crown className="h-5 w-5 text-amber-500" />
                                    <h3 className="text-lg font-bold text-slate-800">Your Current Rank</h3>
                                </div>
                                <p className="text-sm text-slate-500 font-medium">Class {student.class}-{student.section} • {student.performance.totalStudents} students</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl md:text-4xl font-bold text-teal-600">{student.performance.averageScore}%</p>
                                <Badge className="mt-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    +2 ranks this month
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Top 3 Podium */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                    {leaderboardData.students.slice(0, 3).map((s, index) => {
                        const isCurrentUser = s.name === student.name
                        return (
                            <Card
                                key={s.rank}
                                className={`border ${getPodiumBorder(index)} shadow-lg ${getPodiumShadow(index)} overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer ${isCurrentUser ? 'ring-2 ring-teal-400 ring-offset-2' : ''}`}
                            >
                                <CardContent className={`p-6 ${getPodiumBg(index)} relative`}>
                                    {/* Decorative circle */}
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-12 translate-x-12" />

                                    <div className="text-center relative z-10">
                                        {/* Crown for 1st */}
                                        {index === 0 && (
                                            <div className="flex justify-center mb-2">
                                                <Crown className="h-7 w-7 text-amber-400 drop-shadow-md animate-bounce" />
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className="relative inline-block mb-4">
                                            <Avatar className={`h-20 w-20 border-[3px] border-white shadow-xl`}>
                                                <AvatarFallback className={`text-xl bg-gradient-to-br ${getPodiumGradient(index)} text-white font-bold`}>
                                                    {getInitials(s.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={`absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-lg bg-gradient-to-br ${getPodiumGradient(index)}`}>
                                                {getRankIcon(index)}
                                            </div>
                                        </div>

                                        {/* Name & Score */}
                                        <h3 className="font-bold text-lg text-slate-800 mb-0.5">{s.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium mb-3">Class {s.class}</p>
                                        <p className={`text-3xl font-bold ${getScoreColor(index)}`}>{s.score}%</p>

                                        {isCurrentUser && (
                                            <Badge className="mt-3 bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[10px] font-bold uppercase tracking-wider">
                                                <Sparkles className="h-3 w-3 mr-1" />
                                                That's You!
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>

                {/* Full Leaderboard */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-4 md:p-6">
                        {/* Section Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                                    <Flame className="h-4.5 w-4.5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">Full Rankings</h3>
                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">All students in your class</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                                {mockStudents.length} students
                            </Badge>
                        </div>

                        {/* Rankings List */}
                        <div className="space-y-2">
                            {mockStudents.map((s, index) => {
                                const isCurrentUser = s.id === student.id
                                const isTop3 = index < 3

                                return (
                                    <div
                                        key={s.id}
                                        className={`flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer group ${isCurrentUser
                                            ? 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 border border-teal-200 shadow-sm'
                                            : isTop3
                                                ? `${getPodiumBg(index)} border ${getPodiumBorder(index)}`
                                                : 'bg-slate-50/50 border border-transparent hover:bg-white hover:border-slate-200'
                                            }`}
                                    >
                                        {/* Rank Badge */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-110 ${isTop3
                                            ? `bg-gradient-to-br ${getPodiumGradient(index)} text-white`
                                            : 'bg-slate-200 text-slate-600'
                                            }`}>
                                            {isTop3 ? getRankIcon(index) : index + 1}
                                        </div>

                                        {/* Avatar */}
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarFallback className={`text-sm font-bold ${isCurrentUser
                                                ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                                                : isTop3
                                                    ? `bg-gradient-to-br ${getPodiumGradient(index)} text-white`
                                                    : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {getInitials(s.name)}
                                            </AvatarFallback>
                                        </Avatar>

                                        {/* Name */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-sm text-slate-800 truncate">{s.name}</p>
                                                {isCurrentUser && (
                                                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 font-medium">Class {s.class}-{s.section}</p>
                                        </div>

                                        {/* Score & Grade */}
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                className={`text-[10px] font-bold uppercase tracking-wider ${s.grade.startsWith('A')
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                                    : s.grade.startsWith('B')
                                                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                                                        : 'bg-slate-100 text-slate-600 border-slate-300'
                                                    } border`}
                                            >
                                                Grade {s.grade}
                                            </Badge>
                                            <p className={`text-lg font-bold min-w-[3rem] text-right ${isCurrentUser ? 'text-teal-600' : isTop3 ? getScoreColor(index) : 'text-slate-700'}`}>
                                                {s.performance.averageScore}%
                                            </p>
                                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
