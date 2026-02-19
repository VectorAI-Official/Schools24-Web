"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Send, X, Minimize2, Maximize2, Sparkles, RotateCcw } from 'lucide-react'

// ─── Bot Avatar — Modern AI Character ────────────────────────────────
function BotAvatar({ size = 40, className = '' }: { size?: number; className?: string }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Ambient glow */}
            <circle cx="32" cy="32" r="31" fill="url(#ambGlow)" opacity="0.12" />

            {/* Head body — rounded square */}
            <rect x="8" y="12" width="48" height="44" rx="16" fill="url(#bodyGrad)" />
            <rect x="10" y="14" width="44" height="40" rx="14" fill="url(#faceGrad)" />

            {/* Forehead energy core */}
            <circle cx="32" cy="20" r="3.5" fill="url(#coreGrad)" />
            <circle cx="32" cy="20" r="2" fill="white" opacity="0.4" />
            <circle cx="31" cy="19" r="0.8" fill="white" opacity="0.7" />

            {/* Visor / eye band */}
            <rect x="15" y="28" width="34" height="12" rx="6" fill="#0f172a" />
            <rect x="16.5" y="29.5" width="31" height="9" rx="4.5" fill="url(#visorGrad)" opacity="0.85" />

            {/* Left eye — glowing dot */}
            <circle cx="24" cy="34" r="4" fill="#0f172a" />
            <circle cx="24" cy="34" r="3" fill="url(#eyeDot)" />
            <circle cx="22.5" cy="32.5" r="1.5" fill="white" opacity="0.85" />
            <circle cx="25" cy="35.5" r="0.7" fill="white" opacity="0.4" />

            {/* Right eye — glowing dot */}
            <circle cx="40" cy="34" r="4" fill="#0f172a" />
            <circle cx="40" cy="34" r="3" fill="url(#eyeDot)" />
            <circle cx="38.5" cy="32.5" r="1.5" fill="white" opacity="0.85" />
            <circle cx="41" cy="35.5" r="0.7" fill="white" opacity="0.4" />

            {/* Mouth — friendly curve */}
            <path d="M27 46 Q32 51 37 46" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Side circuit accents */}
            <rect x="4" y="30" width="5" height="8" rx="2.5" fill="url(#bodyGrad)" opacity="0.7" />
            <circle cx="6.5" cy="34" r="1.5" fill="url(#coreGrad)" opacity="0.6" />
            <rect x="55" y="30" width="5" height="8" rx="2.5" fill="url(#bodyGrad)" opacity="0.7" />
            <circle cx="57.5" cy="34" r="1.5" fill="url(#coreGrad)" opacity="0.6" />

            {/* Antenna */}
            <rect x="30" y="4" width="4" height="9" rx="2" fill="url(#bodyGrad)" />
            <circle cx="32" cy="33" r="3" fill="url(#coreGrad)" />
            <circle cx="31.2" cy="2.2" r="1" fill="white" opacity="0.65" />

            {/* Subtle face shine */}
            <ellipse cx="28" cy="18" rx="12" ry="3.5" fill="white" opacity="0.1" />

            <defs>
                <radialGradient id="ambGlow" cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="bodyGrad" x1="8" y1="12" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#c7d2fe" />
                    <stop offset="0.5" stopColor="#a5b4fc" />
                    <stop offset="1" stopColor="#818cf8" />
                </linearGradient>
                <radialGradient id="faceGrad" cx="0.5" cy="0.3" r="0.6" gradientUnits="objectBoundingBox">
                    <stop stopColor="#f8fafc" />
                    <stop offset="0.5" stopColor="#eef2ff" />
                    <stop offset="1" stopColor="#e0e7ff" />
                </radialGradient>
                <linearGradient id="visorGrad" x1="15" y1="28" x2="49" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#6366f1" />
                    <stop offset="0.5" stopColor="#0ea5e9" />
                    <stop offset="1" stopColor="#06b6d4" />
                </linearGradient>
                <radialGradient id="coreGrad" cx="0.4" cy="0.35" r="0.6" gradientUnits="objectBoundingBox">
                    <stop stopColor="#67e8f9" />
                    <stop offset="0.5" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#06b6d4" />
                </radialGradient>
                <radialGradient id="eyeDot" cx="0.4" cy="0.4" r="0.55" gradientUnits="objectBoundingBox">
                    <stop stopColor="#a5f3fc" />
                    <stop offset="0.5" stopColor="#22d3ee" />
                    <stop offset="1" stopColor="#0891b2" />
                </radialGradient>
            </defs>
        </svg>
    )
}

// ─── AI Response Logic ───────────────────────────────────────────────
function generateResponse(message: string, role: string | null): string {
    const lower = message.toLowerCase()

    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        if (role === 'admin') return "Hello, Admin! I'm Adam, your school management assistant. I can help with student records, staff management, reports, and more. How can I assist you today?"
        if (role === 'teacher') return "Hello, Teacher! I'm Adam, your teaching companion. I can help with lesson planning, grading tips, student monitoring, and classroom management. What do you need?"
        if (role === 'student') return "Hey there! I'm Adam, your study buddy! I can help you with homework, quiz prep, timetable questions, and learning tips. What's on your mind?"
        return "Hello! I'm Adam, your smart assistant. How can I help you today?"
    }

    if (lower.includes('homework') || lower.includes('assignment')) {
        if (role === 'student') return "Need help with homework? Here's what I suggest:\n\n1. **Check your Homework page** for all pending assignments\n2. **Prioritize** tasks by due date\n3. **Break down** large tasks into smaller steps\n4. Take a 5-min break every 25 minutes (Pomodoro technique!)\n\nWant me to guide you to a specific subject?"
        if (role === 'teacher') return "I can help you manage homework assignments!\n\n• Create new assignments from the **Homework** section\n• Track student submissions and completion rates\n• Set priority levels and due dates\n\nWould you like tips on effective assignment design?"
        return "Homework management is available under each role's portal. Admins can view submission analytics in the Reports section."
    }

    if (lower.includes('timetable') || lower.includes('schedule') || lower.includes('class')) {
        return "Your timetable is available in the **Timetable** section of the sidebar. You can view:\n\n• Daily and weekly schedules\n• Subject timings and room numbers\n• Teacher assignments\n\nWould you like me to navigate you there?"
    }

    if (lower.includes('grade') || lower.includes('marks') || lower.includes('performance') || lower.includes('score')) {
        if (role === 'student') return "Check your performance in the **Performance** tab! You'll find:\n\n• Subject-wise progress with percentage\n• Exam results and analysis\n• Comparison with class average\n• Areas that need improvement\n\nKeep pushing — consistency is the key!"
        return "Performance data and grade analytics are available in the **Reports** and **Leaderboard** sections."
    }

    if (lower.includes('attendance') || lower.includes('absent') || lower.includes('present')) {
        return "Attendance records can be found in the **Attendance** section. It shows:\n\n• Daily attendance status\n• Monthly attendance percentage\n• Alerts for low attendance\n\nRegular attendance is crucial for academic success!"
    }

    if (lower.includes('quiz') || lower.includes('test') || lower.includes('exam')) {
        if (role === 'student') return "Ready for a quiz? Here are some tips:\n\n1. Review your notes 30 minutes before\n2. Focus on key concepts, not just memorization\n3. Practice with past questions\n4. Stay calm and take deep breaths\n\nHead to the **Quizzes** section to start practicing!"
        return "Quiz management is available in the sidebar. You can create, schedule, and monitor quizzes."
    }

    if (lower.includes('leaderboard') || lower.includes('rank') || lower.includes('top')) {
        return "The **Leaderboard** shows top performers! Here's how ranking works:\n\n• Points from quizzes and assignments\n• Bonus for consistent performance\n• Special badges for streaks\n\nKeep working hard to climb the ranks!"
    }

    if (lower.includes('help') || lower.includes('what can you do') || lower.includes('features')) {
        return "I'm **Adam**, your AI school assistant! Here's what I can help with:\n\n• **Academics** — homework, quizzes, study tips\n• **Schedule** — timetable, events, calendar\n• **Performance** — grades, attendance, reports\n• **Activities** — leaderboard, achievements\n• **General** — school policies, navigation help\n\nJust ask me anything!"
    }

    if (lower.includes('thank') || lower.includes('thanks')) {
        return "You're welcome! I'm always here to help. Don't hesitate to ask if you need anything else! Have a great day!"
    }

    if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('see you')) {
        return "Goodbye! Remember, I'm just a click away whenever you need help. Happy learning!"
    }

    const fallbacks = [
        "That's a great question! While I'm still learning about that specific topic, I can help you navigate the app, answer academic queries, or provide study tips. Try asking me about homework, grades, or your timetable!",
        "Interesting! I'd love to help with that. Could you tell me a bit more? In the meantime, I can assist with timetable queries, homework tips, performance tracking, and more!",
        "I'm not 100% sure about that yet, but I'm always improving! Feel free to ask me about your schedule, grades, quizzes, or anything school-related!",
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
}

// ─── Types ───────────────────────────────────────────────────────────
interface Message {
    id: string
    text: string
    sender: 'user' | 'adam'
    timestamp: Date
}

// ─── Component ───────────────────────────────────────────────────────
export default function AdamChatbot() {
    const { userRole } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hey there! I'm **Adam**, your AI school assistant. How can I help you today?",
            sender: 'adam',
            timestamp: new Date(),
        },
    ])
    const [inputValue, setInputValue] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
    useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus() }, [isOpen])

    const handleSend = useCallback(() => {
        if (!inputValue.trim()) return
        const userMsg: Message = { id: Date.now().toString(), text: inputValue.trim(), sender: 'user', timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInputValue('')
        setIsTyping(true)
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                text: generateResponse(userMsg.text, userRole),
                sender: 'adam',
                timestamp: new Date(),
            }])
            setIsTyping(false)
        }, 800 + Math.random() * 700)
    }, [inputValue, userRole])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const toggleOpen = () => { setIsOpen(prev => !prev); if (isExpanded) setIsExpanded(false) }

    const clearChat = () => {
        setMessages([{
            id: '1',
            text: "Chat cleared! I'm still here — ask me anything!",
            sender: 'adam',
            timestamp: new Date(),
        }])
    }

    const formatText = (text: string) =>
        text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/• /g, '<span class="inline-block ml-1">• </span>')

    const quickSuggestions = ['Hello!', 'Homework help', 'My timetable', 'Leaderboard', 'What can you do?']

    return (
        <>
            {/* ─── Floating Button (Professional Premium Redesign) ─── */}
            {!isOpen && (
                <button
                    onClick={toggleOpen}
                    className="
                        fixed bottom-8 right-8 z-[9999]
                        h-[56px] w-[56px] hover:w-[200px] rounded-full hover:rounded-[20px]
                        bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600
                        bg-[length:200%_auto] hover:bg-right
                        flex items-center gap-0 hover:gap-3.5 px-[10px] hover:pl-3.5 hover:pr-5
                        shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)]
                        hover:shadow-[0_15px_35px_-10px_rgba(79,70,229,0.6)]
                        hover:scale-[1.02] active:scale-[0.98]
                        border border-white/20 backdrop-blur-md
                        group overflow-hidden
                    "
                    style={{ transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.3s ease, box-shadow 0.4s ease, transform 0.2s ease, padding 0.4s ease, gap 0.4s ease, background-position 0.4s ease' }}
                    aria-label="Ask Adam"
                >
                    {/* Shimmer Effect */}
                    <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:animate-shimmer" />

                    {/* Avatar Container with Glow */}
                    <div className="relative flex-shrink-0">
                        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center ring-1 ring-white/30 shadow-inner group-hover:ring-white/50 transition-all duration-300">
                            <BotAvatar size={24} />
                        </div>
                        {/* Status Pulse */}
                        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                    </div>

                    {/* Text — hidden by default, revealed on hover */}
                    <div className="flex flex-col items-start leading-tight whitespace-nowrap opacity-0 group-hover:opacity-100 max-w-0 group-hover:max-w-[140px] overflow-hidden transition-all duration-400">
                        <span className="text-white font-bold text-[14px] tracking-tight flex items-center gap-1.5">
                            Ask Adam
                            <Sparkles className="w-3 h-3 text-indigo-200 group-hover:rotate-12 transition-transform duration-300" />
                        </span>
                        <span className="text-white/60 text-[10px] font-medium tracking-wide flex items-center gap-1 uppercase">
                            AI Assistant
                            <span className="w-1 h-1 bg-white/40 rounded-full" />
                            Online
                        </span>
                    </div>
                </button>
            )}

            {/* ─── Chat Panel ─────────────────────────────────── */}
            <div
                className={`
                    fixed z-[9998]
                    transition-all duration-500
                    ${isExpanded
                        ? 'bottom-0 right-0 w-full h-full md:bottom-4 md:right-4 md:w-[520px] md:h-[92vh] md:rounded-2xl'
                        : 'bottom-8 right-8 w-[400px] h-[620px] rounded-2xl'
                    }
                    ${isOpen
                        ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
                        : 'opacity-0 translate-y-6 scale-[0.97] pointer-events-none'
                    }
                `}
                style={{
                    transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)',
                    boxShadow: isOpen
                        ? '0 25px 80px -8px rgba(0,0,0,0.22), 0 8px 24px -4px rgba(79,70,229,0.12), 0 0 0 1px rgba(0,0,0,0.04)'
                        : 'none',
                }}
            >
                <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-2xl">

                    {/* ─── Header (Premium Mesh Design) ───────────────────── */}
                    <div className="relative flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-600 text-white overflow-hidden">
                        {/* Mesh Decorative Background */}
                        <div className="absolute inset-0 opacity-20" style={{
                            backgroundImage: `radial-gradient(at 0% 0%, rgba(255,255,255,0.4) 0, transparent 50%), 
                                              radial-gradient(at 100% 0%, rgba(255,255,255,0.3) 0, transparent 50%),
                                              radial-gradient(at 100% 100%, rgba(255,255,255,0.2) 0, transparent 50%),
                                              radial-gradient(at 0% 100%, rgba(255,255,255,0.1) 0, transparent 50%)`
                        }} />
                        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                                    <BotAvatar size={26} />
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-[2px] border-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-[15px] tracking-tight leading-none">Adam</h3>
                                <p className="text-white/60 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                                    <Sparkles className="w-3 h-3 text-indigo-200" />
                                    AI Assistant · Online
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 relative z-10">
                            <button onClick={clearChat} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setIsExpanded(!isExpanded)} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={toggleOpen} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* ─── Messages Area ───────────────────────────── */}
                    <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-b from-slate-50/60 to-white custom-scrollbar">

                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`} style={{ animation: 'slideUp 0.4s ease-out' }}>
                                {msg.sender === 'adam' && (
                                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                                        <BotAvatar size={20} />
                                    </div>
                                )}
                                <div className={`
                                    max-w-[82%] px-4 py-3 text-[13px] leading-relaxed shadow-sm
                                    ${msg.sender === 'user'
                                        ? `bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl rounded-tr-sm border border-white/10`
                                        : `bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-100/80`
                                    }
                                `}>
                                    <div className="relative z-10" dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                                    <p className={`text-[10px] mt-2 font-medium ${msg.sender === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-end gap-2.5 animate-pulse-subtle">
                                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100">
                                    <BotAvatar size={20} />
                                </div>
                                <div className="bg-white px-5 py-3 rounded-2xl rounded-tl-sm border border-slate-100/80 shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* ─── Quick Suggestions ───────────────────── */}
                    {messages.length <= 1 && (
                        <div className="px-4 pb-2 pt-1 flex flex-wrap gap-1.5 border-t border-slate-50 bg-white">
                            {quickSuggestions.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => {
                                        const userMsg: Message = { id: Date.now().toString(), text: s, sender: 'user', timestamp: new Date() }
                                        setMessages(prev => [...prev, userMsg])
                                        setIsTyping(true)
                                        setTimeout(() => {
                                            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: generateResponse(s, userRole), sender: 'adam', timestamp: new Date() }])
                                            setIsTyping(false)
                                        }, 800)
                                    }}
                                    className="px-3 py-1.5 text-[11px] font-medium rounded-full border border-indigo-100 bg-indigo-50/60 text-indigo-600 hover:shadow-sm transition-all duration-200 hover:scale-[1.03]"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* ─── Input Area ───────────────────────────────── */}
                    <div className="px-4 py-4 border-t border-slate-100 bg-white">
                        <div className="flex items-center gap-2 bg-slate-50/80 rounded-xl px-4 py-2 border border-slate-200/80 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all duration-200 shadow-inner">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type your message..."
                                className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputValue.trim()}
                                className={`
                                    w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200
                                    ${inputValue.trim()
                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                                        : 'bg-slate-200/70 text-slate-400 cursor-not-allowed'
                                    }
                                `}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-center text-[10px] text-slate-400/80 mt-2 select-none">
                            Powered by <span className="font-semibold text-slate-500">Adam AI</span> · schools24
                        </p>
                    </div>
                </div>
            </div>

            {/* ─── Animations ─────────────────────────────────── */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s ease-in-out infinite;
                }
                @keyframes shimmer {
                    100% { transform: translateX(200%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes pulse-subtle {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .animate-pulse-subtle {
                    animation: pulse-subtle 2s infinite;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            ` }} />
        </>
    )
}
