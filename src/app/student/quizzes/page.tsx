"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Play, Clock, CheckCircle, Trophy, Sparkles, Target, BookOpen,
    ChevronRight, ChevronLeft, X, Eye, GraduationCap,
    Bookmark, BookmarkCheck, Timer, Award, Star, TrendingUp,
    FlaskConical, Calculator, Globe, Languages,
    AlertCircle, Check, XCircle, BarChart3, RefreshCw, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Backend types ────────────────────────────────────────────────────────────

interface StudentQuizListItem {
    id: string
    quiz_source: 'tenant' | 'global'
    title: string
    chapter_name: string
    class_name: string
    subject_name: string
    scheduled_at: string
    is_anytime: boolean
    duration_minutes: number
    total_marks: number
    question_count: number
    status: 'upcoming' | 'active' | 'completed'
    creator_role: 'teacher' | 'super_admin'
    creator_name: string
    attempt_count: number
    best_score?: number
    best_percentage?: number
    best_attempt_id?: string
}

interface QuizOption {
    id: string
    option_text: string
    order_index: number
}

interface QuizQuestion {
    id: string
    question_text: string
    marks: number
    order_index: number
    options: QuizOption[]
}

interface StartAttemptResponse {
    attempt_id: string
    quiz_id: string
    quiz_title: string
    subject_name: string
    duration_minutes: number
    total_marks: number
    started_at: string
    deadline_at: string
    questions: QuizQuestion[]
}

interface ReviewOption {
    id: string
    option_text: string
    is_correct: boolean
    is_selected: boolean
    order_index: number
}

interface ReviewQuestion {
    id: string
    question_text: string
    marks: number
    marks_obtained: number
    order_index: number
    options: ReviewOption[]
}

interface StudentQuizResult {
    attempt_id: string
    quiz_id: string
    quiz_title: string
    subject_name: string
    score: number
    total_marks: number
    percentage: number
    is_new_best: boolean
    best_score: number
    best_percentage: number
    submitted_at: string
    questions: ReviewQuestion[]
}

interface QuizListResponse {
    quizzes: StudentQuizListItem[]
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'review' | 'answered-review'
type ViewMode = 'dashboard' | 'quiz' | 'results'

// ─── Subject colour palette (deterministic by sorted index) ──────────────────
const SUBJECT_PALETTES = [
    { color: '#4f46e5', light: '#eef2ff' }, // indigo
    { color: '#0d9488', light: '#f0fdfa' }, // teal
    { color: '#7c3aed', light: '#faf5ff' }, // violet
    { color: '#ea580c', light: '#fff7ed' }, // orange
    { color: '#0284c7', light: '#f0f9ff' }, // sky
    { color: '#d97706', light: '#fffbeb' }, // amber
    { color: '#be185d', light: '#fdf2f8' }, // pink
    { color: '#16a34a', light: '#f0fdf4' }, // green
]
function getSubjectPalette(name: string, allSubjects: string[]) {
    const idx = allSubjects.indexOf(name)
    return SUBJECT_PALETTES[Math.max(0, idx) % SUBJECT_PALETTES.length]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentQuizzesPage() {
    const queryClient = useQueryClient()

    // ── Dashboard state ───────────────────────────────────────────────────────
    const [selectedSubjectName, setSelectedSubjectName] = useState<string | null>(null)
    const [chapterFilter, setChapterFilter] = useState<'default' | 'strongest' | 'weakest'>('default')
    const [selectedChapterName, setSelectedChapterName] = useState<string | null>(null)
    const [actingQuizId, setActingQuizId] = useState<string | null>(null)

    // ── Quiz-taking state ─────────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
    const [activeAttempt, setActiveAttempt] = useState<StartAttemptResponse | null>(null)
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({}) // questionId → optionId
    const [statuses, setStatuses] = useState<QuestionStatus[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ── Results state ─────────────────────────────────────────────────────────
    const [quizResult, setQuizResult] = useState<StudentQuizResult | null>(null)

    // ── Data ──────────────────────────────────────────────────────────────────

    const { data, isLoading, isError, error } = useQuery<QuizListResponse>({
        queryKey: ['student-quizzes'],
        queryFn: () => api.getOrEmpty<QuizListResponse>('/student/quizzes', { quizzes: [] }),
        staleTime: 30_000,
    })

    const quizzes = data?.quizzes ?? []
    const subjects = Array.from(new Set(quizzes.map(q => q.subject_name))).sort()

    // helper: display name for a quiz used as a chapter row
    const chapterDisplayName = (q: StudentQuizListItem) =>
        q.chapter_name?.trim() ? q.chapter_name : q.title

    // group quizzes by subject
    const subjectQuizzesMap: Record<string, StudentQuizListItem[]> = {}
    quizzes.forEach(q => {
        if (!subjectQuizzesMap[q.subject_name]) subjectQuizzesMap[q.subject_name] = []
        subjectQuizzesMap[q.subject_name].push(q)
    })

    // selected subject
    const selectedSubjectName_ = selectedSubjectName ?? subjects[0] ?? null
    const selectedPalette = selectedSubjectName_ ? getSubjectPalette(selectedSubjectName_, subjects) : SUBJECT_PALETTES[0]
    const subjectQuizzes = selectedSubjectName_ ? (subjectQuizzesMap[selectedSubjectName_] ?? []) : []

    // group quizzes by chapter_name to form chapter groups
    // completionProgress = completedQuizzes/totalQuizzes * 100.  ≥50% → strong, <50% → weak.
    interface ChapterGroup {
        name: string
        quizzes: StudentQuizListItem[]
        completionProgress: number  // 0-100 based on completed/total quiz count
        completedQuizzes: number
        totalQuizzes: number
        totalQuestions: number
        isStrong: boolean           // completionProgress >= 50
    }
    const chapterGroupMap: Record<string, ChapterGroup> = {}
    subjectQuizzes.forEach(q => {
        const key = q.chapter_name?.trim() || q.title
        if (!chapterGroupMap[key]) chapterGroupMap[key] = { name: key, quizzes: [], completionProgress: 0, completedQuizzes: 0, totalQuizzes: 0, totalQuestions: 0, isStrong: false }
        chapterGroupMap[key].quizzes.push(q)
        chapterGroupMap[key].totalQuizzes += 1
        if (q.attempt_count > 0) chapterGroupMap[key].completedQuizzes += 1
        chapterGroupMap[key].totalQuestions += q.question_count
    })
    const chapterGroups: ChapterGroup[] = Object.values(chapterGroupMap)
    chapterGroups.forEach(g => {
        g.completionProgress = g.totalQuizzes > 0
            ? Math.round((g.completedQuizzes / g.totalQuizzes) * 100)
            : 0
        g.isStrong = g.completionProgress >= 50
    })
    const sortedGroupedChapters = [...chapterGroups].sort((a, b) => {
        if (chapterFilter === 'strongest') {
            // primary: highest completion first; tiebreak: most quizzes done, then alphabetical
            if (b.completionProgress !== a.completionProgress) return b.completionProgress - a.completionProgress
            if (b.completedQuizzes !== a.completedQuizzes) return b.completedQuizzes - a.completedQuizzes
            return a.name.localeCompare(b.name)
        }
        if (chapterFilter === 'weakest') {
            // primary: lowest completion first; tiebreak: fewest quizzes done, then alphabetical
            if (a.completionProgress !== b.completionProgress) return a.completionProgress - b.completionProgress
            if (a.completedQuizzes !== b.completedQuizzes) return a.completedQuizzes - b.completedQuizzes
            return a.name.localeCompare(b.name)
        }
        // default: alphabetical by chapter name (always stable and predictable)
        return a.name.localeCompare(b.name)
    })

    // selected chapter (master-detail: clicking a chapter row shows quizzes in the right panel)
    const selectedChapter = chapterGroups.find(g => g.name === selectedChapterName) ?? null

    // recommendations: active quizzes < 50% progress
    const recommendations = subjectQuizzes
        .filter(q => q.status === 'active' && (q.best_percentage ?? 0) < 50)
        .slice(0, 3)

    const completedSessions = quizzes.filter(q => q.attempt_count > 0)
    const attemptedQuizzes = completedSessions
    const avgBestPct = attemptedQuizzes.length > 0
        ? Math.round(attemptedQuizzes.reduce((s, q) => s + (q.best_percentage ?? 0), 0) / attemptedQuizzes.length)
        : 0
    const bestPct = attemptedQuizzes.length > 0
        ? Math.max(...attemptedQuizzes.map(q => q.best_percentage ?? 0))
        : 0

    // ── Mutations ──────────────────────────────────────────────────────────────

    const startMutation = useMutation({
        mutationFn: (quizId: string) =>
            api.post<StartAttemptResponse>(`/student/quizzes/${quizId}/start`, {}),
        onSuccess: (resp) => {
            setActiveAttempt(resp)
            setAnswers({})
            setStatuses(resp.questions.map((_, i) => i === 0 ? 'not-answered' : 'not-visited'))
            setCurrentQ(0)
            const deadline = new Date(resp.deadline_at)
            const secs = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000))
            setTimeLeft(secs)
            setViewMode('quiz')
            toast.success('Quiz Started!', {
                description: `${resp.questions.length} questions · ${resp.duration_minutes} min`,
            })
        },
        onError: (err: Error) => toast.error('Could not start quiz', { description: err.message }),
    })

    const submitMutation = useMutation({
        mutationFn: ({ quizId, attemptId, answerMap }: {
            quizId: string; attemptId: string; answerMap: Record<string, string>
        }) => {
            const answerList = Object.entries(answerMap).map(([questionId, selectedOptionId]) => ({
                question_id: questionId,
                selected_option_id: selectedOptionId,
            }))
            return api.post<StudentQuizResult>(`/student/quizzes/${quizId}/submit`, {
                attempt_id: attemptId,
                answers: answerList,
            })
        },
        onSuccess: (res) => {
            stopTimer()
            setQuizResult(res)
            setViewMode('results')
            queryClient.invalidateQueries({ queryKey: ['student-quizzes'] })
            toast.success('Quiz Submitted!', {
                description: `You scored ${res.score}/${res.total_marks}`,
            })
        },
        onError: (err: Error) => toast.error('Submission failed', { description: err.message }),
    })

    const resultMutation = useMutation({
        mutationFn: (attemptId: string) =>
            api.get<StudentQuizResult>(`/student/quizzes/attempts/${attemptId}`),
        onSuccess: (res) => {
            setQuizResult(res)
            setViewMode('results')
        },
        onError: (err: Error) => toast.error('Could not load result', { description: err.message }),
    })

    // ── Timer ─────────────────────────────────────────────────────────────────

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    useEffect(() => {
        if (viewMode !== 'quiz' || timeLeft <= 0) return
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    stopTimer()
                    if (activeAttempt) {
                        submitMutation.mutate({
                            quizId: activeAttempt.quiz_id,
                            attemptId: activeAttempt.attempt_id,
                            answerMap: answers,
                        })
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return stopTimer
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewMode, timeLeft > 0])

    useEffect(() => () => stopTimer(), [stopTimer])

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    // ── Quiz actions ──────────────────────────────────────────────────────────

    const selectAnswer = (questionId: string, optionId: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionId }))
        setStatuses(prev => {
            const next = [...prev]
            const cur = next[currentQ]
            next[currentQ] = (cur === 'answered-review' || cur === 'review') ? 'answered-review' : 'answered'
            return next
        })
    }

    const clearAnswer = () => {
        if (!activeAttempt) return
        const qid = activeAttempt.questions[currentQ].id
        setAnswers(prev => { const n = { ...prev }; delete n[qid]; return n })
        setStatuses(prev => {
            const next = [...prev]
            next[currentQ] = next[currentQ] === 'answered-review' ? 'review' : 'not-answered'
            return next
        })
    }

    const toggleReview = () => {
        setStatuses(prev => {
            const next = [...prev]
            const cur = next[currentQ]
            if (cur === 'answered') next[currentQ] = 'answered-review'
            else if (cur === 'answered-review') next[currentQ] = 'answered'
            else if (cur === 'review') next[currentQ] = 'not-answered'
            else next[currentQ] = 'review'
            return next
        })
    }

    const goToQuestion = (idx: number) => {
        setStatuses(prev => {
            const next = [...prev]
            if (next[idx] === 'not-visited') next[idx] = 'not-answered'
            return next
        })
        setCurrentQ(idx)
    }

    const saveAndNext = () => {
        if (activeAttempt && currentQ < activeAttempt.questions.length - 1) goToQuestion(currentQ + 1)
    }

    const handleSubmitQuiz = useCallback(() => {
        if (!activeAttempt) return
        stopTimer()
        if (confirm('Submit your quiz? This action cannot be undone.')) {
            submitMutation.mutate({
                quizId: activeAttempt.quiz_id,
                attemptId: activeAttempt.attempt_id,
                answerMap: answers,
            })
        }
    }, [activeAttempt, answers, stopTimer, submitMutation])

    const backToDashboard = () => {
        stopTimer()
        setViewMode('dashboard')
        setActiveAttempt(null)
        setQuizResult(null)
        setAnswers({})
        setActingQuizId(null)
    }

    // sidebar legend counts — must be defined before quiz view early-return
    const statusCounts = {
        'not-visited':  statuses.filter(s => s === 'not-visited').length,
        'not-answered': statuses.filter(s => s === 'not-answered').length,
        'answered':     statuses.filter(s => s === 'answered' || s === 'answered-review').length,
        'review':       statuses.filter(s => s === 'review' || s === 'answered-review').length,
    }

    // ─────────────────────────────────────────────────────────────────────────
    // QUIZ TAKING VIEW
    // ─────────────────────────────────────────────────────────────────────────
    if (viewMode === 'quiz' && activeAttempt) {
        const question = activeAttempt.questions[currentQ]
        const timePercent = activeAttempt ? (timeLeft / (activeAttempt.duration_minutes * 60)) * 100 : 100
        const isLowTime = timeLeft < 60
        const selectedOptionId = answers[question?.id] ?? null

        return (
            <div className="min-h-[calc(100vh-120px)] flex flex-col animate-fade-in">
                {/* Quiz Header */}
                <div className="bg-card rounded-xl border border-border shadow-sm p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br from-indigo-500 to-violet-600">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-800">{activeAttempt.quiz_title}</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[11px] border-blue-200 text-blue-600">
                                        {activeAttempt.subject_name}
                                    </Badge>
                                    <Badge variant="outline" className="text-[11px] border-green-200 text-green-600">
                                        <Star className="w-3 h-3 mr-1" />{activeAttempt.total_marks} marks
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center justify-end gap-3">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${isLowTime ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-muted text-foreground'}`}>
                                <Timer className="w-5 h-5" />
                                {formatTime(timeLeft)}
                            </div>
                            <Button variant="outline" size="sm"
                                onClick={handleSubmitQuiz}
                                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                disabled={submitMutation.isPending}>
                                {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'End Test'}
                            </Button>
                        </div>
                    </div>
                    <Progress value={timePercent} className="mt-3 h-1.5" />
                </div>

                <div className="flex flex-col lg:flex-row gap-4 flex-1">
                    {/* Main Question Area */}
                    <div className="flex-1 flex flex-col">
                        <Card className="flex-1 border-0 shadow-lg">
                            <CardContent className="p-4 md:p-8">
                                <div className="flex items-start gap-4 mb-10">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 bg-gradient-to-br from-indigo-500 to-violet-600">
                                        {currentQ + 1}
                                    </div>
                                    <p className="text-lg text-slate-800 leading-relaxed pt-1.5">{question.question_text}</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {question.options.map((opt) => {
                                        const isSelected = selectedOptionId === opt.id
                                        const letter = String.fromCharCode(64 + opt.order_index)
                                        return (
                                            <button
                                                key={opt.id}
                                                onClick={() => selectAnswer(question.id, opt.id)}
                                                className={cn(
                                                    'flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200',
                                                    isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                                        : 'border-border bg-card hover:border-border/70 hover:bg-muted/20 hover:shadow-sm'
                                                )}
                                            >
                                                <div className={cn(
                                                    'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all',
                                                    isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-muted text-muted-foreground'
                                                )}>
                                                    {letter}
                                                </div>
                                                <span className={cn('text-[15px]', isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700')}>
                                                    {opt.option_text}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bottom Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-4 bg-card rounded-xl border border-border shadow-sm p-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <Button variant="outline" size="sm" disabled={currentQ === 0}
                                    onClick={() => goToQuestion(currentQ - 1)}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <Button variant="outline" size="sm" onClick={toggleReview}
                                    className={cn(
                                        statuses[currentQ]?.includes('review')
                                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                                            : 'border-border text-muted-foreground hover:bg-muted/30'
                                    )}>
                                    {statuses[currentQ]?.includes('review')
                                        ? <BookmarkCheck className="w-4 h-4 mr-1" />
                                        : <Bookmark className="w-4 h-4 mr-1" />}
                                    Review Later
                                </Button>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                                <Button variant="ghost" size="sm" onClick={clearAnswer} className="text-slate-500 hover:text-red-600">
                                    <XCircle className="w-4 h-4 mr-1" /> Clear
                                </Button>
                                <div className="max-w-full overflow-x-auto">
                                    <div className="flex items-center gap-1 border border-border rounded-lg px-1 py-0.5 w-max">
                                    {question.options.map((opt) => {
                                        const letter = String.fromCharCode(64 + opt.order_index)
                                        const isSelected = selectedOptionId === opt.id
                                        return (
                                            <button key={opt.id} onClick={() => selectAnswer(question.id, opt.id)}
                                                className={cn(
                                                    'w-8 h-8 rounded-md text-sm font-semibold transition-all',
                                                    isSelected ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:bg-muted'
                                                )}>
                                                {letter}
                                            </button>
                                        )
                                    })}
                                    </div>
                                </div>
                                <Button size="sm" onClick={saveAndNext}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                                    disabled={currentQ >= activeAttempt.questions.length - 1}>
                                    Save & Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                                {currentQ < activeAttempt.questions.length - 1 && (
                                    <Button variant="outline" size="sm" onClick={() => goToQuestion(currentQ + 1)}
                                        className="border-amber-200 text-amber-600 hover:bg-amber-50">
                                        Skip
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Question Navigation */}
                    <div className="w-full lg:w-[220px] xl:w-[240px] flex-shrink-0">
                        <Card className="border-0 shadow-lg lg:sticky lg:top-4">
                            <CardContent className="p-4">
                                <div className="space-y-2 mb-5">
                                    {[
                                        { color: 'bg-slate-300', label: 'Not Visited', count: statusCounts['not-visited'] },
                                        { color: 'bg-red-500', label: 'Not Answered', count: statusCounts['not-answered'] },
                                        { color: 'bg-emerald-500', label: 'Answered', count: statusCounts['answered'] },
                                        { color: 'bg-purple-500', label: 'Review Later', count: statusCounts['review'] },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2.5">
                                            <div className={cn('w-5 h-5 rounded-md text-white text-[10px] font-bold flex items-center justify-center shadow-sm', item.color)}>
                                                {item.count}
                                            </div>
                                            <span className="text-xs text-slate-600">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-border mb-4" />

                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {activeAttempt.questions.map((q, idx) => {
                                        const status = statuses[idx]
                                        const isCurrent = idx === currentQ
                                        let bgClass = 'bg-slate-200 text-slate-500'
                                        if (status === 'not-answered') bgClass = 'bg-red-500 text-white'
                                        if (status === 'answered') bgClass = 'bg-emerald-500 text-white'
                                        if (status === 'review') bgClass = 'bg-purple-500 text-white'
                                        if (status === 'answered-review') bgClass = 'bg-purple-500 text-white ring-2 ring-emerald-400'
                                        return (
                                            <button key={q.id} onClick={() => goToQuestion(idx)}
                                                className={cn(
                                                    'w-9 h-9 rounded-lg text-xs font-bold transition-all',
                                                    bgClass,
                                                    isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'
                                                )}>
                                                {idx + 1}
                                            </button>
                                        )
                                    })}
                                </div>

                                <Button onClick={handleSubmitQuiz} disabled={submitMutation.isPending}
                                    className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md">
                                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Submit Test
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESULTS VIEW
    // ─────────────────────────────────────────────────────────────────────────
    if (viewMode === 'results' && quizResult) {
        const percentage = Math.round(quizResult.percentage)
        const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D'
        const correct = quizResult.questions.filter(q => q.marks_obtained > 0).length
        const incorrect = quizResult.questions.filter(q => q.options.some(o => o.is_selected) && q.marks_obtained === 0).length
        const unanswered = quizResult.questions.filter(q => !q.options.some(o => o.is_selected)).length

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-slate-800">Quiz Results</h1>
                        <p className="text-slate-500 mt-1">{quizResult.quiz_title}</p>
                        {quizResult.is_new_best && (
                            <Badge className="mt-1 bg-amber-100 text-amber-800 border-amber-200">🎉 New Best Score!</Badge>
                        )}
                    </div>
                    <Button onClick={backToDashboard}
                        className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                        <RefreshCw className="w-4 h-4 mr-2" /> Take Another Quiz
                    </Button>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50 col-span-2 md:col-span-1">
                        <CardContent className="p-5 text-center">
                            <div className="relative w-24 h-24 mx-auto mb-3">
                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                                    <circle cx="50" cy="50" r="42"
                                        stroke={percentage >= 70 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                                        strokeWidth="8" fill="none"
                                        strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`}
                                        strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
                                    <span className="text-xs text-slate-500">Score</span>
                                </div>
                            </div>
                            <Badge className="text-lg px-3 py-1" style={{
                                background: percentage >= 70 ? '#dcfce7' : percentage >= 50 ? '#fef3c7' : '#fee2e2',
                                color: percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#d97706' : '#dc2626'
                            }}>
                                Grade {grade}
                            </Badge>
                        </CardContent>
                    </Card>

                    {[
                        { label: 'Total Score', value: `${quizResult.score}/${quizResult.total_marks}`, icon: Trophy, color: '#4f46e5', bg: 'from-indigo-50 to-violet-50' },
                        { label: 'Correct', value: correct, icon: CheckCircle, color: '#16a34a', bg: 'from-green-50 to-emerald-50' },
                        { label: 'Incorrect', value: incorrect, icon: XCircle, color: '#dc2626', bg: 'from-red-50 to-rose-50' },
                        { label: 'Unanswered', value: unanswered, icon: AlertCircle, color: '#d97706', bg: 'from-amber-50 to-yellow-50' },
                    ].map(item => (
                        <Card key={item.label} className={cn('border-0 shadow-lg bg-gradient-to-br', item.bg)}>
                            <CardContent className="p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white shadow-md" style={{ backgroundColor: item.color }}>
                                        <item.icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                                        <p className="text-xs text-slate-500">{item.label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Answer Review */}
                <Card className="border-0 shadow-lg">
                    <CardContent className="p-4 md:p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Eye className="w-5 h-5 text-indigo-600" />
                            <h3 className="text-lg font-bold text-slate-800">Answer Review</h3>
                        </div>
                        <div className="space-y-4">
                            {quizResult.questions.map((q, idx) => {
                                const isCorrect = q.marks_obtained > 0
                                const isUnanswered = !q.options.some(o => o.is_selected)
                                return (
                                    <div key={q.id} className={cn(
                                        'rounded-xl border-2 p-5',
                                        isCorrect ? 'border-green-200 bg-green-50/50'
                                            : isUnanswered ? 'border-amber-200 bg-amber-50/30'
                                                : 'border-red-200 bg-red-50/30'
                                    )}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={cn(
                                                'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                                                isCorrect ? 'bg-green-500' : isUnanswered ? 'bg-amber-500' : 'bg-red-500'
                                            )}>
                                                {isCorrect ? <Check className="w-4 h-4" /> : isUnanswered ? <AlertCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            </div>
                                            <div className="w-full">
                                                <p className="font-medium text-slate-800 mb-1">Q{idx + 1}. {q.question_text}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {q.options.map((opt) => (
                                                        <span key={opt.id} className={cn(
                                                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium',
                                                            opt.is_correct ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : '',
                                                            opt.is_selected && !opt.is_correct ? 'bg-red-100 text-red-700 ring-1 ring-red-300 line-through' : '',
                                                            !opt.is_correct && !opt.is_selected ? 'bg-muted text-muted-foreground' : ''
                                                        )}>
                                                            <span className="font-bold">{String.fromCharCode(64 + opt.order_index)}.</span> {opt.option_text}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DASHBOARD VIEW
    // ─────────────────────────────────────────────────────────────────────────

    // Map subject name → icon (same set as mock)
    const getSubjectIcon = (name: string): React.ElementType => {
        const n = name.toLowerCase()
        if (n.includes('math')) return Calculator
        if (n.includes('science') || n.includes('biology') || n.includes('chemistry') || n.includes('physics')) return FlaskConical
        if (n.includes('english') || n.includes('literature')) return BookOpen
        if (n.includes('social') || n.includes('history') || n.includes('geography') || n.includes('civics')) return Globe
        if (n.includes('hindi') || n.includes('language') || n.includes('tamil') || n.includes('telugu') || n.includes('urdu')) return Languages
        return BookOpen
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        Practice &amp; Quizzes
                    </h1>
                    <p className="text-slate-500 mt-1">Master each subject with focused practice</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Quizzes Taken', value: attemptedQuizzes.length, icon: Target, color: '#4f46e5', bg: 'from-indigo-50 to-violet-50' },
                    { label: 'Avg Score', value: attemptedQuizzes.length > 0 ? `${avgBestPct}%` : '—', icon: BarChart3, color: '#0d9488', bg: 'from-teal-50 to-emerald-50' },
                    { label: 'Best Score', value: attemptedQuizzes.length > 0 ? `${Math.round(bestPct)}%` : '—', icon: Trophy, color: '#d97706', bg: 'from-amber-50 to-yellow-50' },
                    { label: 'Performance', value: 'Top 10%', icon: TrendingUp, color: '#7c3aed', bg: 'from-purple-50 to-violet-50', hasSparkle: true },
                ].map(item => (
                    <Card key={item.label} className={cn('border-0 shadow-lg bg-gradient-to-br overflow-hidden', item.bg)}>
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8" style={{ background: `${item.color}10` }} />
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                                        {'hasSparkle' in item && item.hasSparkle && <Sparkles className="w-4 h-4 text-amber-500" />}
                                    </div>
                                    <p className="text-sm text-slate-500">{item.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Loading / Error states */}
            {isLoading && (
                <div className="flex items-center justify-center py-16 gap-2 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Loading quizzes…</span>
                </div>
            )}
            {isError && (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
                    <AlertCircle className="w-8 h-8" />
                    <p className="font-medium">Failed to load quizzes</p>
                    <p className="text-sm text-slate-400">{(error as Error)?.message}</p>
                </div>
            )}

            {!isLoading && !isError && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">

                    {/* ── LEFT: Subject Selector + Chapters ── */}
                    <div className="space-y-4">

                        {/* Subject Selector */}
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                    <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Select Subject</h3>
                                    {subjects.length > 0 && (
                                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {subjects.length} subject{subjects.length !== 1 ? 's' : ''}
                                        </span>
                                    )}
                                </div>
                                {subjects.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-4">No quizzes available yet</p>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2 max-h-[260px] overflow-y-auto pr-1">
                                        {subjects.map(subj => {
                                            const palette = getSubjectPalette(subj, subjects)
                                            const isActive = subj === selectedSubjectName_
                                            const Icon = getSubjectIcon(subj)
                                            const chapterCount = Object.values(
                                                (subjectQuizzesMap[subj] ?? []).reduce((acc, q) => {
                                                    const k = q.chapter_name?.trim() || q.title
                                                    acc[k] = true
                                                    return acc
                                                }, {} as Record<string, boolean>)
                                            ).length
                                            const quizCount = (subjectQuizzesMap[subj] ?? []).length
                                            return (
                                                <button key={subj}
                                                    onClick={() => { setSelectedSubjectName(subj); setChapterFilter('default'); setSelectedChapterName(null) }}
                                                    className={cn(
                                                        'flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border',
                                                        isActive
                                                            ? 'shadow-md ring-2 border-transparent'
                                                            : 'border-border/50 hover:bg-muted/30 hover:border-border'
                                                    )}
                                                    style={isActive ? { backgroundColor: palette.light, ['--tw-ring-color' as string]: palette.color } : {}}>
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0"
                                                        style={{ backgroundColor: isActive ? palette.color : '#f1f5f9', color: isActive ? 'white' : palette.color }}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm truncate" style={isActive ? { color: palette.color } : { color: '#334155' }}>{subj}</p>
                                                        <p className="text-[11px] text-slate-400">{chapterCount} chapter{chapterCount !== 1 ? 's' : ''} · {quizCount} quiz{quizCount !== 1 ? 'zes' : ''}</p>
                                                    </div>
                                                    <ChevronRight className={cn('w-4 h-4 transition-transform flex-shrink-0', isActive ? 'rotate-90' : '')}
                                                        style={{ color: isActive ? palette.color : '#94a3b8' }} />
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* All Chapters */}
                        {selectedSubjectName_ && (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-slate-700">All Chapters</h3>
                                        <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                                            {sortedGroupedChapters.length} chapter{sortedGroupedChapters.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    {/* Filter pills — rounded-full filled exactly like mock */}
                                    <div className="flex items-center gap-2 mb-4 mt-2">
                                        {(['default', 'strongest', 'weakest'] as const).map(f => (
                                            <button key={f} onClick={() => setChapterFilter(f)}
                                                className={cn(
                                                    'px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize',
                                                    chapterFilter === f ? 'text-white shadow-md' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                )}
                                                style={chapterFilter === f ? { backgroundColor: selectedPalette.color } : {}}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Chapter list */}
                                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                        {sortedGroupedChapters.length === 0 ? (
                                            <p className="text-xs text-slate-400 text-center py-6">No chapters yet</p>
                                        ) : (
                                            sortedGroupedChapters.map(group => {
                                                const isSelected = selectedChapterName === group.name
                                                const progressColor = group.isStrong ? '#10b981' : '#f59e0b'
                                                return (
                                                    <button
                                                        key={group.name}
                                                        onClick={() => setSelectedChapterName(isSelected ? null : group.name)}
                                                        className={cn(
                                                            'flex flex-col w-full p-3 rounded-xl text-left transition-all gap-2 border',
                                                            isSelected
                                                                ? 'shadow-sm ring-1 border-transparent'
                                                                : 'border-border/50 hover:bg-muted/30 hover:border-border'
                                                        )}
                                                        style={isSelected ? { backgroundColor: selectedPalette.light, ['--tw-ring-color' as string]: selectedPalette.color } : {}}>
                                                        {/* Row 1: name + chevron */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="font-semibold text-sm truncate" style={isSelected ? { color: selectedPalette.color } : { color: '#334155' }}>{group.name}</p>
                                                            <ChevronRight className={cn('w-4 h-4 transition-transform flex-shrink-0', isSelected ? 'rotate-90' : '')}
                                                                style={{ color: isSelected ? selectedPalette.color : '#94a3b8' }} />
                                                        </div>
                                                        {/* Row 2: progress bar */}
                                                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full transition-all duration-500"
                                                                style={{ width: `${group.completionProgress}%`, backgroundColor: progressColor }}
                                                            />
                                                        </div>
                                                        {/* Row 3: completion label + badge */}
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="text-[11px] text-slate-400">
                                                                {group.completedQuizzes}/{group.totalQuizzes} quiz{group.totalQuizzes !== 1 ? 'zes' : ''} done · {group.completionProgress}%
                                                            </span>
                                                            <span className={cn(
                                                                'text-[10px] font-bold px-2 py-0.5 rounded-full border',
                                                                group.isStrong
                                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                                                    : 'bg-amber-100 text-amber-700 border-amber-200'
                                                            )}>
                                                                {group.isStrong ? '↑ Strong' : '↓ Weak'}
                                                            </span>
                                                        </div>
                                                    </button>
                                                )
                                            })
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* ── RIGHT: Selected Chapter Quizzes + Recommendations + Completed Sessions ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Selected Chapter Quizzes — appears when a chapter is clicked on the left */}
                        {selectedChapter && (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-6 rounded-full flex-shrink-0" style={{ backgroundColor: selectedPalette.color }} />
                                            <h3 className="font-bold text-slate-700">{selectedChapter.name}</h3>
                                            <span className="text-xs text-slate-400 font-medium">{selectedChapter.quizzes.length} quiz{selectedChapter.quizzes.length !== 1 ? 'zes' : ''}</span>
                                        </div>
                                        <button onClick={() => setSelectedChapterName(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="space-y-2 max-h-[760px] overflow-y-auto pr-1">
                                        {selectedChapter.quizzes.map(quiz => {
                                            const pct = quiz.best_percentage ?? 0
                                            const canStart = quiz.status === 'active' || quiz.is_anytime
                                            const isActing = startMutation.isPending && actingQuizId === quiz.id
                                            const isLoadingResult = resultMutation.isPending && actingQuizId === quiz.id
                                            return (
                                                <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-border bg-card hover:shadow-md transition-all">
                                                    <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: selectedPalette.color + '50' }} />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-semibold text-sm text-slate-800 truncate">{quiz.title}</p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">
                                                            {quiz.question_count} Q &middot; {quiz.duration_minutes} min &middot; {quiz.total_marks} marks
                                                            {quiz.attempt_count > 0 && (
                                                                <span className="ml-1 font-bold" style={{ color: selectedPalette.color }}>&middot; Best: {pct.toFixed(0)}%</span>
                                                            )}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400 mt-0.5">By {quiz.creator_name} ({quiz.creator_role === 'super_admin' ? 'Super Admin' : 'Teacher'})</p>
                                                    </div>
                                                    <div className="flex-shrink-0 w-full sm:w-auto">
                                                        {canStart ? (
                                                            <button
                                                                onClick={() => { setActingQuizId(quiz.id); startMutation.mutate(quiz.id) }}
                                                                disabled={isActing}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md active:scale-95"
                                                                style={{ background: `linear-gradient(135deg, ${selectedPalette.color}, ${selectedPalette.color}cc)` }}>
                                                                {isActing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Play className="w-4 h-4" /> Start</>}
                                                            </button>
                                                        ) : quiz.best_attempt_id ? (
                                                            <button
                                                                onClick={() => { setActingQuizId(quiz.id); resultMutation.mutate(quiz.best_attempt_id!) }}
                                                                disabled={isLoadingResult}
                                                                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all"
                                                                style={{ borderColor: selectedPalette.color + '60', color: selectedPalette.color }}>
                                                                {isLoadingResult ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Eye className="w-4 h-4" /> View Result</>}
                                                            </button>
                                                        ) : (
                                                            <span className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-muted-foreground bg-muted border border-border">
                                                                <Clock className="w-4 h-4 text-amber-400" />
                                                                {quiz.is_anytime
                                                                    ? 'Anytime'
                                                                    : quiz.status === 'upcoming'
                                                                    ? new Date(quiz.scheduled_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
                                                                    : 'Ended'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recommendations — reserved for future use; disabled until backend recommendation engine is implemented */}
                        {false && recommendations.length > 0 && (
                            <Card className="border-0 shadow-lg">
                                <CardContent className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Sparkles className="w-5 h-5 text-amber-500" />
                                        <h3 className="font-bold text-slate-700">Recommended Practice</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        {recommendations.map(quiz => {
                                            const palette = getSubjectPalette(quiz.subject_name, subjects)
                                            const chName = quiz.chapter_name?.trim() || quiz.title
                                            const pct = quiz.best_percentage ?? 0
                                            const isActing = startMutation.isPending && actingQuizId === quiz.id
                                            return (
                                                <div key={quiz.id} className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all">
                                                    <h4 className="font-semibold text-sm text-slate-800 mb-1">{chName}</h4>
                                                    <p className="text-[11px] text-slate-400 mb-3">{quiz.subject_name}</p>
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: palette.color }} />
                                                        </div>
                                                        <span className="text-[11px] font-medium text-slate-500">{pct.toFixed(0)}%</span>
                                                    </div>
                                                    <Button size="sm" variant="outline" onClick={() => { setActingQuizId(quiz.id); startMutation.mutate(quiz.id) }}
                                                        disabled={isActing}
                                                        className="w-full text-xs" style={{ borderColor: `${palette.color}40`, color: palette.color }}>
                                                        {isActing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Play className="w-3 h-3 mr-1" /> Start Practice</>}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Completed Sessions — exact mock style */}
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <h3 className="font-bold text-slate-700">Completed Sessions</h3>
                                </div>
                                {completedSessions.length === 0 ? (
                                    <div className="text-center py-8">
                                        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                        <p className="text-slate-500">No completed sessions yet</p>
                                        <p className="text-sm text-slate-400">Start a practice quiz to see your results here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {completedSessions.map(quiz => {
                                            const pct = quiz.best_percentage ?? 0
                                            const isLoadingResult = resultMutation.isPending && actingQuizId === quiz.id
                                            const gradClass = pct >= 70 ? 'from-green-500 to-emerald-600' : pct >= 50 ? 'from-amber-500 to-orange-600' : 'from-red-500 to-rose-600'
                                            const scoreColor = pct >= 70 ? 'text-green-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
                                            return (
                                                <div key={quiz.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md transition-all">
                                                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md bg-gradient-to-br flex-shrink-0', gradClass)}>
                                                        <Award className="w-6 h-6" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-semibold text-sm text-slate-800 truncate">{chapterDisplayName(quiz)}</h4>
                                                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                                                            <span>{quiz.subject_name}</span>
                                                            <span>·</span>
                                                            <span>{quiz.is_anytime ? 'Anytime' : new Date(quiz.scheduled_at).toLocaleDateString('en-IN')}</span>
                                                            <span>·</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{quiz.attempt_count} attempt{quiz.attempt_count !== 1 ? 's' : ''}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-left sm:text-right flex-shrink-0 w-full sm:w-auto">
                                                        <div className="flex items-center gap-2 justify-start sm:justify-end">
                                                            <Progress value={pct} className="w-20 h-2" />
                                                            <span className={cn('font-bold text-sm', scoreColor)}>{pct.toFixed(0)}%</span>
                                                        </div>
                                                        {quiz.best_attempt_id && (
                                                            <button
                                                                onClick={() => { setActingQuizId(quiz.id); resultMutation.mutate(quiz.best_attempt_id!) }}
                                                                disabled={isLoadingResult}
                                                                className="mt-1 text-[11px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
                                                                {isLoadingResult ? 'Loading…' : 'View Result'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
