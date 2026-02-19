"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Play, Clock, CheckCircle, Trophy, Sparkles, Target, BookOpen,
    ChevronRight, ChevronLeft, X, Eye,
    Bookmark, BookmarkCheck, Timer, Award, Zap, Star, TrendingUp,
    FlaskConical, Calculator, Globe, Languages, GraduationCap,
    AlertCircle, Check, XCircle, BarChart3, RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'

// ─── Types ───────────────────────────────────────────────────────────
interface Question {
    id: number
    text: string
    options: string[]
    correct: number // index of correct answer
    subject: string
    chapter: string
    difficulty: 'easy' | 'medium' | 'hard'
}

type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'review' | 'answered-review'

interface QuizSession {
    id: string
    title: string
    subject: string
    chapter: string
    questions: Question[]
    totalTime: number // in seconds
    positiveMarks: number
    negativeMarks: number
}

interface CompletedSession {
    id: string
    title: string
    subject: string
    score: number
    total: number
    percentage: number
    date: string
    timeTaken: string
    correct: number
    incorrect: number
    unanswered: number
}

interface Chapter {
    name: string
    progress: number
    questions: number
}

interface Subject {
    name: string
    icon: React.ElementType
    color: string
    bgColor: string
    chapters: Chapter[]
}

// ─── Mock Data ───────────────────────────────────────────────────────
const subjects: Subject[] = [
    {
        name: 'Mathematics', icon: Calculator, color: '#4f46e5', bgColor: '#eef2ff',
        chapters: [
            { name: 'Real Numbers', progress: 75, questions: 30 },
            { name: 'Polynomials', progress: 60, questions: 25 },
            { name: 'Linear Equations', progress: 45, questions: 35 },
            { name: 'Quadratic Equations', progress: 30, questions: 28 },
            { name: 'Trigonometry', progress: 20, questions: 40 },
            { name: 'Coordinate Geometry', progress: 55, questions: 22 },
        ]
    },
    {
        name: 'Science', icon: FlaskConical, color: '#0d9488', bgColor: '#f0fdfa',
        chapters: [
            { name: 'Chemical Reactions', progress: 80, questions: 35 },
            { name: 'Acids, Bases & Salts', progress: 65, questions: 30 },
            { name: 'Life Processes', progress: 50, questions: 40 },
            { name: 'Control & Coordination', progress: 35, questions: 25 },
            { name: 'Heredity & Evolution', progress: 15, questions: 28 },
            { name: 'Our Environment', progress: 40, questions: 20 },
        ]
    },
    {
        name: 'English', icon: BookOpen, color: '#7c3aed', bgColor: '#faf5ff',
        chapters: [
            { name: 'Comprehension', progress: 70, questions: 20 },
            { name: 'Grammar', progress: 85, questions: 35 },
            { name: 'Writing Skills', progress: 55, questions: 15 },
            { name: 'Literature', progress: 40, questions: 25 },
            { name: 'Vocabulary', progress: 60, questions: 30 },
        ]
    },
    {
        name: 'Social Science', icon: Globe, color: '#0284c7', bgColor: '#f0f9ff',
        chapters: [
            { name: 'Nationalism in India', progress: 50, questions: 25 },
            { name: 'Resources & Development', progress: 65, questions: 20 },
            { name: 'Power Sharing', progress: 30, questions: 22 },
            { name: 'Globalisation', progress: 45, questions: 18 },
        ]
    },
    {
        name: 'Hindi', icon: Languages, color: '#ea580c', bgColor: '#fff7ed',
        chapters: [
            { name: 'Surdas ke Pad', progress: 55, questions: 15 },
            { name: 'Ram Lakshman Parshuram', progress: 40, questions: 20 },
            { name: 'Netaji ka Chasma', progress: 70, questions: 18 },
            { name: 'Balgobin Bhagat', progress: 25, questions: 16 },
        ]
    },
]

function generateQuestions(subject: string, chapter: string, count: number): Question[] {
    const questionBank: Record<string, Record<string, { text: string; options: string[]; correct: number }[]>> = {
        'Mathematics': {
            'Real Numbers': [
                { text: 'What is the HCF of 26 and 91?', options: ['13', '26', '7', '91'], correct: 0 },
                { text: 'Which of the following is an irrational number?', options: ['0.3333...', '√2', '7/22', '0.25'], correct: 1 },
                { text: 'The decimal expansion of √2 is:', options: ['Terminating', 'Non-terminating repeating', 'Non-terminating non-repeating', 'None'], correct: 2 },
                { text: 'LCM of 12 and 18 is:', options: ['36', '72', '6', '216'], correct: 0 },
                { text: 'Every positive even integer is of the form:', options: ['2q', '2q+1', 'q', 'q+1'], correct: 0 },
                { text: 'If HCF(a,b) = 12 and a×b = 1800, then LCM(a,b) is:', options: ['100', '150', '180', '200'], correct: 1 },
                { text: 'The product of a non-zero rational and an irrational number is:', options: ['Always irrational', 'Always rational', 'Rational or irrational', 'One'], correct: 0 },
                { text: '5 × 11 × 13 + 7 is a:', options: ['Prime number', 'Composite number', 'Neither', 'Odd number'], correct: 1 },
                { text: 'The largest number that divides 70 and 125 leaving remainders 5 and 8 is:', options: ['13', '65', '875', '1750'], correct: 0 },
                { text: 'For any positive integer n, 6n - 5n always ends with:', options: ['1', '3', '5', '7'], correct: 0 },
            ],
            'Polynomials': [
                { text: 'The degree of polynomial 3x⁴ + 7x² - 5 is:', options: ['2', '3', '4', '5'], correct: 2 },
                { text: 'The zeroes of x² - 5x + 6 are:', options: ['2, 3', '1, 6', '-2, -3', '3, -2'], correct: 0 },
                { text: 'If α and β are zeroes of x² + 5x + 6, then α + β is:', options: ['5', '-5', '6', '-6'], correct: 1 },
                { text: 'A polynomial of degree 3 is called:', options: ['Linear', 'Quadratic', 'Cubic', 'Biquadratic'], correct: 2 },
                { text: 'The number of zeroes of a quadratic polynomial is:', options: ['0', '1', '2', '3'], correct: 2 },
                { text: 'If p(x) = x² - 3x + 2, then p(1) is:', options: ['0', '1', '2', '-1'], correct: 0 },
                { text: 'Which is NOT a polynomial?', options: ['x² + 1', '√x + 2', '3x³', 'x + 1'], correct: 1 },
                { text: 'Sum of zeroes of 2x² - 8x + 6 is:', options: ['4', '-4', '3', '-3'], correct: 0 },
                { text: 'Product of zeroes of x² - 7x + 12 is:', options: ['7', '12', '-7', '-12'], correct: 1 },
                { text: 'The zero of polynomial p(x) = 3x + 6 is:', options: ['2', '-2', '6', '-6'], correct: 1 },
            ],
            'Linear Equations': [
                { text: 'The pair x + y = 5, 2x + 2y = 10 has:', options: ['Unique solution', 'No solution', 'Infinite solutions', 'Two solutions'], correct: 2 },
                { text: 'The value of k for which kx - y = 2 and 6x - 2y = 3 have no solution:', options: ['3', '-3', '2', '-2'], correct: 0 },
                { text: 'If x = 1, y = 2 is a solution of 2x + 3y = k, then k =', options: ['5', '7', '8', '10'], correct: 2 },
                { text: 'Graphically, the pair x = 2, y = -3 is:', options: ['Parallel lines', 'Intersecting lines', 'Coincident lines', 'None'], correct: 1 },
                { text: 'A pair of linear equations is consistent if:', options: ['Lines are parallel', 'Lines intersect or coincide', 'Lines are perpendicular', 'None'], correct: 1 },
                { text: 'If a₁/a₂ ≠ b₁/b₂, the pair has:', options: ['No solution', 'Unique solution', 'Infinite solutions', 'Two solutions'], correct: 1 },
                { text: 'The number of solutions of 3x + y = 1 and 2x - y = 4 is:', options: ['0', '1', '2', 'Infinite'], correct: 1 },
                { text: 'One equation of a pair is 2x + 3y = 5. If the pair has no solution, the other could be:', options: ['4x + 6y = 10', '4x + 6y = 7', 'x + y = 5', '2x - 3y = 5'], correct: 1 },
                { text: 'The substitution method is best when:', options: ['Both equations are complex', 'One variable has coefficient 1', 'Equations are parallel', 'None'], correct: 1 },
                { text: 'Ages of A and B are in 3:5 ratio. After 4 years, 4:6. Find A\'s age:', options: ['12', '20', '24', '15'], correct: 0 },
            ],
        },
        'Science': {
            'Chemical Reactions': [
                { text: 'Which is an example of a combination reaction?', options: ['Heating limestone', 'Burning magnesium in air', 'Electrolysis of water', 'Rusting of iron'], correct: 1 },
                { text: 'In the equation 2Mg + O₂ → 2MgO, Mg is:', options: ['Oxidized', 'Reduced', 'Neither', 'Both'], correct: 0 },
                { text: 'Rancidity can be prevented by:', options: ['Adding antioxidants', 'Using nitrogen gas', 'Both A and B', 'None'], correct: 2 },
                { text: 'Which is a decomposition reaction?', options: ['2H₂ + O₂ → 2H₂O', '2HgO → 2Hg + O₂', 'NaOH + HCl → NaCl + H₂O', 'Zn + CuSO₄ → ZnSO₄ + Cu'], correct: 1 },
                { text: 'The brown gas evolved on heating lead nitrate is:', options: ['NO', 'N₂O', 'NO₂', 'N₂O₅'], correct: 2 },
                { text: 'Which type of reaction is: Fe + CuSO₄ → FeSO₄ + Cu?', options: ['Combination', 'Decomposition', 'Displacement', 'Double displacement'], correct: 2 },
                { text: 'Balancing a chemical equation is based on:', options: ['Law of mass action', 'Law of conservation of mass', 'Law of constant proportions', 'Avogadro\'s law'], correct: 1 },
                { text: 'What happens when dilute HCl is added to iron filings?', options: ['H₂ gas and FeCl₂ formed', 'Cl₂ gas and FeH₂ formed', 'No reaction', 'FeCl₃ formed'], correct: 0 },
                { text: 'Silver articles turn black due to:', options: ['Corrosion', 'Tarnishing by H₂S', 'Rusting', 'Oxidation by O₂'], correct: 1 },
                { text: 'An exothermic reaction releases:', options: ['Light only', 'Heat', 'Water', 'Gas'], correct: 1 },
            ],
            'Life Processes': [
                { text: 'The main site of photosynthesis is:', options: ['Stem', 'Root', 'Leaf', 'Flower'], correct: 2 },
                { text: 'Which organelle is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi body'], correct: 1 },
                { text: 'The pigment that absorbs sunlight for photosynthesis:', options: ['Melanin', 'Chlorophyll', 'Haemoglobin', 'Carotene'], correct: 1 },
                { text: 'Human heart has how many chambers?', options: ['2', '3', '4', '5'], correct: 2 },
                { text: 'Which blood vessels carry blood away from the heart?', options: ['Veins', 'Arteries', 'Capillaries', 'Venules'], correct: 1 },
                { text: 'The enzyme pepsin works in:', options: ['Mouth', 'Stomach', 'Small intestine', 'Large intestine'], correct: 1 },
                { text: 'Stomata are mainly found on:', options: ['Upper epidermis', 'Lower epidermis', 'Both surfaces equally', 'Roots'], correct: 1 },
                { text: 'The structural and functional unit of the kidney is:', options: ['Neuron', 'Nephron', 'Glomerulus', 'Bowman\'s capsule'], correct: 1 },
                { text: 'Autotrophic nutrition requires:', options: ['CO₂ and water', 'Sunlight', 'Chlorophyll', 'All of the above'], correct: 3 },
                { text: 'Double circulation means blood passes through the heart:', options: ['Once', 'Twice', 'Three times', 'Not at all'], correct: 1 },
            ],
        },
    }

    const subjectQuestions = questionBank[subject]
    if (!subjectQuestions) {
        // Generate generic questions
        return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            text: `Question ${i + 1} from ${chapter} (${subject})`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct: Math.floor(Math.random() * 4),
            subject,
            chapter,
            difficulty: (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)],
        }))
    }

    const chapterQuestions = subjectQuestions[chapter]
    if (!chapterQuestions) {
        // Use first available chapter's questions
        const firstChapter = Object.values(subjectQuestions)[0] || []
        return firstChapter.slice(0, count).map((q, i) => ({
            id: i + 1, ...q, subject, chapter,
            difficulty: (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)],
        }))
    }

    return chapterQuestions.slice(0, count).map((q, i) => ({
        id: i + 1, ...q, subject, chapter,
        difficulty: (['easy', 'medium', 'hard'] as const)[Math.floor(Math.random() * 3)],
    }))
}

const completedSessions: CompletedSession[] = [
    { id: 'cs1', title: 'Real Numbers Practice', subject: 'Mathematics', score: 32, total: 40, percentage: 80, date: '2026-02-15', timeTaken: '18:34', correct: 8, incorrect: 2, unanswered: 0 },
    { id: 'cs2', title: 'Chemical Reactions Quiz', subject: 'Science', score: 28, total: 40, percentage: 70, date: '2026-02-12', timeTaken: '22:10', correct: 7, incorrect: 3, unanswered: 0 },
    { id: 'cs3', title: 'Grammar Test', subject: 'English', score: 36, total: 40, percentage: 90, date: '2026-02-10', timeTaken: '15:45', correct: 9, incorrect: 1, unanswered: 0 },
]

// ─── Component ───────────────────────────────────────────────────────
type ViewMode = 'dashboard' | 'quiz' | 'results'

export default function StudentQuizzesPage() {
    // ─── Dashboard State ─────────────────────────────────────────────
    const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0)
    const [chapterFilter, setChapterFilter] = useState<'default' | 'strongest' | 'weakest'>('default')

    // ─── Quiz State ──────────────────────────────────────────────────
    const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
    const [quizSession, setQuizSession] = useState<QuizSession | null>(null)
    const [currentQ, setCurrentQ] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [statuses, setStatuses] = useState<QuestionStatus[]>([])
    const [timeLeft, setTimeLeft] = useState(0)
    const [isPaused, setIsPaused] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // ─── Results State ───────────────────────────────────────────────
    const [results, setResults] = useState<{
        score: number; total: number; correct: number; incorrect: number; unanswered: number;
        answers: (number | null)[]; questions: Question[]
    } | null>(null)

    const selectedSubject = subjects[selectedSubjectIdx]

    // ─── Timer Effect ────────────────────────────────────────────────
    useEffect(() => {
        if (viewMode !== 'quiz' || isPaused || timeLeft <= 0) return
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!)
                    handleSubmitQuiz()
                    return 0
                }
                return prev - 1
            })
        }, 1000)
        return () => { if (timerRef.current) clearInterval(timerRef.current) }
    }, [viewMode, isPaused, timeLeft])

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0')
        const s = (secs % 60).toString().padStart(2, '0')
        return `${m}:${s}`
    }

    // ─── Quiz Actions ────────────────────────────────────────────────
    const startQuiz = useCallback((chapter: Chapter) => {
        const count = Math.min(chapter.questions, 10)
        const questions = generateQuestions(selectedSubject.name, chapter.name, count)
        const session: QuizSession = {
            id: Date.now().toString(),
            title: `${chapter.name} — ${selectedSubject.name}`,
            subject: selectedSubject.name,
            chapter: chapter.name,
            questions,
            totalTime: count * 90, // 90 seconds per question
            positiveMarks: 4,
            negativeMarks: 1,
        }
        setQuizSession(session)
        setAnswers(new Array(questions.length).fill(null))
        setStatuses(questions.map((_, i) => i === 0 ? 'not-answered' : 'not-visited'))
        setCurrentQ(0)
        setTimeLeft(session.totalTime)
        setIsPaused(false)
        setViewMode('quiz')
        toast.success('Quiz Started!', { description: `${count} questions • ${Math.ceil(session.totalTime / 60)} min` })
    }, [selectedSubject])

    const selectAnswer = (optionIdx: number) => {
        const newAnswers = [...answers]
        newAnswers[currentQ] = optionIdx
        setAnswers(newAnswers)
        const newStatuses = [...statuses]
        newStatuses[currentQ] = statuses[currentQ] === 'answered-review' || statuses[currentQ] === 'review' ? 'answered-review' : 'answered'
        setStatuses(newStatuses)
    }

    const clearAnswer = () => {
        const newAnswers = [...answers]
        newAnswers[currentQ] = null
        setAnswers(newAnswers)
        const newStatuses = [...statuses]
        newStatuses[currentQ] = statuses[currentQ] === 'answered-review' ? 'review' : 'not-answered'
        setStatuses(newStatuses)
    }

    const toggleReview = () => {
        const newStatuses = [...statuses]
        const cur = statuses[currentQ]
        if (cur === 'answered') newStatuses[currentQ] = 'answered-review'
        else if (cur === 'answered-review') newStatuses[currentQ] = 'answered'
        else if (cur === 'review') newStatuses[currentQ] = 'not-answered'
        else newStatuses[currentQ] = 'review'
        setStatuses(newStatuses)
    }

    const goToQuestion = (idx: number) => {
        // Mark current if not visited
        const newStatuses = [...statuses]
        if (newStatuses[idx] === 'not-visited') newStatuses[idx] = 'not-answered'
        setStatuses(newStatuses)
        setCurrentQ(idx)
    }

    const saveAndNext = () => {
        if (currentQ < (quizSession?.questions.length ?? 0) - 1) {
            goToQuestion(currentQ + 1)
        }
    }

    const handleSubmitQuiz = useCallback(() => {
        if (!quizSession) return
        if (timerRef.current) clearInterval(timerRef.current)

        let correct = 0, incorrect = 0, unanswered = 0
        quizSession.questions.forEach((q, i) => {
            if (answers[i] === null) unanswered++
            else if (answers[i] === q.correct) correct++
            else incorrect++
        })

        const score = (correct * quizSession.positiveMarks) - (incorrect * quizSession.negativeMarks)
        const total = quizSession.questions.length * quizSession.positiveMarks

        setResults({
            score: Math.max(0, score), total, correct, incorrect, unanswered,
            answers: [...answers], questions: [...quizSession.questions],
        })
        setViewMode('results')
        toast.success('Quiz Submitted!', { description: `You scored ${Math.max(0, score)}/${total}` })
    }, [quizSession, answers])

    const backToDashboard = () => {
        setViewMode('dashboard')
        setQuizSession(null)
        setResults(null)
    }

    // ─── Sorted Chapters ─────────────────────────────────────────────
    const sortedChapters = [...selectedSubject.chapters].sort((a, b) => {
        if (chapterFilter === 'strongest') return b.progress - a.progress
        if (chapterFilter === 'weakest') return a.progress - b.progress
        return 0
    })

    // ─── Recommendations ─────────────────────────────────────────────
    const recommendations = selectedSubject.chapters
        .filter(c => c.progress < 50)
        .slice(0, 3)

    // Status counts for quiz sidebar
    const statusCounts = {
        'not-visited': statuses.filter(s => s === 'not-visited').length,
        'not-answered': statuses.filter(s => s === 'not-answered').length,
        'answered': statuses.filter(s => s === 'answered' || s === 'answered-review').length,
        'review': statuses.filter(s => s === 'review' || s === 'answered-review').length,
    }

    // ═════════════════════════════════════════════════════════════════
    // QUIZ TAKING VIEW
    // ═════════════════════════════════════════════════════════════════
    if (viewMode === 'quiz' && quizSession) {
        const question = quizSession.questions[currentQ]
        const timePercent = (timeLeft / quizSession.totalTime) * 100
        const isLowTime = timeLeft < 60

        return (
            <div className="min-h-[calc(100vh-120px)] flex flex-col animate-fade-in">
                {/* Quiz Header */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md" style={{ background: `linear-gradient(135deg, ${selectedSubject.color}, ${selectedSubject.color}dd)` }}>
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-slate-800">{quizSession.title}</h2>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <Badge variant="outline" className="text-[11px] border-blue-200 text-blue-600">Objective</Badge>
                                    <Badge variant="outline" className="text-[11px] border-green-200 text-green-600">
                                        <Star className="w-3 h-3 mr-1" />+{quizSession.positiveMarks} | -{quizSession.negativeMarks}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-lg font-bold ${isLowTime ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-50 text-slate-700'}`}>
                                <Timer className="w-5 h-5" />
                                {formatTime(timeLeft)}
                            </div>
                            <Button variant="outline" size="sm" onClick={() => {
                                if (confirm('Are you sure you want to end this test? Your current answers will be submitted.')) handleSubmitQuiz()
                            }} className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                                End Test
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
                                {/* Question */}
                                <div className="flex items-start gap-4 mb-10">
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md flex-shrink-0" style={{ background: `linear-gradient(135deg, ${selectedSubject.color}, ${selectedSubject.color}cc)` }}>
                                        {currentQ + 1}
                                    </div>
                                    <p className="text-lg text-slate-800 leading-relaxed pt-1.5">{question.text}</p>
                                </div>

                                {/* Options */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {question.options.map((opt, idx) => {
                                        const isSelected = answers[currentQ] === idx
                                        const letter = String.fromCharCode(65 + idx)
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => selectAnswer(idx)}
                                                className={`
                                                    flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200
                                                    ${isSelected
                                                        ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100'
                                                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'
                                                    }
                                                `}
                                            >
                                                <div className={`
                                                    w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-all
                                                    ${isSelected
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-600'
                                                    }
                                                `}>
                                                    {letter}
                                                </div>
                                                <span className={`text-[15px] ${isSelected ? 'text-indigo-900 font-medium' : 'text-slate-700'}`}>
                                                    {opt}
                                                </span>
                                            </button>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bottom Actions */}
                        <div className="flex items-center justify-between mt-4 bg-white rounded-xl border border-slate-200 shadow-sm p-3">
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" disabled={currentQ === 0} onClick={() => goToQuestion(currentQ - 1)}
                                    className="border-orange-200 text-orange-600 hover:bg-orange-50">
                                    <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                                </Button>
                                <Button variant="outline" size="sm" onClick={toggleReview}
                                    className={`${statuses[currentQ]?.includes('review') ? 'bg-purple-50 border-purple-300 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                    {statuses[currentQ]?.includes('review') ? <BookmarkCheck className="w-4 h-4 mr-1" /> : <Bookmark className="w-4 h-4 mr-1" />}
                                    Review Later
                                </Button>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={clearAnswer} className="text-slate-500 hover:text-red-600">
                                    <XCircle className="w-4 h-4 mr-1" /> Clear
                                </Button>
                                <div className="flex items-center gap-1 border border-slate-200 rounded-lg px-1 py-0.5">
                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                        <button key={letter} onClick={() => selectAnswer(idx)}
                                            className={`w-8 h-8 rounded-md text-sm font-semibold transition-all ${answers[currentQ] === idx ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                            {letter}
                                        </button>
                                    ))}
                                </div>
                                <Button size="sm" onClick={saveAndNext}
                                    className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
                                    disabled={currentQ >= quizSession.questions.length - 1}>
                                    Save & Next <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                                {currentQ < quizSession.questions.length - 1 && (
                                    <Button variant="outline" size="sm" onClick={() => goToQuestion(currentQ + 1)}
                                        className="border-amber-200 text-amber-600 hover:bg-amber-50">
                                        Skip
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar — Question Navigation */}
                    <div className="w-[240px] flex-shrink-0">
                        <Card className="border-0 shadow-lg sticky top-4">
                            <CardContent className="p-4">
                                {/* Legend */}
                                <div className="space-y-2 mb-5">
                                    {[
                                        { color: 'bg-slate-300', label: 'Not Visited', count: statusCounts['not-visited'] },
                                        { color: 'bg-red-500', label: 'Not Answered', count: statusCounts['not-answered'] },
                                        { color: 'bg-emerald-500', label: 'Answered', count: statusCounts['answered'] },
                                        { color: 'bg-purple-500', label: 'Review Later', count: statusCounts['review'] },
                                    ].map(item => (
                                        <div key={item.label} className="flex items-center gap-2.5">
                                            <div className={`w-5 h-5 rounded-md ${item.color} text-white text-[10px] font-bold flex items-center justify-center shadow-sm`}>
                                                {item.count}
                                            </div>
                                            <span className="text-xs text-slate-600">{item.label}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="h-px bg-slate-100 mb-4" />

                                {/* Question Grid */}
                                <div className="grid grid-cols-5 gap-2">
                                    {quizSession.questions.map((_, idx) => {
                                        const status = statuses[idx]
                                        const isCurrent = idx === currentQ
                                        let bgClass = 'bg-slate-200 text-slate-500'
                                        if (status === 'not-answered') bgClass = 'bg-red-500 text-white'
                                        if (status === 'answered') bgClass = 'bg-emerald-500 text-white'
                                        if (status === 'review') bgClass = 'bg-purple-500 text-white'
                                        if (status === 'answered-review') bgClass = 'bg-purple-500 text-white ring-2 ring-emerald-400'

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => goToQuestion(idx)}
                                                className={`
                                                    w-9 h-9 rounded-lg text-xs font-bold transition-all
                                                    ${bgClass}
                                                    ${isCurrent ? 'ring-2 ring-indigo-600 ring-offset-2 scale-110' : 'hover:scale-105'}
                                                `}
                                            >
                                                {idx + 1}
                                            </button>
                                        )
                                    })}
                                </div>

                                <Button onClick={() => {
                                    if (confirm('Submit your quiz? This action cannot be undone.')) handleSubmitQuiz()
                                }} className="w-full mt-5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md">
                                    Submit Test
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        )
    }

    // ═════════════════════════════════════════════════════════════════
    // RESULTS VIEW
    // ═════════════════════════════════════════════════════════════════
    if (viewMode === 'results' && results) {
        const percentage = Math.round((results.score / results.total) * 100)
        const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C' : 'D'

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-slate-800">Quiz Results</h1>
                        <p className="text-slate-500 mt-1">{quizSession?.title}</p>
                    </div>
                    <Button onClick={backToDashboard} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                        <RefreshCw className="w-4 h-4 mr-2" /> Take Another Quiz
                    </Button>
                </div>

                {/* Score Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50 col-span-2 md:col-span-1">
                        <CardContent className="p-5 text-center">
                            <div className="relative w-24 h-24 mx-auto mb-3">
                                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                                    <circle cx="50" cy="50" r="42" stroke={percentage >= 70 ? '#22c55e' : percentage >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="8" fill="none"
                                        strokeDasharray={`${percentage * 2.64} ${264 - percentage * 2.64}`} strokeLinecap="round" />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-slate-800">{percentage}%</span>
                                    <span className="text-xs text-slate-500">Score</span>
                                </div>
                            </div>
                            <Badge className="text-lg px-3 py-1" style={{ background: percentage >= 70 ? '#dcfce7' : percentage >= 50 ? '#fef3c7' : '#fee2e2', color: percentage >= 70 ? '#16a34a' : percentage >= 50 ? '#d97706' : '#dc2626' }}>
                                Grade {grade}
                            </Badge>
                        </CardContent>
                    </Card>

                    {[
                        { label: 'Total Score', value: `${results.score}/${results.total}`, icon: Trophy, color: '#4f46e5', bg: 'from-indigo-50 to-violet-50' },
                        { label: 'Correct', value: results.correct, icon: CheckCircle, color: '#16a34a', bg: 'from-green-50 to-emerald-50' },
                        { label: 'Incorrect', value: results.incorrect, icon: XCircle, color: '#dc2626', bg: 'from-red-50 to-rose-50' },
                        { label: 'Unanswered', value: results.unanswered, icon: AlertCircle, color: '#d97706', bg: 'from-amber-50 to-yellow-50' },
                    ].map(item => (
                        <Card key={item.label} className={`border-0 shadow-lg bg-gradient-to-br ${item.bg}`}>
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
                            {results.questions.map((q, idx) => {
                                const userAnswer = results.answers[idx]
                                const isCorrect = userAnswer === q.correct
                                const isUnanswered = userAnswer === null
                                return (
                                    <div key={idx} className={`rounded-xl border-2 p-5 transition-all ${isCorrect ? 'border-green-200 bg-green-50/50' : isUnanswered ? 'border-amber-200 bg-amber-50/30' : 'border-red-200 bg-red-50/30'}`}>
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${isCorrect ? 'bg-green-500' : isUnanswered ? 'bg-amber-500' : 'bg-red-500'}`}>
                                                {isCorrect ? <Check className="w-4 h-4" /> : isUnanswered ? <AlertCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <p className="font-medium text-slate-800 mb-1">Q{idx + 1}. {q.text}</p>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {q.options.map((opt, optIdx) => (
                                                        <span key={optIdx} className={`
                                                            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                                                            ${optIdx === q.correct ? 'bg-green-100 text-green-700 ring-1 ring-green-300' : ''}
                                                            ${optIdx === userAnswer && !isCorrect ? 'bg-red-100 text-red-700 ring-1 ring-red-300 line-through' : ''}
                                                            ${optIdx !== q.correct && optIdx !== userAnswer ? 'bg-slate-100 text-slate-500' : ''}
                                                        `}>
                                                            <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span> {opt}
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

    // ═════════════════════════════════════════════════════════════════
    // DASHBOARD VIEW
    // ═════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                        Practice & Quizzes
                    </h1>
                    <p className="text-slate-500 mt-1">Master each subject with focused practice</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Quizzes Taken', value: completedSessions.length, icon: Target, color: '#4f46e5', bg: 'from-indigo-50 to-violet-50' },
                    { label: 'Avg Score', value: `${Math.round(completedSessions.reduce((s, c) => s + c.percentage, 0) / completedSessions.length)}%`, icon: BarChart3, color: '#0d9488', bg: 'from-teal-50 to-emerald-50' },
                    { label: 'Best Score', value: `${Math.max(...completedSessions.map(c => c.percentage))}%`, icon: Trophy, color: '#d97706', bg: 'from-amber-50 to-yellow-50' },
                    { label: 'Performance', value: 'Top 10%', icon: TrendingUp, color: '#7c3aed', bg: 'from-purple-50 to-violet-50', hasSparkle: true },
                ].map(item => (
                    <Card key={item.label} className={`border-0 shadow-lg bg-gradient-to-br ${item.bg} overflow-hidden`}>
                        <CardContent className="p-5 relative">
                            <div className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-8 translate-x-8" style={{ background: `${item.color}10` }} />
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${item.color}, ${item.color}cc)` }}>
                                    <item.icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1">
                                        <p className="text-2xl font-bold" style={{ color: item.color }}>{item.value}</p>
                                        {'hasSparkle' in item && <Sparkles className="w-4 h-4 text-amber-500" />}
                                    </div>
                                    <p className="text-sm text-slate-500">{item.label}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {/* Left — Subject & Chapters */}
                <div className="space-y-4">
                    {/* Subject Selector */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Select Subject</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {subjects.map((subj, idx) => {
                                    const Icon = subj.icon
                                    const isActive = idx === selectedSubjectIdx
                                    return (
                                        <button key={subj.name} onClick={() => setSelectedSubjectIdx(idx)}
                                            className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 ${isActive ? 'shadow-md ring-2' : 'hover:bg-slate-50'}`}
                                            style={isActive ? { backgroundColor: subj.bgColor, borderColor: subj.color, '--tw-ring-color': subj.color } as React.CSSProperties : {}}>
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm" style={{ backgroundColor: isActive ? subj.color : '#f1f5f9', color: isActive ? 'white' : subj.color }}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`font-semibold text-sm ${isActive ? '' : 'text-slate-700'}`} style={isActive ? { color: subj.color } : {}}>{subj.name}</p>
                                                <p className="text-[11px] text-slate-400">{subj.chapters.length} chapters</p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} style={{ color: isActive ? subj.color : '#94a3b8' }} />
                                        </button>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Chapters */}
                    <Card className="border-0 shadow-lg">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-bold text-slate-700">All Chapters</h3>
                            </div>
                            <div className="flex items-center gap-2 mb-4 mt-2">
                                {(['default', 'strongest', 'weakest'] as const).map(f => (
                                    <button key={f} onClick={() => setChapterFilter(f)}
                                        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all capitalize ${chapterFilter === f
                                            ? 'text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                        style={chapterFilter === f ? { backgroundColor: selectedSubject.color } : {}}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                            <div className="space-y-2">
                                {sortedChapters.map(ch => (
                                    <button key={ch.name} onClick={() => startQuiz(ch)}
                                        className="flex items-center gap-3 w-full p-3 rounded-xl text-left hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-200">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-700 truncate">{ch.name}</p>
                                            <p className="text-[11px] text-slate-400">{ch.questions} questions</p>
                                        </div>
                                        <div className="w-16">
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all" style={{ width: `${ch.progress}%`, backgroundColor: selectedSubject.color }} />
                                            </div>
                                        </div>
                                        <Play className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right — Recommendations & Sessions */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <Card className="border-0 shadow-lg">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-2 mb-4">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    <h3 className="font-bold text-slate-700">Recommended Practice</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {recommendations.map(ch => (
                                        <div key={ch.name} className="p-4 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50 hover:shadow-md transition-all">
                                            <h4 className="font-semibold text-sm text-slate-800 mb-1">{ch.name}</h4>
                                            <p className="text-[11px] text-slate-400 mb-3">{selectedSubject.name}</p>
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full rounded-full" style={{ width: `${ch.progress}%`, backgroundColor: selectedSubject.color }} />
                                                </div>
                                                <span className="text-[11px] font-medium text-slate-500">{ch.progress}%</span>
                                            </div>
                                            <Button size="sm" variant="outline" onClick={() => startQuiz(ch)}
                                                className="w-full text-xs" style={{ borderColor: `${selectedSubject.color}40`, color: selectedSubject.color }}>
                                                <Play className="w-3 h-3 mr-1" /> Start Practice
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Completed Sessions */}
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
                                    {completedSessions.map(session => (
                                        <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md transition-all">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-md ${session.percentage >= 70 ? 'bg-gradient-to-br from-green-500 to-emerald-600' : session.percentage >= 50 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-sm text-slate-800">{session.title}</h4>
                                                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                                                    <span>{session.subject}</span>
                                                    <span>•</span>
                                                    <span>{session.date}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{session.timeTaken}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <Progress value={session.percentage} className="w-20 h-2" />
                                                    <span className={`font-bold text-sm ${session.percentage >= 70 ? 'text-green-600' : session.percentage >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                                                        {session.percentage}%
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                    {session.correct}✓ {session.incorrect}✗ {session.unanswered} skipped
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
