"use client"

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, Printer, Calendar, ArrowLeft, User, MapPin } from 'lucide-react'
import { useStudentTimetable, useStudentTimetableConfig } from '@/hooks/useTimetableView'
import { toast } from 'sonner'

const fallbackDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const getSubjectColor = (subject: string) => {
    const colors: { [key: string]: string } = {
        'Mathematics': 'from-blue-500 to-cyan-500', 'Physics': 'from-violet-500 to-purple-500',
        'Chemistry': 'from-green-500 to-emerald-500', 'English': 'from-orange-500 to-amber-500',
        'Hindi': 'from-pink-500 to-rose-500', 'History': 'from-red-500 to-rose-500',
        'Geography': 'from-teal-500 to-cyan-500', 'Computer Science': 'from-slate-500 to-gray-500',
        'Physical Education': 'from-lime-500 to-green-500', 'Biology': 'from-emerald-500 to-green-500',
        'Science': 'from-green-500 to-emerald-500',
    }
    return colors[subject] || 'from-gray-500 to-slate-500'
}

const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const h = parseInt(hours)
    const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
    return `${h12.toString().padStart(2, '0')}:${minutes}`
}

const formatTimeSlot = (startTime: string, endTime: string) => {
    return `${formatTime(startTime)} - ${formatTime(endTime)}`
}

export default function StudentTimetablePage() {
    const router = useRouter()
    const { data: configData } = useStudentTimetableConfig()
    const { data: timetableData } = useStudentTimetable()
    const dayConfigs = useMemo(() => {
        const days = configData?.config?.days || []
        const active = days.filter(d => d.is_active).sort((a, b) => a.day_of_week - b.day_of_week)
        return active.length > 0 ? active : fallbackDays.map((d, i) => ({ day_of_week: i + 1, day_name: d, is_active: true }))
    }, [configData])
    const periodsConfig = useMemo(() => {
        return (configData?.config?.periods || []).sort((a, b) => a.period_number - b.period_number)
    }, [configData])
    const timetableEntries = useMemo(() => {
        const schedules = timetableData?.timetable || []
        return schedules.flatMap(schedule =>
            schedule.periods.map(period => ({
                ...period,
                day_of_week: schedule.day_of_week,
                day_name: schedule.day_name,
            }))
        )
    }, [timetableData])
    const days = dayConfigs.map(d => d.day_name)
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })

    // Generate time slots from periods config
    const timeSlots = useMemo(() => {
        return periodsConfig.map(p => ({
            ...p,
            display: formatTimeSlot(p.start_time, p.end_time)
        }))
    }, [periodsConfig])

    const handlePrint = () => { toast.success('Preparing print view...'); setTimeout(() => window.print(), 500) }
    const handleDownload = () => { toast.success('Downloading timetable...') }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in p-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/student/dashboard')} className="h-7 w-7 sm:h-8 sm:w-8">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">My Timetable</h1>
                        <p className="text-xs text-muted-foreground hidden sm:block">Your class schedule</p>
                    </div>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                    <Badge variant="outline" className="h-7 sm:h-8 px-2 text-xs hidden sm:flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        2025-26
                    </Badge>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 sm:h-8 px-2">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="sm" className="h-7 sm:h-8 px-2 bg-gradient-to-r from-blue-500 to-cyan-600" onClick={handleDownload}>
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
                <CardContent className="flex-1 p-0 overflow-x-auto overflow-y-hidden">
                    <div
                        className="h-full grid"
                        style={{
                            gridTemplateColumns: `minmax(80px, 100px) repeat(${periodsConfig.length}, minmax(60px, 1fr))`,
                            gridTemplateRows: `minmax(32px, 0.6fr) repeat(${dayConfigs.length}, minmax(0, 1fr))`,
                            minWidth: `${80 + periodsConfig.length * 60}px`
                        }}
                    >
                        {/* Header Row */}
                        <div className="border bg-muted flex items-center justify-center font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>Day</div>
                        {timeSlots.map((slot, i) => (
                            <div key={`header-${i}`} className="border bg-muted flex flex-col items-center justify-center text-center p-0.5">
                                <div className="font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>P{i + 1}</div>
                                <div className="text-muted-foreground hidden lg:block" style={{ fontSize: 'clamp(7px, 1vw, 11px)' }}>{slot.display}</div>
                                {slot.is_break && <Badge variant="outline" className="mt-0.5 px-0.5 hidden sm:inline-flex" style={{ fontSize: 'clamp(6px, 0.8vw, 9px)' }}>{slot.break_name || 'Break'}</Badge>}
                            </div>
                        ))}

                        {/* Data Rows */}
                        {dayConfigs.map((day) => (
                            <React.Fragment key={day.day_of_week}>
                                <div className={`border flex items-center justify-center font-bold ${day === today ? 'bg-blue-100 dark:bg-blue-950' : 'bg-muted/50'}`} style={{ fontSize: 'clamp(7px, 1.3vw, 13px)' }}>
                                    <span className={`sm:hidden ${day.day_name === today ? 'text-blue-700 dark:text-blue-300' : ''}`}>{day.day_name.slice(0, 2)}</span>
                                    <span className={`hidden sm:inline md:hidden ${day.day_name === today ? 'text-blue-700 dark:text-blue-300' : ''}`}>{day.day_name.slice(0, 3)}</span>
                                    <span className={`hidden md:inline ${day.day_name === today ? 'text-blue-700 dark:text-blue-300' : ''}`}>{day.day_name}</span>
                                    {day.day_name === today && <span className="ml-0.5 bg-blue-500 text-white px-0.5 rounded-full hidden sm:inline" style={{ fontSize: 'clamp(6px, 0.8vw, 10px)' }}>Today</span>}
                                </div>
                                {timeSlots.map((slot, index) => {
                                    const entry = timetableEntries.find(t => t.day_of_week === day.day_of_week && t.period_number === slot.period_number)

                                    if (slot.is_break) return (
                                        <div key={`${day.day_of_week}-${index}`} className="border bg-green-50 dark:bg-green-950/50 flex items-center justify-center">
                                            <div className="text-center">
                                                <span className="hidden sm:inline" style={{ fontSize: 'clamp(12px, 2vw, 24px)' }}>🍽️</span>
                                                <p className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: 'clamp(6px, 1vw, 11px)' }}>{slot.break_name || 'BREAK'}</p>
                                            </div>
                                        </div>
                                    )

                                    return (
                                        <div key={`${day.day_of_week}-${index}`} className="border p-0.5 flex items-center justify-center">
                                            {entry ? (
                                                <div className={`w-full h-full rounded bg-gradient-to-br ${getSubjectColor(entry.subject_name || '')} text-white flex flex-col items-center justify-center p-0.5 shadow-sm`}>
                                                    <p className="font-bold truncate w-full text-center drop-shadow-sm" style={{ fontSize: 'clamp(6px, 1.2vw, 13px)' }}>{entry.subject_name}</p>
                                                    <div className="hidden lg:flex items-center justify-center gap-0.5 opacity-90 font-medium w-full" style={{ fontSize: 'clamp(6px, 0.9vw, 10px)' }}>
                                                        <div className="flex items-center gap-0.5 truncate">
                                                            <User className="h-2 w-2" />
                                                            <span className="truncate">{entry.teacher_name?.split(' ')[0]}</span>
                                                        </div>
                                                        <span className="opacity-60">|</span>
                                                        <div className="flex items-center gap-0.5">
                                                            <MapPin className="h-2 w-2" />
                                                            <span>{entry.room_number || '-'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : <span className="text-muted-foreground" style={{ fontSize: 'clamp(6px, 1vw, 11px)' }}>-</span>}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
