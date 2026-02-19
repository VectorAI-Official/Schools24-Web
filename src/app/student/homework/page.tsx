"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
    Search, BookOpen, CheckCircle2, Clock, AlertTriangle, CalendarDays,
    Flame, Star, FileText, StickyNote, ChevronDown, ChevronUp,
    Sparkles, TrendingUp, Filter, BookOpenCheck, CircleDot,
    CheckCheck, XCircle, Pencil, Save, X, BarChart3
} from 'lucide-react'
import { toast } from 'sonner'

// ── Types ──────────────────────────────────────────────────────────
interface HomeworkItem {
    id: string
    title: string
    subject: string
    description: string
    dueDate: string
    assignedBy: string
    assignedDate: string
    maxMarks: number
    status: 'pending' | 'completed' | 'overdue'
    priority: 'low' | 'medium' | 'high'
    attachments: number
    notes: string
}

// ── Mock Data ──────────────────────────────────────────────────────
const initialHomework: HomeworkItem[] = [
    {
        id: 'hw1', title: 'Quadratic Equations Practice Set', subject: 'Mathematics',
        description: 'Solve all problems from Chapter 4 Exercise 4.3 and 4.4. Show full working for each solution.',
        dueDate: '2026-02-20', assignedBy: 'Rajesh Kumar', assignedDate: '2026-02-15',
        maxMarks: 50, status: 'pending', priority: 'high', attachments: 2, notes: '',
    },
    {
        id: 'hw2', title: 'Newton\'s Laws Lab Report', subject: 'Physics',
        description: 'Write a detailed lab report on the Newton\'s Laws of Motion experiment conducted in class.',
        dueDate: '2026-02-22', assignedBy: 'Ankit Gupta', assignedDate: '2026-02-14',
        maxMarks: 30, status: 'pending', priority: 'medium', attachments: 1, notes: '',
    },
    {
        id: 'hw3', title: 'Periodic Table Worksheet', subject: 'Chemistry',
        description: 'Complete the periodic table trends worksheet. Identify trends in ionization energy, electronegativity, and atomic radius.',
        dueDate: '2026-02-19', assignedBy: 'Priya Sharma', assignedDate: '2026-02-12',
        maxMarks: 40, status: 'pending', priority: 'high', attachments: 0, notes: '',
    },
    {
        id: 'hw4', title: 'Essay: Freedom Struggle', subject: 'History',
        description: 'Write a 1000-word essay on the Indian Freedom Struggle. Focus on the period between 1920-1947.',
        dueDate: '2026-02-25', assignedBy: 'Vikram Singh', assignedDate: '2026-02-16',
        maxMarks: 50, status: 'pending', priority: 'low', attachments: 0, notes: '',
    },
    {
        id: 'hw5', title: 'Comprehension Passage Analysis', subject: 'English',
        description: 'Read the passage from Unit 5 and answer all comprehension questions. Include references from the text.',
        dueDate: '2026-02-18', assignedBy: 'Sunita Devi', assignedDate: '2026-02-10',
        maxMarks: 25, status: 'overdue', priority: 'high', attachments: 1, notes: '',
    },
    {
        id: 'hw6', title: 'Linear Algebra Worksheet', subject: 'Mathematics',
        description: 'Solve the given set of linear equations using matrix methods. Submit neatly formatted solutions.',
        dueDate: '2026-02-16', assignedBy: 'Rajesh Kumar', assignedDate: '2026-02-10',
        maxMarks: 40, status: 'completed', priority: 'medium', attachments: 1, notes: 'Completed all problems, double checked solutions.',
    },
    {
        id: 'hw7', title: 'Electricity & Magnetism Numericals', subject: 'Physics',
        description: 'Solve numerical problems 1-15 from Chapter 7. Use proper formulae and unit conversions.',
        dueDate: '2026-02-14', assignedBy: 'Ankit Gupta', assignedDate: '2026-02-08',
        maxMarks: 30, status: 'completed', priority: 'low', attachments: 0, notes: 'Found questions 12-14 tricky, need to revise.',
    },
    {
        id: 'hw8', title: 'Chemical Bonding Diagram', subject: 'Chemistry',
        description: 'Draw Lewis dot structures and molecular orbital diagrams for the given list of molecules.',
        dueDate: '2026-02-13', assignedBy: 'Priya Sharma', assignedDate: '2026-02-07',
        maxMarks: 35, status: 'completed', priority: 'medium', attachments: 0, notes: '',
    },
    {
        id: 'hw9', title: 'Hindi Poetry Analysis', subject: 'Hindi',
        description: 'Analyse the poem "Madhushala" and write a critical appreciation covering themes, imagery, and literary devices.',
        dueDate: '2026-02-21', assignedBy: 'Sunita Devi', assignedDate: '2026-02-15',
        maxMarks: 30, status: 'pending', priority: 'medium', attachments: 0, notes: '',
    },
    {
        id: 'hw10', title: 'Trigonometry Problem Set', subject: 'Mathematics',
        description: 'Complete exercises 8.1, 8.2, and 8.3 from the NCERT textbook. All steps must be shown.',
        dueDate: '2026-02-24', assignedBy: 'Rajesh Kumar', assignedDate: '2026-02-17',
        maxMarks: 45, status: 'pending', priority: 'low', attachments: 1, notes: '',
    },
]

// ── Helpers ─────────────────────────────────────────────────────────
const today = new Date('2026-02-18')

function daysUntilDue(dueDate: string) {
    const due = new Date(dueDate)
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
}

function getDueLabel(dueDate: string, status: string) {
    if (status === 'completed') return 'Completed'
    const days = daysUntilDue(dueDate)
    if (days < 0) return `Overdue by ${Math.abs(days)}d`
    if (days === 0) return 'Due today!'
    if (days === 1) return 'Due tomorrow'
    return `${days} days left`
}

function getDueColor(dueDate: string, status: string): string {
    if (status === 'completed') return 'text-green-600 dark:text-green-400'
    const days = daysUntilDue(dueDate)
    if (days < 0) return 'text-red-600 dark:text-red-400'
    if (days <= 1) return 'text-orange-600 dark:text-orange-400'
    if (days <= 3) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-blue-600 dark:text-blue-400'
}

const subjectColors: Record<string, { gradient: string; bg: string; text: string; border: string; icon: string }> = {
    Mathematics: { gradient: 'from-blue-500 to-indigo-600', bg: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30', text: 'text-blue-700 dark:text-blue-300', border: 'hover:border-blue-300', icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' },
    Physics: { gradient: 'from-cyan-500 to-teal-600', bg: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30', text: 'text-cyan-700 dark:text-cyan-300', border: 'hover:border-cyan-300', icon: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300' },
    Chemistry: { gradient: 'from-purple-500 to-fuchsia-600', bg: 'from-purple-50 to-fuchsia-50 dark:from-purple-950/30 dark:to-fuchsia-950/30', text: 'text-purple-700 dark:text-purple-300', border: 'hover:border-purple-300', icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300' },
    English: { gradient: 'from-emerald-500 to-green-600', bg: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'hover:border-emerald-300', icon: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300' },
    History: { gradient: 'from-amber-500 to-orange-600', bg: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30', text: 'text-amber-700 dark:text-amber-300', border: 'hover:border-amber-300', icon: 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300' },
    Hindi: { gradient: 'from-rose-500 to-pink-600', bg: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30', text: 'text-rose-700 dark:text-rose-300', border: 'hover:border-rose-300', icon: 'bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300' },
}

const defaultSubjectColor = { gradient: 'from-gray-500 to-slate-600', bg: 'from-gray-50 to-slate-50 dark:from-gray-950/30 dark:to-slate-950/30', text: 'text-gray-700 dark:text-gray-300', border: 'hover:border-gray-300', icon: 'bg-gray-100 text-gray-600 dark:bg-gray-900 dark:text-gray-300' }

// ── Component ───────────────────────────────────────────────────────
export default function StudentHomeworkPage() {
    const [homework, setHomework] = useState<HomeworkItem[]>(initialHomework)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedSubject, setSelectedSubject] = useState('all')
    const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all')
    const [expandedCard, setExpandedCard] = useState<string | null>(null)
    const [editingNotes, setEditingNotes] = useState<string | null>(null)
    const [notesDraft, setNotesDraft] = useState('')

    // ── Derived data ────────────────────────────────────────────────
    const subjects = useMemo(() => {
        const s = Array.from(new Set(homework.map(h => h.subject)))
        return ['All', ...s.sort()]
    }, [homework])

    const filtered = useMemo(() => {
        return homework.filter(h => {
            const matchSearch = h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
                h.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchSubject = selectedSubject === 'all' || h.subject === selectedSubject
            const matchStatus = selectedStatus === 'all' || h.status === selectedStatus
            return matchSearch && matchSubject && matchStatus
        }).sort((a, b) => {
            // Pending first, then overdue, then completed; within groups sort by due date
            const order = { overdue: 0, pending: 1, completed: 2 }
            const oa = order[a.status] ?? 1
            const ob = order[b.status] ?? 1
            if (oa !== ob) return oa - ob
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        })
    }, [homework, searchQuery, selectedSubject, selectedStatus])

    // Stats
    const totalCount = homework.length
    const completedCount = homework.filter(h => h.status === 'completed').length
    const pendingCount = homework.filter(h => h.status === 'pending').length
    const overdueCount = homework.filter(h => h.status === 'overdue').length
    const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

    // Subject progress
    const subjectProgress = useMemo(() => {
        const map: Record<string, { total: number; completed: number }> = {}
        homework.forEach(h => {
            if (!map[h.subject]) map[h.subject] = { total: 0, completed: 0 }
            map[h.subject].total++
            if (h.status === 'completed') map[h.subject].completed++
        })
        return Object.entries(map).map(([subject, data]) => ({
            subject,
            ...data,
            percent: Math.round((data.completed / data.total) * 100),
        })).sort((a, b) => b.percent - a.percent)
    }, [homework])

    // Streak
    const streakDays = 5 // mock streak

    // ── Actions ─────────────────────────────────────────────────────
    const toggleStatus = (id: string) => {
        setHomework(prev => prev.map(h => {
            if (h.id !== id) return h
            const newStatus = h.status === 'completed' ? 'pending' : 'completed'
            toast.success(
                newStatus === 'completed' ? 'Homework marked as done!' : 'Homework marked as pending',
                { description: h.title }
            )
            return { ...h, status: newStatus }
        }))
    }

    const saveNotes = (id: string) => {
        setHomework(prev => prev.map(h => h.id === id ? { ...h, notes: notesDraft } : h))
        setEditingNotes(null)
        toast.success('Notes saved!', { description: 'Your notes have been updated.' })
    }

    const startEditNotes = (id: string, current: string) => {
        setEditingNotes(id)
        setNotesDraft(current)
    }

    // ── Render ──────────────────────────────────────────────────────
    return (
        <div className="space-y-6 animate-fade-in">
            {/* ── Header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 bg-clip-text text-transparent">
                        My Homework
                    </h1>
                    <p className="text-muted-foreground">Track, submit, and manage all your homework assignments</p>
                </div>
            </div>

            {/* ── Stats Overview ──────────────────────────────────── */}
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 overflow-hidden">
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30">
                                <BookOpen className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-blue-700 dark:text-blue-400">{totalCount}</p>
                                <p className="text-sm text-muted-foreground">Total</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 overflow-hidden">
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30">
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-green-700 dark:text-green-400">{completedCount}</p>
                                <p className="text-sm text-muted-foreground">Done</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50 overflow-hidden">
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 text-white shadow-lg shadow-yellow-500/30">
                                <Clock className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-yellow-700 dark:text-yellow-400">{pendingCount}</p>
                                <p className="text-sm text-muted-foreground">Pending</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50 overflow-hidden">
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30">
                                <AlertTriangle className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-red-700 dark:text-red-400">{overdueCount}</p>
                                <p className="text-sm text-muted-foreground">Overdue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 overflow-hidden">
                    <CardContent className="p-4 md:p-6 relative">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/10 rounded-full -translate-y-10 translate-x-10" />
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/30">
                                <TrendingUp className="h-7 w-7" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-violet-700 dark:text-violet-400">{completionRate}%</p>
                                <p className="text-sm text-muted-foreground">Completion</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Subject Progress Section ────────────────────────── */}
            <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        <CardTitle className="text-white">Subject-wise Progress</CardTitle>
                    </div>
                    <CardDescription className="text-orange-100">Track your completion rate for each subject</CardDescription>
                </CardHeader>
                <CardContent className="p-4 md:p-6">
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {subjectProgress.map((sp) => {
                            const colors = subjectColors[sp.subject] || defaultSubjectColor
                            return (
                                <div key={sp.subject} className={`p-4 rounded-2xl bg-gradient-to-br ${colors.bg} border-2 border-transparent ${colors.border} transition-all duration-300`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colors.icon}`}>
                                                <BookOpenCheck className="h-4 w-4" />
                                            </div>
                                            <span className="font-semibold">{sp.subject}</span>
                                        </div>
                                        <span className={`text-sm font-bold ${colors.text}`}>{sp.completed}/{sp.total}</span>
                                    </div>
                                    <Progress value={sp.percent} className="h-3" />
                                    <p className="text-xs text-muted-foreground mt-2">{sp.percent}% completed</p>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* ── Search & Filters ────────────────────────────────── */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search homework..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-2 focus:border-orange-500"
                            />
                        </div>

                        {/* Subject Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {subjects.map((subject) => {
                                const isActive = selectedSubject === subject.toLowerCase() || (subject === 'All' && selectedSubject === 'all')
                                return (
                                    <Button
                                        key={subject}
                                        variant={isActive ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedSubject(subject === 'All' ? 'all' : subject)}
                                        className={`rounded-full px-4 ${isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0' : ''}`}
                                    >
                                        {subject}
                                    </Button>
                                )
                            })}
                        </div>

                        {/* Status Pills */}
                        <div className="flex gap-2 flex-wrap">
                            {(['all', 'pending', 'completed', 'overdue'] as const).map(st => {
                                const isActive = selectedStatus === st
                                const label = st.charAt(0).toUpperCase() + st.slice(1)
                                const icons: Record<string, React.ReactNode> = {
                                    all: <Filter className="h-3.5 w-3.5 mr-1" />,
                                    pending: <Clock className="h-3.5 w-3.5 mr-1" />,
                                    completed: <CheckCheck className="h-3.5 w-3.5 mr-1" />,
                                    overdue: <XCircle className="h-3.5 w-3.5 mr-1" />,
                                }
                                return (
                                    <Button
                                        key={st}
                                        variant={isActive ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setSelectedStatus(st)}
                                        className={`rounded-full px-3 text-xs ${isActive ? 'bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 border-0' : ''}`}
                                    >
                                        {icons[st]}{label}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* ── Homework List ───────────────────────────────────── */}
            <div className="space-y-4">
                {filtered.length === 0 && (
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-12 text-center">
                            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-xl font-bold mb-2">No homework found</h3>
                            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                            <Button variant="outline" onClick={() => { setSearchQuery(''); setSelectedSubject('all'); setSelectedStatus('all') }}>
                                Clear Filters
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {filtered.map((hw, index) => {
                    const colors = subjectColors[hw.subject] || defaultSubjectColor
                    const isExpanded = expandedCard === hw.id
                    const isEditingNote = editingNotes === hw.id

                    return (
                        <Card
                            key={hw.id}
                            className={`border-2 border-transparent transition-all duration-300 hover:shadow-xl ${colors.border} bg-gradient-to-br ${colors.bg} ${hw.status === 'completed' ? 'opacity-80' : ''} stagger-${(index % 5) + 1} animate-slide-up`}
                        >
                            <CardContent className="p-4 md:p-6">
                                {/* Main Row */}
                                <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
                                    {/* Done Toggle */}
                                    <button
                                        onClick={() => toggleStatus(hw.id)}
                                        className={`flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${hw.status === 'completed'
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-110'
                                            : hw.status === 'overdue'
                                                ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-500 dark:from-red-900/50 dark:to-rose-900/50 dark:text-red-400 hover:from-green-500 hover:to-emerald-600 hover:text-white hover:shadow-lg hover:shadow-green-500/30'
                                                : 'bg-gradient-to-br from-gray-100 to-slate-100 text-gray-400 dark:from-gray-800 dark:to-slate-800 dark:text-gray-500 hover:from-green-500 hover:to-emerald-600 hover:text-white hover:shadow-lg hover:shadow-green-500/30'
                                            }`}
                                        title={hw.status === 'completed' ? 'Mark as not done' : 'Mark as done'}
                                    >
                                        {hw.status === 'completed' ? <CheckCheck className="h-6 w-6" /> : <CircleDot className="h-6 w-6" />}
                                    </button>

                                    {/* Subject Icon */}
                                    <div className={`flex-shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${colors.gradient} text-white shadow-lg`}>
                                        <BookOpen className="h-6 w-6" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <h3 className={`font-bold text-lg ${hw.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                                                {hw.title}
                                            </h3>
                                            <Badge className={`${colors.icon} border-0`}>
                                                {hw.subject}
                                            </Badge>
                                            {hw.status === 'overdue' && (
                                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 border-0 animate-pulse">
                                                    Overdue
                                                </Badge>
                                            )}
                                            {hw.status === 'completed' && (
                                                <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 border-0">
                                                    ✓ Done
                                                </Badge>
                                            )}
                                            {hw.priority === 'high' && hw.status !== 'completed' && (
                                                <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-0">
                                                    <Star className="h-3 w-3 mr-1 fill-orange-500 text-orange-500" /> High Priority
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <CalendarDays className="h-4 w-4" />
                                                Due: {new Date(hw.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <span className={`font-semibold ${getDueColor(hw.dueDate, hw.status)}`}>
                                                {getDueLabel(hw.dueDate, hw.status)}
                                            </span>
                                            <span>Assigned by: {hw.assignedBy}</span>
                                            {hw.attachments > 0 && (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-4 w-4" />
                                                    {hw.attachments} attachment{hw.attachments > 1 ? 's' : ''}
                                                </span>
                                            )}
                                            <span>Max Marks: {hw.maxMarks}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            variant={hw.status === 'completed' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => toggleStatus(hw.id)}
                                            className={`rounded-xl ${hw.status === 'completed'
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-0 text-white'
                                                : 'hover:bg-green-100 hover:text-green-700 hover:border-green-300'
                                                }`}
                                        >
                                            {hw.status === 'completed' ? (
                                                <><CheckCircle2 className="mr-1.5 h-4 w-4" />Done</>
                                            ) : (
                                                <><CircleDot className="mr-1.5 h-4 w-4" />Mark Done</>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setExpandedCard(isExpanded ? null : hw.id)}
                                            className="rounded-xl"
                                        >
                                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        </Button>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="mt-6 pt-6 border-t space-y-4 animate-fade-in">
                                        {/* Description */}
                                        <div className="p-4 rounded-xl bg-background/60 backdrop-blur-sm">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-muted-foreground" /> Description
                                            </h4>
                                            <p className="text-sm text-muted-foreground leading-relaxed">{hw.description}</p>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                            <div className="p-3 rounded-xl bg-background/60">
                                                <p className="text-xs text-muted-foreground">Subject</p>
                                                <p className="font-semibold text-sm">{hw.subject}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-background/60">
                                                <p className="text-xs text-muted-foreground">Assigned On</p>
                                                <p className="font-semibold text-sm">{new Date(hw.assignedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-background/60">
                                                <p className="text-xs text-muted-foreground">Max Marks</p>
                                                <p className="font-semibold text-sm">{hw.maxMarks}</p>
                                            </div>
                                            <div className="p-3 rounded-xl bg-background/60">
                                                <p className="text-xs text-muted-foreground">Priority</p>
                                                <p className={`font-semibold text-sm capitalize ${hw.priority === 'high' ? 'text-red-600' : hw.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>{hw.priority}</p>
                                            </div>
                                        </div>

                                        {/* Notes Section */}
                                        <div className="p-4 rounded-xl bg-background/60">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-semibold flex items-center gap-2">
                                                    <StickyNote className="h-4 w-4 text-yellow-500" /> My Notes
                                                </h4>
                                                {!isEditingNote && (
                                                    <Button variant="ghost" size="sm" onClick={() => startEditNotes(hw.id, hw.notes)} className="text-xs">
                                                        <Pencil className="h-3.5 w-3.5 mr-1" />
                                                        {hw.notes ? 'Edit' : 'Add Notes'}
                                                    </Button>
                                                )}
                                            </div>
                                            {isEditingNote ? (
                                                <div className="space-y-2">
                                                    <Textarea
                                                        value={notesDraft}
                                                        onChange={(e) => setNotesDraft(e.target.value)}
                                                        placeholder="Add your notes, reminders, or questions here..."
                                                        rows={3}
                                                        className="resize-none"
                                                    />
                                                    <div className="flex gap-2 justify-end">
                                                        <Button variant="ghost" size="sm" onClick={() => setEditingNotes(null)}>
                                                            <X className="h-4 w-4 mr-1" /> Cancel
                                                        </Button>
                                                        <Button size="sm" onClick={() => saveNotes(hw.id)} className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-0">
                                                            <Save className="h-4 w-4 mr-1" /> Save
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">
                                                    {hw.notes || 'No notes yet. Click "Add Notes" to write something.'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
