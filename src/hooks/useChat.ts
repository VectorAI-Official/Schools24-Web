/**
 * useChat — WebSocket hook for Adam AI (Schools24 AI assistant)
 *
 * Session semantics:
 *   - enabled=true  → open WS, fresh session
 *   - enabled=false → close WS, flush messages, increment generation so ANY
 *                     stale onclose/retry callbacks from the old WS are discarded
 *
 * Uses a session generation counter (sessionGenRef) to prevent the classic
 * race where the old WS fires onclose *after* flush and schedules a retry,
 * creating a ghost second connection that sends a duplicate welcome message.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

// ─── Token helpers (mirror api.ts STORAGE_KEYS) ──────────────────────────────

const STORAGE_KEYS = {
    TOKEN: 'School24_token',
    REMEMBER: 'School24_remember',
} as const

function getToken(): string | null {
    if (typeof window === 'undefined') return null
    const remembered = localStorage.getItem(STORAGE_KEYS.REMEMBER) === 'true'
    const primary = remembered ? localStorage : sessionStorage
    return (
        primary.getItem(STORAGE_KEYS.TOKEN) ||
        localStorage.getItem(STORAGE_KEYS.TOKEN) ||
        sessionStorage.getItem(STORAGE_KEYS.TOKEN)
    )
}

function buildWsUrl(): string {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
    // Convert http(s):// → ws(s)://
    return apiUrl.replace(/^http/, 'ws') + '/chat/ws'
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type ChatMessageSender = 'user' | 'adam' | 'error'

export interface ChatAttachment {
    name: string
    size: number
    content: string   // base64-encoded file bytes
    mimeType: string
}

export interface ChatMessage {
    id: string
    text: string
    sender: ChatMessageSender
    timestamp: Date
    sources?: string[]
    attachment?: ChatAttachment
}

export type WsStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface UseChatReturn {
    messages: ChatMessage[]
    status: WsStatus
    isTyping: boolean
    sendMessage: (text: string, attachment?: ChatAttachment) => void
    clearMessages: () => void
    reconnect: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_RECONNECT = 3

function makeWelcome(): ChatMessage {
    return {
        id: `local-welcome-${Date.now()}`,
        text: "Hey there! I'm **Adam**, your AI school assistant. How can I help you today?",
        sender: 'adam',
        timestamp: new Date(),
    }
}

// ─── Backend WSMessage shape ──────────────────────────────────────────────────

interface WSMessage {
    type: 'user' | 'bot' | 'error' | 'doc'
    content: string
    sources?: string[]
    filename?: string
    mimeType?: string
    fileData?: string  // base64
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChat(enabled = true): UseChatReturn {
    const [messages, setMessages] = useState<ChatMessage[]>(() => [makeWelcome()])
    const [status, setStatus] = useState<WsStatus>('disconnected')
    const [isTyping, setIsTyping] = useState(false)

    const wsRef = useRef<WebSocket | null>(null)
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const retryCountRef = useRef(0)
    // True once the user sends their first message in this session.
    // Any bot message that arrives before this is an auto-greeting from the
    // backend (e.g. old binary) and should be silently dropped so the local
    // animated welcome remains the sole introductory message.
    const userHasSentRef = useRef(false)

    // Incrementing generation — when flush() bumps this, every stale WS
    // callback sees its captured gen !== current gen and bails out.
    const sessionGenRef = useRef(0)

    // ── Flush ─────────────────────────────────────────────────────────────────
    const flush = useCallback(() => {
        sessionGenRef.current += 1
        if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null }
        if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); wsRef.current = null }
        retryCountRef.current = 0
        userHasSentRef.current = false
        setMessages([makeWelcome()])
        setStatus('disconnected')
        setIsTyping(false)
    }, [])

    // ── Core connect — intentionally stable (no deps, reads from refs) ────────
    const connect = useCallback(() => {
        if (typeof window === 'undefined') return
        const token = getToken()
        if (!token) return

        const myGen = sessionGenRef.current
        const url = `${buildWsUrl()}?token=${encodeURIComponent(token)}`
        setStatus('connecting')
        const ws = new WebSocket(url)
        wsRef.current = ws

        ws.onopen = () => {
            if (sessionGenRef.current !== myGen) { ws.close(); return }
            setStatus('connected')
            retryCountRef.current = 0
        }

        ws.onmessage = (event) => {
            if (sessionGenRef.current !== myGen) return
            try {
                const data = JSON.parse(event.data as string) as WSMessage
                setIsTyping(false)
                if (data.type === 'bot') {
                    // Drop any bot message that arrives before the user has typed
                    // anything — this suppresses backend auto-greetings from old
                    // binaries so the local welcome is the only intro shown.
                    if (!userHasSentRef.current) return
                    setMessages((prev) => [
                        ...prev,
                        { id: `bot-${Date.now()}`, text: data.content, sender: 'adam', timestamp: new Date(), sources: data.sources },
                    ])
                } else if (data.type === 'error') {
                    setMessages((prev) => [...prev, { id: `err-${Date.now()}`, text: data.content || 'Something went wrong.', sender: 'error', timestamp: new Date() }])
                }
            } catch { /* ignore malformed */ }
        }

        ws.onerror = () => {
            if (sessionGenRef.current !== myGen) return
            setStatus('error'); setIsTyping(false)
        }

        ws.onclose = () => {
            if (sessionGenRef.current !== myGen) return // stale — never retry
            setStatus('disconnected'); setIsTyping(false); wsRef.current = null
            if (retryCountRef.current < MAX_RECONNECT) {
                const delay = Math.min(1_000 * 2 ** retryCountRef.current, 10_000)
                retryCountRef.current += 1
                retryTimerRef.current = setTimeout(() => {
                    if (sessionGenRef.current === myGen) connect()
                }, delay)
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // stable — reads refs only

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!enabled) { flush(); return }
        connect()
        return () => {
            // Silence current WS before next effect or unmount; flush handles state reset
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
        }
    }, [enabled, connect, flush])

    // ── Public API ────────────────────────────────────────────────────────────
    const sendMessage = useCallback((text: string, attachment?: ChatAttachment) => {
        const trimmed = text.trim()
        if (!trimmed && !attachment) return

        userHasSentRef.current = true

        const userMsg: ChatMessage = {
            id: `user-${Date.now()}`,
            text: trimmed || `📎 ${attachment?.name}`,
            sender: 'user',
            timestamp: new Date(),
            attachment,
        }
        setMessages((prev) => [...prev, userMsg])

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            setIsTyping(true)
            if (attachment) {
                const payload: WSMessage = { type: 'doc', content: trimmed, filename: attachment.name, mimeType: attachment.mimeType, fileData: attachment.content }
                wsRef.current.send(JSON.stringify(payload))
            } else {
                wsRef.current.send(JSON.stringify({ type: 'user', content: trimmed } as WSMessage))
            }
        } else {
            setMessages((prev) => [...prev, { id: `offline-${Date.now()}`, text: 'Connection lost. Click **Reconnect** to restore the chat.', sender: 'error', timestamp: new Date() }])
        }
    }, [])

    const clearMessages = useCallback(() => {
        userHasSentRef.current = false
        setMessages([{ id: `cleared-${Date.now()}`, text: "Chat cleared! I'm still here — ask me anything!", sender: 'adam', timestamp: new Date() }])
    }, [])

    const reconnect = useCallback(() => {
        flush()
        setTimeout(connect, 100)
    }, [flush, connect])

    return { messages, status, isTyping, sendMessage, clearMessages, reconnect }
}

