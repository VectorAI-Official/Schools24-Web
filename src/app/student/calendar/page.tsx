"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { CalendarDays, Clock, MapPin, ArrowLeft } from 'lucide-react'
import { mockEvents, Event } from '@/lib/mockData'
import { useRouter } from 'next/navigation'

export default function StudentCalendarPage() {
    const router = useRouter()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const events = mockEvents

    const eventTypes = [
        { value: 'event', label: 'Event', color: 'bg-purple-500' },
        { value: 'exam', label: 'Exam', color: 'bg-red-500' },
        { value: 'holiday', label: 'Holiday', color: 'bg-green-500' },
        { value: 'meeting', label: 'Meeting', color: 'bg-blue-500' },
        { value: 'sports', label: 'Sports', color: 'bg-yellow-500' },
    ]

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'exam': return 'bg-red-500'
            case 'holiday': return 'bg-green-500'
            case 'meeting': return 'bg-blue-500'
            case 'sports': return 'bg-yellow-500'
            default: return 'bg-purple-500'
        }
    }

    const getBadgeVariant = (type: string): "destructive" | "success" | "default" | "warning" | "secondary" => {
        switch (type) {
            case 'exam': return 'destructive'
            case 'holiday': return 'success'
            case 'meeting': return 'default'
            case 'sports': return 'warning'
            default: return 'secondary'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Event Calendar</h1>
                        <p className="text-muted-foreground mt-1">View school events, holidays, and important dates</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Calendar */}
                <Card className="lg:col-span-1 overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-white">Calendar</CardTitle>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <CalendarDays className="h-6 w-6 text-white" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="bg-gradient-to-br from-background to-muted/30 rounded-xl p-2 border shadow-inner">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="w-full calendar-with-events"
                                modifiers={{
                                    hasEventType: events.map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                    hasExam: events.filter(e => e.type === 'exam').map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                    hasHoliday: events.filter(e => e.type === 'holiday').map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                    hasMeeting: events.filter(e => e.type === 'meeting').map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                    hasSports: events.filter(e => e.type === 'sports').map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                    hasEvent: events.filter(e => e.type === 'event').map(e => {
                                        const [year, month, day] = e.date.split('-')
                                        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
                                    }),
                                }}
                                modifiersClassNames={{
                                    hasEventType: 'has-event-marker',
                                    hasExam: 'has-exam-event',
                                    hasHoliday: 'has-holiday-event',
                                    hasMeeting: 'has-meeting-event',
                                    hasSports: 'has-sports-event',
                                    hasEvent: 'has-general-event',
                                }}
                            />
                        </div>

                        {/* Selected Date Display with Events */}
                        {date && (() => {
                            // Format the selected date to YYYY-MM-DD to match event dates
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const selectedDateStr = `${year}-${month}-${day}`

                            const eventsOnDate = events.filter(e => e.date === selectedDateStr)

                            return (
                                <div className="mt-4 space-y-4">
                                    {/* Selected Date Header */}
                                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/50 dark:border-indigo-800/50">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-1">Selected Date</p>
                                        <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            {date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {eventsOnDate.length === 0 ? 'No events scheduled' :
                                                eventsOnDate.length === 1 ? '1 event scheduled' :
                                                    `${eventsOnDate.length} events scheduled`}
                                        </p>
                                    </div>

                                    {/* Events for Selected Date */}
                                    {eventsOnDate.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-1">
                                                <p className="text-sm font-bold text-foreground flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-primary" />
                                                    Events Today
                                                </p>
                                                <Badge variant="secondary" className="text-xs">
                                                    {eventsOnDate.length}
                                                </Badge>
                                            </div>
                                            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                                                {eventsOnDate.map((event, index) => (
                                                    <div
                                                        key={event.id}
                                                        className="group relative p-3 rounded-xl border bg-gradient-to-br from-card to-card/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-slide-in-left"
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        {/* Color accent bar */}
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${getTypeColor(event.type)}`} />

                                                        <div className="pl-3">
                                                            {/* Event header */}
                                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                                <h4 className="font-bold text-sm leading-tight flex-1">{event.title}</h4>
                                                                <Badge
                                                                    variant={getBadgeVariant(event.type)}
                                                                    className="text-xs shrink-0 shadow-sm"
                                                                >
                                                                    {event.type}
                                                                </Badge>
                                                            </div>

                                                            {/* Event details */}
                                                            <div className="space-y-1.5">
                                                                <div className="flex items-center gap-2 text-xs">
                                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                        <Clock className="h-3.5 w-3.5 text-primary" />
                                                                        <span className="font-medium">{event.time}</span>
                                                                    </div>
                                                                    {event.location && (
                                                                        <>
                                                                            <span className="text-muted-foreground">•</span>
                                                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                                                                <span className="font-medium truncate">{event.location}</span>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>

                                                                {event.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                                                        {event.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Hover indicator */}
                                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                    </CardContent>
                </Card>

                {/* Events List */}
                <Card className="lg:col-span-2">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">Upcoming Events</CardTitle>
                                <CardDescription className="mt-1">All scheduled events and activities</CardDescription>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                                <CalendarDays className="h-4 w-4 text-primary" />
                                <span className="text-sm font-semibold text-primary">{events.length} Events</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {events.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 mb-4">
                                        <CalendarDays className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No Events Yet</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mb-4">
                                        Check back later for upcoming school events.
                                    </p>
                                </div>
                            ) : (
                                events.map((event) => (
                                    <div
                                        key={event.id}
                                        className="group relative flex gap-4 p-4 rounded-xl border bg-card hover:bg-accent/5 hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
                                    >
                                        {/* Color indicator */}
                                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl ${getTypeColor(event.type)}`} />

                                        {/* Event icon */}
                                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl text-white ${getTypeColor(event.type)} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <CalendarDays className="h-7 w-7" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-lg mb-1 truncate">{event.title}</h3>
                                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{event.description}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge variant={getBadgeVariant(event.type)} className="text-xs font-semibold">
                                                        {event.type}
                                                    </Badge>
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <CalendarDays className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    <span className="font-medium">{event.time}</span>
                                                </div>
                                                {event.location && (
                                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                                        <MapPin className="h-4 w-4 text-primary" />
                                                        <span className="font-medium truncate">{event.location}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
