"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Trophy, Medal, Star, Crown, Flame,
    Sparkles, BarChart3, ChevronRight, Award,
    ChevronDown, BookOpen, ClipboardList, Loader2, AlertCircle, GraduationCap,
} from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { api } from '@/lib/api'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QuizLeaderboardEntry {
    student_id: string
    student_name: string
    total_quizzes: number
    quizzes_attempted: number
    avg_best_pct: number   // 0–100
    rating: number         // 0.00–5.00
    rank: number
    is_current_student: boolean
}

interface QuizLeaderboardResponse {
    class_id: string
    class_name: string
    total_quizzes: number
    total_students: number
    entries: QuizLeaderboardEntry[]
    my_entry?: QuizLeaderboardEntry
}

interface AssessmentLeaderboardEntry {
    student_id: string
    student_name: string
    total_assessments: number
    assessments_with_scores: number
    avg_assessment_pct: number
    rank: number
    is_current_student: boolean
}

interface AssessmentLeaderboardResponse {
    class_id: string
    class_name: string
    total_assessments: number
    total_students: number
    entries: AssessmentLeaderboardEntry[]
    my_entry?: AssessmentLeaderboardEntry
}

interface SchoolAssessmentLeaderboardEntry {
    student_id: string
    student_name: string
    class_name: string
    assessments_with_scores: number
    avg_assessment_pct: number
    rank: number
    is_current_student: boolean
}

interface SchoolAssessmentLeaderboardResponse {
    total_students: number
    entries: SchoolAssessmentLeaderboardEntry[]
    my_entry?: SchoolAssessmentLeaderboardEntry
}

type LeaderboardMode = 'quiz' | 'assessments' | 'school-assessments'

// ── Helpers ───────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
    const full = Math.floor(rating)
    const partial = rating % 1
    const empty = 5 - full - (partial > 0 ? 1 : 0)
    const iconSize = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
    return (
        <span className="inline-flex items-center gap-0.5">
            {Array.from({ length: full }).map((_, i) => (
                <Star key={`f${i}`} className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
            ))}
            {partial > 0 && (
                <span className="relative inline-block" style={{ width: size === 'lg' ? 20 : 14 }}>
                    <Star className={cn(iconSize, 'text-slate-200 fill-slate-200')} />
                    <span
                        className="absolute inset-0 overflow-hidden"
                        style={{ width: `${partial * 100}%` }}
                    >
                        <Star className={cn(iconSize, 'fill-amber-400 text-amber-400')} />
                    </span>
                </span>
            )}
            {Array.from({ length: empty }).map((_, i) => (
                <Star key={`e${i}`} className={cn(iconSize, 'fill-slate-200 text-slate-200')} />
            ))}
        </span>
    )
}

const getRankIcon = (rank: number) => {
    switch (rank) {
        case 1: return <Crown className="h-5 w-5 text-amber-500" />
        case 2: return <Medal className="h-5 w-5 text-slate-400" />
        case 3: return <Award className="h-5 w-5 text-orange-500" />
        default: return null
    }
}

const getPodiumGradient = (rank: number) => {
    switch (rank) {
        case 1: return 'from-amber-400 via-yellow-400 to-amber-500'
        case 2: return 'from-slate-300 via-slate-400 to-slate-500'
        case 3: return 'from-orange-400 via-amber-500 to-orange-500'
        default: return 'from-slate-300 to-slate-400'
    }
}

const getPodiumBg = (rank: number) => {
    switch (rank) {
        case 1: return 'bg-gradient-to-br from-amber-50 via-yellow-50/80 to-orange-50/60'
        case 2: return 'bg-gradient-to-br from-slate-50 via-gray-50/80 to-slate-100/60'
        case 3: return 'bg-gradient-to-br from-orange-50 via-amber-50/80 to-yellow-50/60'
        default: return 'bg-white'
    }
}

const getPodiumBorder = (rank: number) => {
    switch (rank) {
        case 1: return 'border-amber-200/80'
        case 2: return 'border-slate-200/80'
        case 3: return 'border-orange-200/80'
        default: return 'border-slate-200'
    }
}

const getScoreColor = (rank: number) => {
    switch (rank) {
        case 1: return 'text-amber-600'
        case 2: return 'text-slate-600'
        case 3: return 'text-orange-600'
        default: return 'text-slate-700'
    }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StudentLeaderboardPage() {
    const router = useRouter()
    const [mode, setMode] = useState<LeaderboardMode>('quiz')

    const { data, isLoading, isError, error } = useQuery<QuizLeaderboardResponse>({
        queryKey: ['student-quiz-leaderboard'],
        queryFn: () => api.get<QuizLeaderboardResponse>('/student/leaderboard/quiz'),
        staleTime: 60_000,
        enabled: mode === 'quiz',
    })
    const {
        data: assessmentsData,
        isLoading: isAssessmentsLoading,
        isError: isAssessmentsError,
        error: assessmentsError,
    } = useQuery<AssessmentLeaderboardResponse>({
        queryKey: ['student-assessment-leaderboard'],
        queryFn: () => api.get<AssessmentLeaderboardResponse>('/student/leaderboard/assessments'),
        staleTime: 60_000,
        enabled: mode === 'assessments',
    })
    const {
        data: schoolData,
        isLoading: isSchoolLoading,
        isError: isSchoolError,
        error: schoolError,
    } = useQuery<SchoolAssessmentLeaderboardResponse>({
        queryKey: ['student-school-assessment-leaderboard'],
        queryFn: () => api.get<SchoolAssessmentLeaderboardResponse>('/student/leaderboard/school-assessments'),
        staleTime: 5 * 60_000,
        enabled: mode === 'school-assessments',
    })

    const entries = data?.entries ?? []
    const myEntry = data?.my_entry
    const top3 = entries.slice(0, 3)

    const modeLabel = mode === 'quiz' ? 'Quiz' : mode === 'assessments' ? 'My Class' : 'Whole School'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-100 p-4 md:p-6">
            <div className="max-w-[1200px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/25">
                                    <Trophy className="h-4.5 w-4.5 text-white" />
                                </div>
                                {mode === 'school-assessments' ? 'School Leaderboard' : 'Class Leaderboard'}
                            </h1>
                            <p className="text-sm text-slate-500 font-medium mt-0.5 ml-[3.25rem]">
                                {mode === 'school-assessments'
                                    ? `${schoolData?.total_students ?? '—'} students ranked across all classes`
                                    : mode === 'assessments' && assessmentsData
                                    ? `${assessmentsData.class_name} · ${assessmentsData.total_students} students`
                                    : data?.class_name
                                    ? `${data.class_name} · ${data.total_students} students`
                                    : 'See how you rank among your classmates'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Quiz & Assessments dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-semibold px-4 py-2.5 rounded-xl text-sm"
                                >
                                    {mode === 'quiz'
                                        ? <BookOpen className="w-4 h-4 mr-2" />
                                        : mode === 'school-assessments'
                                        ? <GraduationCap className="w-4 h-4 mr-2" />
                                        : <ClipboardList className="w-4 h-4 mr-2" />
                                    }
                                    {modeLabel}
                                    <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-70" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                    className={cn('flex items-center gap-2 cursor-pointer', mode === 'quiz' && 'bg-indigo-50 text-indigo-700')}
                                    onClick={() => setMode('quiz')}
                                >
                                    <BookOpen className="w-4 h-4" />
                                    Quiz
                                    {mode === 'quiz' && <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase">Active</span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={cn('flex items-center gap-2 cursor-pointer', mode === 'assessments' && 'bg-indigo-50 text-indigo-700')}
                                    onClick={() => setMode('assessments')}
                                >
                                    <ClipboardList className="w-4 h-4" />
                                    My Class (Exams)
                                    {mode === 'assessments' && <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase">Active</span>}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className={cn('flex items-center gap-2 cursor-pointer', mode === 'school-assessments' && 'bg-indigo-50 text-indigo-700')}
                                    onClick={() => setMode('school-assessments')}
                                >
                                    <GraduationCap className="w-4 h-4" />
                                    Whole School (Exams)
                                    {mode === 'school-assessments' && <span className="ml-auto text-[10px] font-bold text-indigo-500 uppercase">Active</span>}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-teal-500/25 hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-sm tracking-wide border-0"
                            onClick={() => router.push('/student/performance')}
                        >
                            <BarChart3 className="w-4 h-4 mr-2" />
                            View Performance
                        </Button>
                    </div>
                </div>

                {/* Assessments section */}
                {mode === 'assessments' && (
                    <>
                        {isAssessmentsLoading && (
                            <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading assessments leaderboard…</span>
                            </div>
                        )}

                        {isAssessmentsError && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
                                    <p className="text-red-600 font-semibold">Failed to load leaderboard</p>
                                    <p className="text-slate-400 text-sm mt-1">{(assessmentsError as Error)?.message}</p>
                                </CardContent>
                            </Card>
                        )}

                        {!isAssessmentsLoading && !isAssessmentsError && assessmentsData && assessmentsData.total_assessments === 0 && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">No assessments yet</h3>
                                    <p className="text-slate-400 text-sm text-center">
                                        Once assessments are created and marks are uploaded for your class, rankings appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {!isAssessmentsLoading && !isAssessmentsError && assessmentsData && assessmentsData.total_assessments > 0 && (
                            <>
                                <Card className="border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/70 to-violet-50/40">
                                    <CardContent className="p-3 px-5 flex items-center gap-3">
                                        <ClipboardList className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                        <p className="text-sm text-indigo-700">
                                            Rank is based on per-assessment average across subjects, then averaged across all assessments.
                                            Total assessments: <span className="font-bold">{assessmentsData.total_assessments}</span>.
                                        </p>
                                    </CardContent>
                                </Card>

                                {assessmentsData.my_entry && (
                                    <Card className="border border-teal-200 shadow-lg shadow-teal-100/50 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 overflow-hidden relative">
                                        <CardContent className="p-4 md:p-6 relative z-10">
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                                                    #{assessmentsData.my_entry.rank}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-800">Your Current Rank</h3>
                                                    <p className="text-sm text-slate-500 font-medium">
                                                        {assessmentsData.class_name} · {assessmentsData.my_entry.assessments_with_scores}/{assessmentsData.total_assessments} assessments scored
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl md:text-4xl font-bold text-teal-600">
                                                        {assessmentsData.my_entry.avg_assessment_pct.toFixed(2)}
                                                        <span className="text-base font-medium text-teal-400">%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="space-y-2">
                                            {assessmentsData.entries.map((entry) => (
                                                <div
                                                    key={entry.student_id}
                                                    className={cn(
                                                        'flex items-center gap-4 p-3.5 rounded-xl border transition-all',
                                                        entry.is_current_student
                                                            ? 'bg-teal-50 border-teal-200'
                                                            : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200'
                                                    )}
                                                >
                                                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm">
                                                        {entry.rank}
                                                    </div>
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="text-sm font-bold bg-slate-100 text-slate-600">
                                                            {getInitials(entry.student_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm text-slate-800 truncate">{entry.student_name}</p>
                                                            {entry.is_current_student && (
                                                                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            {entry.assessments_with_scores}/{entry.total_assessments} assessments
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            'text-lg font-bold',
                                                            entry.is_current_student ? 'text-teal-600' : 'text-slate-700'
                                                        )}>
                                                            {entry.avg_assessment_pct.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                )}

                {/* School-wide Assessment Leaderboard section */}
                {mode === 'school-assessments' && (
                    <>
                        {isSchoolLoading && (
                            <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading school-wide leaderboard…</span>
                            </div>
                        )}

                        {isSchoolError && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
                                    <p className="text-red-600 font-semibold">Failed to load leaderboard</p>
                                    <p className="text-slate-400 text-sm mt-1">{(schoolError as Error)?.message}</p>
                                </CardContent>
                            </Card>
                        )}

                        {!isSchoolLoading && !isSchoolError && schoolData && schoolData.total_students === 0 && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">No results yet</h3>
                                    <p className="text-slate-400 text-sm text-center">
                                        Once assessment marks are uploaded for any class, school-wide rankings appear here.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {!isSchoolLoading && !isSchoolError && schoolData && schoolData.total_students > 0 && (
                            <>
                                {/* Formula explanation */}
                                <Card className="border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/70 to-violet-50/40">
                                    <CardContent className="p-3 px-5 flex items-center gap-3">
                                        <GraduationCap className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                        <p className="text-sm text-indigo-700">
                                            Score = average of per-assessment subject-mark averages across all completed exams.
                                            Each student is ranked against every other student in the school.
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* My position card */}
                                {schoolData.my_entry && (
                                    <Card className="border border-teal-200 shadow-lg shadow-teal-100/50 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 overflow-hidden">
                                        <CardContent className="p-4 md:p-6">
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                                                    #{schoolData.my_entry.rank}
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-slate-800">Your School Rank</h3>
                                                    <p className="text-sm text-slate-500 font-medium">
                                                        {schoolData.my_entry.class_name} · {schoolData.my_entry.assessments_with_scores} exam{schoolData.my_entry.assessments_with_scores !== 1 ? 's' : ''} scored · out of {schoolData.total_students} students
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl md:text-4xl font-bold text-teal-600">
                                                        {schoolData.my_entry.avg_assessment_pct.toFixed(2)}
                                                        <span className="text-base font-medium text-teal-400">%</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Full rankings list */}
                                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="space-y-2">
                                            {schoolData.entries.map((entry) => (
                                                <div
                                                    key={entry.student_id}
                                                    className={cn(
                                                        'flex items-center gap-4 p-3.5 rounded-xl border transition-all',
                                                        entry.is_current_student
                                                            ? 'bg-teal-50 border-teal-200'
                                                            : 'bg-slate-50/50 border-transparent hover:bg-white hover:border-slate-200'
                                                    )}
                                                >
                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                                                        entry.rank === 1 ? 'bg-amber-100 text-amber-700' :
                                                        entry.rank === 2 ? 'bg-slate-200 text-slate-700' :
                                                        entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {entry.rank === 1 ? <Crown className="w-4 h-4 text-amber-500" /> :
                                                         entry.rank === 2 ? <Medal className="w-4 h-4 text-slate-500" /> :
                                                         entry.rank === 3 ? <Award className="w-4 h-4 text-orange-500" /> :
                                                         <span>{entry.rank}</span>}
                                                    </div>
                                                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="text-sm font-bold bg-slate-100 text-slate-600">
                                                            {getInitials(entry.student_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-semibold text-sm text-slate-800 truncate">{entry.student_name}</p>
                                                            {entry.is_current_student && (
                                                                <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-slate-400 font-medium">
                                                            {entry.class_name} · {entry.assessments_with_scores} exam{entry.assessments_with_scores !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={cn(
                                                            'text-lg font-bold',
                                                            entry.is_current_student ? 'text-teal-600' : 'text-slate-700'
                                                        )}>
                                                            {entry.avg_assessment_pct.toFixed(2)}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                )}

                {mode === 'quiz' && (
                    <>
                        {/* Loading */}
                        {isLoading && (
                            <div className="flex items-center justify-center py-20 gap-2 text-slate-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span>Loading leaderboard…</span>
                            </div>
                        )}

                        {/* Error */}
                        {isError && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <AlertCircle className="w-12 h-12 text-red-300 mb-3" />
                                    <p className="text-red-600 font-semibold">Failed to load leaderboard</p>
                                    <p className="text-slate-400 text-sm mt-1">{(error as Error)?.message}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Empty state: data loaded but no quizzes at all */}
                        {!isLoading && !isError && data && data.total_quizzes === 0 && (
                            <Card className="border-0 shadow-sm bg-white">
                                <CardContent className="p-12 flex flex-col items-center justify-center">
                                    <GraduationCap className="w-14 h-14 text-slate-300 mb-4" />
                                    <h3 className="text-lg font-bold text-slate-700 mb-1">No quizzes yet</h3>
                                    <p className="text-slate-400 text-sm text-center">
                                        Once your teacher or the platform assigns quizzes to your class,<br />
                                        rankings will appear here based on your scores.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Main leaderboard content */}
                        {!isLoading && !isError && data && data.total_quizzes > 0 && (
                            <>
                                {/* Context banner: total quizzes driving the rating */}
                                <Card className="border border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/70 to-violet-50/40">
                                    <CardContent className="p-3 px-5 flex items-center gap-3">
                                        <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                        <p className="text-sm text-indigo-700">
                                            Rating is based on <span className="font-bold">{data.total_quizzes} quiz{data.total_quizzes !== 1 ? 'zes' : ''}</span> assigned to your class.&nbsp;
                                            Every new quiz reduces all ratings until completed — first to finish climbs the highest.
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Your Position */}
                                <Card className="border border-teal-200 shadow-lg shadow-teal-100/50 bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-teal-200/30 to-emerald-200/30 rounded-full -translate-y-24 translate-x-24" />
                                    <div className="absolute bottom-0 left-0 w-36 h-36 bg-gradient-to-br from-cyan-200/20 to-teal-200/20 rounded-full translate-y-16 -translate-x-16" />
                                    <CardContent className="p-4 md:p-6 relative z-10">
                                        {myEntry ? (
                                            <div className="flex items-center gap-4 md:gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-teal-500/30">
                                                    #{myEntry.rank}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Crown className="h-5 w-5 text-amber-500" />
                                                        <h3 className="text-lg font-bold text-slate-800">Your Current Rank</h3>
                                                    </div>
                                                    <p className="text-sm text-slate-500 font-medium">
                                                        {data.class_name} · {data.total_students} students · {myEntry.quizzes_attempted}/{data.total_quizzes} quizzes done
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-3xl md:text-4xl font-bold text-teal-600">{myEntry.rating.toFixed(2)}<span className="text-base font-medium text-teal-400">/5.0</span></p>
                                                    <div className="flex justify-end mt-1">
                                                        <StarRating rating={myEntry.rating} size="sm" />
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-0.5">avg best {myEntry.avg_best_pct.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-slate-500 text-sm text-center py-2">Your ranking is not available yet.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Top 3 Podium */}
                                {top3.length > 0 && (
                                    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                                        {top3.map((entry) => (
                                            <Card
                                                key={entry.student_id}
                                                className={cn(
                                                    `border ${getPodiumBorder(entry.rank)} shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl cursor-pointer`,
                                                    entry.is_current_student ? 'ring-2 ring-teal-400 ring-offset-2' : ''
                                                )}
                                            >
                                                <CardContent className={`p-6 ${getPodiumBg(entry.rank)} relative`}>
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/30 rounded-full -translate-y-12 translate-x-12" />
                                                    <div className="text-center relative z-10">
                                                        {entry.rank === 1 && (
                                                            <div className="flex justify-center mb-2">
                                                                <Crown className="h-7 w-7 text-amber-400 drop-shadow-md animate-bounce" />
                                                            </div>
                                                        )}
                                                        <div className="relative inline-block mb-4">
                                                            <Avatar className="h-20 w-20 border-[3px] border-white shadow-xl">
                                                                <AvatarFallback className={`text-xl bg-gradient-to-br ${getPodiumGradient(entry.rank)} text-white font-bold`}>
                                                                    {getInitials(entry.student_name)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className={`absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shadow-lg bg-gradient-to-br ${getPodiumGradient(entry.rank)}`}>
                                                                {getRankIcon(entry.rank)}
                                                            </div>
                                                        </div>
                                                        <h3 className="font-bold text-lg text-slate-800 mb-0.5">{entry.student_name}</h3>
                                                        <p className="text-xs text-slate-500 font-medium mb-2">{data.class_name}</p>
                                                        <p className={`text-3xl font-bold ${getScoreColor(entry.rank)}`}>
                                                            {entry.rating.toFixed(2)}
                                                            <span className="text-sm font-medium opacity-60">/5.0</span>
                                                        </p>
                                                        <div className="flex justify-center mt-1.5 mb-2">
                                                            <StarRating rating={entry.rating} size="sm" />
                                                        </div>
                                                        <p className="text-[11px] text-slate-400">
                                                            {entry.quizzes_attempted}/{data.total_quizzes} quizzes done
                                                        </p>
                                                        {entry.is_current_student && (
                                                            <Badge className="mt-3 bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[10px] font-bold uppercase tracking-wider">
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                                That&apos;s You!
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {/* Full Rankings */}
                                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                                    <CardContent className="p-4 md:p-6">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                                                    <Flame className="h-4.5 w-4.5 text-white" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-slate-800 text-sm tracking-wide">Full Rankings</h3>
                                                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest">
                                                        Quiz ratings · out of 5.0
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-slate-500 border-slate-200 text-[10px] font-bold uppercase tracking-wider">
                                                {data.total_students} student{data.total_students !== 1 ? 's' : ''}
                                            </Badge>
                                        </div>

                                        <div className="space-y-2">
                                            {entries.map((entry) => {
                                                const isTop3 = entry.rank <= 3
                                                return (
                                                    <div
                                                        key={entry.student_id}
                                                        className={cn(
                                                            'flex items-center gap-4 p-3.5 rounded-xl transition-all duration-300 hover:shadow-md cursor-pointer group',
                                                            entry.is_current_student
                                                                ? 'bg-gradient-to-r from-teal-50 via-emerald-50/60 to-cyan-50/40 border border-teal-200 shadow-sm'
                                                                : isTop3
                                                                    ? `${getPodiumBg(entry.rank)} border ${getPodiumBorder(entry.rank)}`
                                                                    : 'bg-slate-50/50 border border-transparent hover:bg-white hover:border-slate-200'
                                                        )}
                                                    >
                                                        {/* Rank Badge */}
                                                        <div className={cn(
                                                            'w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm transition-transform group-hover:scale-110 flex-shrink-0',
                                                            isTop3
                                                                ? `bg-gradient-to-br ${getPodiumGradient(entry.rank)} text-white`
                                                                : 'bg-slate-200 text-slate-600'
                                                        )}>
                                                            {isTop3 ? getRankIcon(entry.rank) : entry.rank}
                                                        </div>

                                                        {/* Avatar */}
                                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm flex-shrink-0">
                                                            <AvatarFallback className={cn(
                                                                'text-sm font-bold',
                                                                entry.is_current_student
                                                                    ? 'bg-gradient-to-br from-teal-400 to-emerald-500 text-white'
                                                                    : isTop3
                                                                        ? `bg-gradient-to-br ${getPodiumGradient(entry.rank)} text-white`
                                                                        : 'bg-slate-100 text-slate-600'
                                                            )}>
                                                                {getInitials(entry.student_name)}
                                                            </AvatarFallback>
                                                        </Avatar>

                                                        {/* Name */}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-semibold text-sm text-slate-800 truncate">{entry.student_name}</p>
                                                                {entry.is_current_student && (
                                                                    <Badge className="bg-teal-100 text-teal-700 hover:bg-teal-100 border border-teal-300 text-[9px] font-bold uppercase tracking-wider">You</Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-400 font-medium">
                                                                {entry.quizzes_attempted}/{data.total_quizzes} quizzes
                                                            </p>
                                                        </div>

                                                        {/* Rating */}
                                                        <div className="flex items-center gap-3 flex-shrink-0">
                                                            <div className="text-right">
                                                                <div className="flex items-center gap-1.5 justify-end">
                                                                    <StarRating rating={entry.rating} size="sm" />
                                                                    <p className={cn(
                                                                        'text-lg font-bold min-w-[3.2rem] text-right',
                                                                        entry.is_current_student ? 'text-teal-600' : isTop3 ? getScoreColor(entry.rank) : 'text-slate-700'
                                                                    )}>
                                                                        {entry.rating.toFixed(2)}
                                                                    </p>
                                                                </div>
                                                                <p className="text-[10px] text-slate-400 text-right">{entry.avg_best_pct.toFixed(1)}% avg</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
