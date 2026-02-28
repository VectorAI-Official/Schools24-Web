"use client"

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Send, X, Sparkles, RotateCcw, WifiOff, Paperclip, FileText } from 'lucide-react'
import { useChat, type ChatAttachment } from '@/hooks/useChat'
import { useAuth } from '@/contexts/AuthContext'

// ─── Bot Avatar — Modern AI Character ────────────────────────────────
type AvatarColors = {
    ambGlow: string
    bodyA: string; bodyB: string; bodyC: string
    faceB: string; faceC: string
    visorA: string; visorB: string; visorC: string
    coreA: string; coreB: string; coreC: string
    eyeA: string; eyeB: string; eyeC: string
}

const AVATAR_COLORS: Record<'indigo' | 'orange' | 'green', AvatarColors> = {
    indigo: {
        ambGlow: '#818cf8',
        bodyA: '#c7d2fe', bodyB: '#a5b4fc', bodyC: '#818cf8',
        faceB: '#eef2ff', faceC: '#e0e7ff',
        visorA: '#6366f1', visorB: '#0ea5e9', visorC: '#06b6d4',
        coreA: '#67e8f9', coreB: '#22d3ee', coreC: '#06b6d4',
        eyeA:  '#a5f3fc', eyeB:  '#22d3ee', eyeC:  '#0891b2',
    },
    orange: {
        ambGlow: '#fb923c',
        bodyA: '#fed7aa', bodyB: '#fdba74', bodyC: '#f97316',
        faceB: '#fff7ed', faceC: '#ffedd5',
        visorA: '#f97316', visorB: '#ea580c', visorC: '#c2410c',
        coreA: '#fde68a', coreB: '#fbbf24', coreC: '#d97706',
        eyeA:  '#fed7aa', eyeB:  '#fb923c', eyeC:  '#ea580c',
    },
    green: {
        ambGlow: '#34d399',
        bodyA: '#a7f3d0', bodyB: '#6ee7b7', bodyC: '#10b981',
        faceB: '#ecfdf5', faceC: '#d1fae5',
        visorA: '#059669', visorB: '#10b981', visorC: '#34d399',
        coreA: '#6ee7b7', coreB: '#34d399', coreC: '#059669',
        eyeA:  '#a7f3d0', eyeB:  '#34d399', eyeC:  '#065f46',
    },
}

let _uidCounter = 0
function BotAvatar({ size = 40, className = '', colors = AVATAR_COLORS.indigo }: { size?: number; className?: string; colors?: AvatarColors }) {
    // stable per-instance uid so multiple SVGs on the same page don't share defs
    const uid = useRef(`av${++_uidCounter}`).current
    const id = (s: string) => `${uid}-${s}`
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
            <circle cx="32" cy="32" r="31" fill={`url(#${id('ambGlow')})`} opacity="0.12" />

            {/* Head body — rounded square */}
            <rect x="8" y="12" width="48" height="44" rx="16" fill={`url(#${id('bodyGrad')})`} />
            <rect x="10" y="14" width="44" height="40" rx="14" fill={`url(#${id('faceGrad')})`} />

            {/* Forehead energy core */}
            <circle cx="32" cy="20" r="3.5" fill={`url(#${id('coreGrad')})`} />
            <circle cx="32" cy="20" r="2" fill="white" opacity="0.4" />
            <circle cx="31" cy="19" r="0.8" fill="white" opacity="0.7" />

            {/* Visor / eye band */}
            <rect x="15" y="28" width="34" height="12" rx="6" fill="#0f172a" />
            <rect x="16.5" y="29.5" width="31" height="9" rx="4.5" fill={`url(#${id('visorGrad')})`} opacity="0.85" />

            {/* Left eye — glowing dot */}
            <circle cx="24" cy="34" r="4" fill="#0f172a" />
            <circle cx="24" cy="34" r="3" fill={`url(#${id('eyeDot')})`} />
            <circle cx="22.5" cy="32.5" r="1.5" fill="white" opacity="0.85" />
            <circle cx="25" cy="35.5" r="0.7" fill="white" opacity="0.4" />

            {/* Right eye — glowing dot */}
            <circle cx="40" cy="34" r="4" fill="#0f172a" />
            <circle cx="40" cy="34" r="3" fill={`url(#${id('eyeDot')})`} />
            <circle cx="38.5" cy="32.5" r="1.5" fill="white" opacity="0.85" />
            <circle cx="41" cy="35.5" r="0.7" fill="white" opacity="0.4" />

            {/* Mouth — friendly curve */}
            <path d="M27 46 Q32 51 37 46" stroke="#64748b" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Side circuit accents */}
            <rect x="4" y="30" width="5" height="8" rx="2.5" fill={`url(#${id('bodyGrad')})`} opacity="0.7" />
            <circle cx="6.5" cy="34" r="1.5" fill={`url(#${id('coreGrad')})`} opacity="0.6" />
            <rect x="55" y="30" width="5" height="8" rx="2.5" fill={`url(#${id('bodyGrad')})`} opacity="0.7" />
            <circle cx="57.5" cy="34" r="1.5" fill={`url(#${id('coreGrad')})`} opacity="0.6" />

            {/* Antenna */}
            <rect x="30" y="4" width="4" height="9" rx="2" fill={`url(#${id('bodyGrad')})`} />
            <circle cx="32" cy="33" r="3" fill={`url(#${id('coreGrad')})`} />
            <circle cx="31.2" cy="2.2" r="1" fill="white" opacity="0.65" />

            {/* Subtle face shine */}
            <ellipse cx="28" cy="18" rx="12" ry="3.5" fill="white" opacity="0.1" />

            <defs>
                <radialGradient id={id('ambGlow')} cx="0.5" cy="0.5" r="0.5" gradientUnits="objectBoundingBox">
                    <stop stopColor={colors.ambGlow} />
                    <stop offset="1" stopColor={colors.ambGlow} stopOpacity="0" />
                </radialGradient>
                <linearGradient id={id('bodyGrad')} x1="8" y1="12" x2="56" y2="56" gradientUnits="userSpaceOnUse">
                    <stop stopColor={colors.bodyA} />
                    <stop offset="0.5" stopColor={colors.bodyB} />
                    <stop offset="1" stopColor={colors.bodyC} />
                </linearGradient>
                <radialGradient id={id('faceGrad')} cx="0.5" cy="0.3" r="0.6" gradientUnits="objectBoundingBox">
                    <stop stopColor="#f8fafc" />
                    <stop offset="0.5" stopColor={colors.faceB} />
                    <stop offset="1" stopColor={colors.faceC} />
                </radialGradient>
                <linearGradient id={id('visorGrad')} x1="15" y1="28" x2="49" y2="40" gradientUnits="userSpaceOnUse">
                    <stop stopColor={colors.visorA} />
                    <stop offset="0.5" stopColor={colors.visorB} />
                    <stop offset="1" stopColor={colors.visorC} />
                </linearGradient>
                <radialGradient id={id('coreGrad')} cx="0.4" cy="0.35" r="0.6" gradientUnits="objectBoundingBox">
                    <stop stopColor={colors.coreA} />
                    <stop offset="0.5" stopColor={colors.coreB} />
                    <stop offset="1" stopColor={colors.coreC} />
                </radialGradient>
                <radialGradient id={id('eyeDot')} cx="0.4" cy="0.4" r="0.55" gradientUnits="objectBoundingBox">
                    <stop stopColor={colors.eyeA} />
                    <stop offset="0.5" stopColor={colors.eyeB} />
                    <stop offset="1" stopColor={colors.eyeC} />
                </radialGradient>
            </defs>
        </svg>
    )
}

// ─── Types ───────────────────────────────────────────────────────────

// ─── Component ───────────────────────────────────────────────────────
export default function AdamChatbot() {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState('')
    const [pendingAttachment, setPendingAttachment] = useState<ChatAttachment | null>(null)
    const [mounted, setMounted] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const { userRole } = useAuth()

    // Role-based colour theme: orange → student, green → teacher, indigo → everyone else
    const theme = userRole === 'student'
        ? {
            headerGrad:   'from-orange-500 via-amber-500 to-orange-500',
            triggerGrad:  'from-orange-500 via-amber-500 to-orange-500',
            triggerShadow:'shadow-[0_10px_30px_-10px_rgba(249,115,22,0.5)]',
            triggerHoverShadow:'hover:shadow-[0_15px_35px_-10px_rgba(249,115,22,0.6)]',
            statusBorder: 'border-orange-500',
            iconBg:       'bg-orange-400/40',
            userBubble:   'bg-orange-500',
            chipColors:   'border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100',
            focusRing:    'focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-100',
            sendActive:   'bg-orange-500 hover:bg-orange-600',
            typingDot:    'bg-orange-400',
            clip:         'hover:text-orange-600 hover:bg-orange-50',
            attachWrap:   'bg-orange-50 border-orange-100',
            attachText:   'text-orange-700',
            attachMeta:   'text-orange-400',
            attachIcon:   'text-orange-500',
            attachClose:  'hover:bg-orange-200 text-orange-500',
            msgFileIcon:  'text-orange-500',
            avatarColors: AVATAR_COLORS.orange,
        }
        : userRole === 'teacher'
        ? {
            headerGrad:   'from-emerald-600 via-green-600 to-emerald-600',
            triggerGrad:  'from-emerald-600 via-green-600 to-emerald-600',
            triggerShadow:'shadow-[0_10px_30px_-10px_rgba(5,150,105,0.5)]',
            triggerHoverShadow:'hover:shadow-[0_15px_35px_-10px_rgba(5,150,105,0.6)]',
            statusBorder: 'border-emerald-600',
            iconBg:       'bg-emerald-500/40',
            userBubble:   'bg-emerald-600',
            chipColors:   'border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
            focusRing:    'focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100',
            sendActive:   'bg-emerald-600 hover:bg-emerald-700',
            typingDot:    'bg-emerald-400',
            clip:         'hover:text-emerald-600 hover:bg-emerald-50',
            attachWrap:   'bg-emerald-50 border-emerald-100',
            attachText:   'text-emerald-700',
            attachMeta:   'text-emerald-400',
            attachIcon:   'text-emerald-500',
            attachClose:  'hover:bg-emerald-200 text-emerald-500',
            msgFileIcon:  'text-emerald-500',
            avatarColors: AVATAR_COLORS.green,
        }
        : {
            headerGrad:   'from-indigo-600 via-blue-600 to-indigo-600',
            triggerGrad:  'from-indigo-600 via-blue-600 to-indigo-600',
            triggerShadow:'shadow-[0_10px_30px_-10px_rgba(79,70,229,0.5)]',
            triggerHoverShadow:'hover:shadow-[0_15px_35px_-10px_rgba(79,70,229,0.6)]',
            statusBorder: 'border-indigo-600',
            iconBg:       'bg-indigo-500/40',
            userBubble:   'bg-indigo-600',
            chipColors:   'border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
            focusRing:    'focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100',
            sendActive:   'bg-indigo-600 hover:bg-indigo-700',
            typingDot:    'bg-indigo-400',
            clip:         'hover:text-indigo-600 hover:bg-indigo-50',
            attachWrap:   'bg-indigo-50 border-indigo-100',
            attachText:   'text-indigo-700',
            attachMeta:   'text-indigo-400',
            attachIcon:   'text-indigo-500',
            attachClose:  'hover:bg-indigo-200 text-indigo-500',
            msgFileIcon:  'text-indigo-500',
            avatarColors: AVATAR_COLORS.indigo,
        }

    // WS connects on open, flushes completely on close (generation-guarded)
    const { messages, status, isTyping, sendMessage, clearMessages, reconnect } = useChat(isOpen)

    // Portal requires document to exist (SSR safe)
    useEffect(() => { setMounted(true) }, [])

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [])

    useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])
    useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus() }, [isOpen])

    const handleSend = useCallback(() => {
        if (!inputValue.trim() && !pendingAttachment) return
        sendMessage(inputValue, pendingAttachment ?? undefined)
        setInputValue('')
        setPendingAttachment(null)
    }, [inputValue, pendingAttachment, sendMessage])

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const MAX_MB = 5
        if (file.size > MAX_MB * 1024 * 1024) {
            alert(`File too large. Max ${MAX_MB} MB.`)
            e.target.value = ''
            return
        }
        const arrayBuffer = await file.arrayBuffer()
        // Chunked loop — avoids "Maximum call stack size exceeded" caused by
        // spreading large Uint8Arrays into String.fromCharCode() as arguments.
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i])
        }
        const base64 = btoa(binary)
        setPendingAttachment({ name: file.name, size: file.size, content: base64, mimeType: file.type })
        e.target.value = ''
    }

    const statusDotClass =
        status === 'connected' ? 'bg-emerald-400' :
        status === 'connecting' ? 'bg-yellow-400 animate-pulse' :
        'bg-red-400'

    const formatText = (text: string) =>
        text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
            .replace(/\n/g, '<br/>')
            .replace(/• /g, '<span class="inline-block ml-1">• </span>')

    const quickSuggestions = ['How can you help?', 'Homework help', 'My timetable', 'Leaderboard', 'What can you do?']

    const canSend = !!(inputValue.trim() || pendingAttachment)

    // ── UI ──────────────────────────────────────────────────────────────────
    const ui = (
        <>
            {/* ─── Floating Trigger Button ─── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className={`
                        fixed bottom-8 right-8 z-[9999]
                        h-[56px] w-[56px] rounded-full
                        bg-gradient-to-br ${theme.triggerGrad}
                        flex items-center justify-center
                        ${theme.triggerShadow}
                        hover:scale-110 active:scale-95
                        border border-white/20
                    `}
                    style={{ transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                    aria-label="Ask Adam"
                >
                    <div className={`w-10 h-10 rounded-full ${theme.iconBg} flex items-center justify-center`}>
                        <BotAvatar size={26} colors={theme.avatarColors} />
                    </div>
                    <div className={`absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${theme.statusBorder} ${statusDotClass}`} />
                </button>
            )}

            {/* ─── Backdrop ─── */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-[9997] bg-black/30 backdrop-blur-[2px]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* ─── Full-height Chat Sidebar ─── */}
            <div
                className={`
                    fixed top-0 right-0 z-[9998] h-screen w-full sm:w-[440px]
                    flex flex-col bg-card
                    shadow-[-12px_0_50px_-8px_rgba(0,0,0,0.15),_-2px_0_8px_-2px_rgba(79,70,229,0.1)]
                    transition-transform duration-[380ms]
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}
                `}
                style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
            >
                {/* Header */}
                <div className={`relative flex items-center justify-between px-5 py-3.5 bg-gradient-to-r ${theme.headerGrad} text-white flex-shrink-0 overflow-hidden`}>
                    <div className="absolute inset-0 opacity-25" style={{
                        backgroundImage: `radial-gradient(at 0% 0%, rgba(255,255,255,0.4) 0, transparent 50%),
                                          radial-gradient(at 100% 0%, rgba(255,255,255,0.3) 0, transparent 50%)`
                    }} />
                    <div className="flex items-center gap-3 relative z-10">
                        <div className="relative">
                            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
                                <BotAvatar size={24} colors={theme.avatarColors} />
                            </div>
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-[2px] ${theme.statusBorder} ${statusDotClass}`} />
                        </div>
                        <div>
                            <h3 className="font-bold text-[15px] leading-none">Adam</h3>
                            <p className="text-white/60 text-[11px] mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-white/60" />
                                AI Assistant · {status === 'connected' ? 'Online' : status === 'connecting' ? 'Connecting…' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 relative z-10">
                        {(status === 'disconnected' || status === 'error') && (
                            <button onClick={reconnect} title="Reconnect" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <WifiOff className="w-3.5 h-3.5" />
                            </button>
                        )}
                        <button onClick={clearMessages} title="New chat" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setIsOpen(false)} aria-label="Close" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-[#f8f9fc] custom-scrollbar">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            style={{ animation: msg.id.startsWith('local-welcome') ? undefined : 'slideUp 0.3s ease-out' }}
                        >
                            {(msg.sender === 'adam' || msg.sender === 'error') && (
                                <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center flex-shrink-0 shadow-sm border border-border">
                                    <BotAvatar size={18} colors={theme.avatarColors} />
                                </div>
                            )}
                            <div className={`
                                max-w-[80%] px-4 py-2.5 text-[13px] leading-relaxed
                                ${msg.id.startsWith('local-welcome') ? 'adam-welcome' : ''}
                                ${msg.sender === 'user'
                                    ? `${theme.userBubble} text-white rounded-2xl rounded-tr-sm shadow-md`
                                    : msg.sender === 'error'
                                    ? 'bg-red-50 text-red-600 rounded-2xl rounded-tl-sm border border-red-100'
                                    : 'bg-card text-foreground rounded-2xl rounded-tl-sm border border-border/70 shadow-sm'
                                }
                            `}>
                                {msg.attachment && (
                                    <div className={`flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg text-[11px] font-medium ${msg.sender === 'user' ? 'bg-white/15' : 'bg-muted border border-border'}`}>
                                        <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${msg.sender === 'user' ? 'text-white/80' : theme.msgFileIcon}`} />
                                        <span className={`truncate max-w-[160px] ${msg.sender === 'user' ? 'text-white/90' : 'text-slate-600'}`}>{msg.attachment.name}</span>
                                        <span className={`flex-shrink-0 ${msg.sender === 'user' ? 'text-white/50' : 'text-slate-400'}`}>{(msg.attachment.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                )}
                                {msg.text && (
                                    <div dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                                )}
                                <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-white/50' : msg.sender === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isTyping && (
                        <div className="flex items-end gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-card flex items-center justify-center flex-shrink-0 shadow-sm border border-border">
                                <BotAvatar size={18} colors={theme.avatarColors} />
                            </div>
                            <div className="bg-card px-4 py-3 rounded-2xl rounded-tl-sm border border-border/70 shadow-sm">
                                <div className="flex gap-1.5 items-center">
                                    <span className={`w-1.5 h-1.5 ${theme.typingDot} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
                                    <span className={`w-1.5 h-1.5 ${theme.typingDot} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
                                    <span className={`w-1.5 h-1.5 ${theme.typingDot} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length <= 1 && (
                    <div className="px-4 pb-3 pt-2 flex flex-wrap gap-1.5 border-t border-border bg-card flex-shrink-0">
                        {quickSuggestions.map((s) => (
                            <button
                                key={s}
                                onClick={() => sendMessage(s)}
                                className={`px-3 py-1.5 text-[11px] font-medium rounded-full border transition-colors ${theme.chipColors}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}

                {/* Attachment preview */}
                {pendingAttachment && (
                    <div className="px-4 pt-2 pb-0 bg-card flex-shrink-0">
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${theme.attachWrap}`}>
                            <FileText className={`w-4 h-4 flex-shrink-0 ${theme.attachIcon}`} />
                            <span className={`text-[12px] font-medium truncate flex-1 ${theme.attachText}`}>{pendingAttachment.name}</span>
                            <span className={`text-[11px] flex-shrink-0 ${theme.attachMeta}`}>{(pendingAttachment.size / 1024).toFixed(1)} KB</span>
                            <button onClick={() => setPendingAttachment(null)} className={`w-5 h-5 flex items-center justify-center rounded-full transition-colors flex-shrink-0 ${theme.attachClose}`}>
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="px-4 py-3 border-t border-border bg-card flex-shrink-0">
                    <div className={`flex items-center gap-2 bg-muted rounded-xl px-3 py-2 border border-border transition-all duration-200 ${theme.focusRing}`}>
                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            title="Attach document"
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 transition-colors flex-shrink-0 ${theme.clip}`}
                        >
                            <Paperclip className="w-4 h-4" />
                        </button>
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={pendingAttachment ? 'Add a message or just send the doc…' : 'Message Adam…'}
                            className="flex-1 bg-transparent text-[13px] text-slate-700 placeholder:text-slate-400 outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!canSend}
                            className={`
                                w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 flex-shrink-0
                                ${canSend
                                    ? `${theme.sendActive} text-white shadow hover:scale-105`
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }
                            `}
                        >
                            <Send className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <p className="text-center text-[11px] text-slate-400 mt-1.5 select-none leading-tight">
                        Adam can make mistakes. Check important info.
                    </p>
                </div>
            </div>

            {/* Animations */}
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes shimmer { 100% { transform: translateX(200%); } }
                .animate-shimmer { animation: shimmer 2s infinite; }
                @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
                @keyframes welcomePop {
                    0%   { opacity:0; transform: translateY(18px) scale(0.95); }
                    60%  { opacity:1; transform: translateY(-3px) scale(1.01); }
                    100% { opacity:1; transform: translateY(0)   scale(1);    }
                }
                .adam-welcome {
                    animation: welcomePop 0.55s cubic-bezier(0.34,1.56,0.64,1) both;
                }
                .adam-welcome .welcome-sparkle {
                    display: inline-block;
                    animation: shimmer-text 2.5s ease-in-out infinite;
                }
                @keyframes shimmer-text {
                    0%,100% { opacity: 1; }
                    50%     { opacity: 0.6; }
                }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #dde1e9; border-radius: 8px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #c5cad6; }
            ` }} />
        </>
    )

    // Render into document.body via portal so fixed positioning is always
    // relative to the true viewport, not clipped by any overflow:hidden parent.
    if (!mounted) return null
    return createPortal(ui, document.body)
}