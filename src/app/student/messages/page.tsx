"use client"

import { FormEvent, useMemo, useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Send, MessageSquare, Loader2, Calendar } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { api, ValidationError } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface StudentClassMessage {
    id: string
    class_id: string
    sender_id: string
    sender_name: string
    sender_role: string
    content: string
    created_at: string
}

interface StudentClassMessagesPage {
    class_id: string
    class_name: string
    messages: StudentClassMessage[]
    page: number
    page_size: number
    has_more: boolean
    next_page: number
    total_count: number
}

export default function StudentMessagesPage() {
    const queryClient = useQueryClient()
    const { user } = useAuth()
    const [draft, setDraft] = useState('')

    const {
        data: messagesData,
        isLoading: messagesLoading,
        hasNextPage,
        fetchNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['student-class-messages'],
        initialPageParam: 1,
        queryFn: async ({ pageParam }) => {
            try {
                return await api.get<StudentClassMessagesPage>(`/student/messages?page=${pageParam}&page_size=50`)
            } catch (e) {
                if (e instanceof ValidationError) {
                    return { class_id: '', class_name: '', messages: [], page: 1, page_size: 50, has_more: false, next_page: 1, total_count: 0 } as StudentClassMessagesPage
                }
                throw e
            }
        },
        getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_page : undefined),
    })

    const pageHead = messagesData?.pages[0]
    const className = pageHead?.class_name || 'Your Class'

    const messages = useMemo(
        () => messagesData?.pages.flatMap((page) => page.messages) || [],
        [messagesData?.pages]
    )

    const sendMutation = useMutation({
        mutationFn: (content: string) => api.post<StudentClassMessage>('/student/messages', { content }),
        onSuccess: () => {
            setDraft('')
            queryClient.invalidateQueries({ queryKey: ['student-class-messages'] })
        },
        onError: (error) => {
            toast.error('Failed to send message', { description: error instanceof Error ? error.message : 'Please try again' })
        },
    })

    const onSend = (e: FormEvent) => {
        e.preventDefault()
        const content = draft.trim()
        if (!content) {
            toast.error('Message cannot be empty')
            return
        }
        sendMutation.mutate(content)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-xl md:text-3xl font-bold">Messages</h1>
                <p className="text-muted-foreground">Class conversation with teachers and classmates</p>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback>
                                {className ? getInitials(className) : <MessageSquare className="h-4 w-4" />}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <CardTitle className="text-lg">{className}</CardTitle>
                            <p className="text-sm text-muted-foreground">Messages from teachers and students in your class</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="h-[520px] overflow-y-auto rounded-lg border bg-muted/20 p-3 space-y-3">
                        {messagesLoading ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Loading messages...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                No messages yet for your class.
                            </div>
                        ) : (
                            <>
                                {hasNextPage ? (
                                    <div className="flex justify-center pb-2">
                                        <Button variant="outline" size="sm" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                                            {isFetchingNextPage ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                            Load older messages
                                        </Button>
                                    </div>
                                ) : null}
                                {messages.map((message) => {
                                    const isMine = !!user?.id && user.id === message.sender_id
                                    return (
                                        <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] rounded-lg px-3 py-2 ${isMine ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-xs font-semibold">{isMine ? 'You' : message.sender_name}</span>
                                                    <Badge variant="outline" className="text-[10px] capitalize">
                                                        {message.sender_role || 'user'}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <p className={`text-[11px] mt-1 flex items-center gap-1 ${isMine ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(message.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    <form onSubmit={onSend} className="space-y-3">
                        <Textarea
                            placeholder="Type a message to your class..."
                            rows={3}
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            disabled={sendMutation.isPending}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={sendMutation.isPending}>
                                {sendMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                                Send
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
