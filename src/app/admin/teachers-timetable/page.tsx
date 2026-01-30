"use client"

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Printer, Calendar, Edit, Trash2, Save, User, MapPin, Settings, Clock } from 'lucide-react'
import { mockTeachers, TimetableSlot } from '@/lib/mockData'
import { useTimetable } from '@/lib/useTimetable'
import { PeriodConfig } from '@/lib/timetableStore'
import { toast } from 'sonner'

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const classes = ['6-A', '6-B', '7-A', '7-B', '8-A', '8-B', '9-A', '9-B', '10-A', '10-B']

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

export default function TeachersTimetablePage() {
    const [selectedTeacherId, setSelectedTeacherId] = useState('1')
    const { timetable, updateTimetable, periodsConfig, updatePeriodsConfig } = useTimetable('admin')
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isPeriodsDialogOpen, setIsPeriodsDialogOpen] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<{ day: string, periodIndex: number, entry: TimetableSlot | undefined } | null>(null)
    const [formData, setFormData] = useState({ class: '', subject: '', room: '' })
    const [tempPeriodsConfig, setTempPeriodsConfig] = useState(periodsConfig)
    const selectedTeacher = useMemo(() => mockTeachers.find(t => t.id === selectedTeacherId), [selectedTeacherId])

    // Generate time slots from periods config
    const timeSlots = useMemo(() => {
        return periodsConfig.periods.map(p => ({
            ...p,
            display: formatTimeSlot(p.startTime, p.endTime)
        }))
    }, [periodsConfig])

    const handlePrint = () => { window.print(); toast.success('Print dialog opened') }
    const handleExport = () => { toast.success('Export completed') }

    const handleSlotClick = (day: string, periodIndex: number, entry: TimetableSlot | undefined) => {
        const period = periodsConfig.periods[periodIndex]
        if (period.isBreak) return
        setSelectedSlot({ day, periodIndex, entry })
        setFormData({ class: entry?.class || '', subject: entry?.subject || '', room: entry?.room || '' })
        setIsEditDialogOpen(true)
    }

    const handleSaveSlot = () => {
        if (!selectedSlot || !selectedTeacher) return
        const period = periodsConfig.periods[selectedSlot.periodIndex]
        let newTimetable = selectedSlot.entry ? timetable.filter(t => t.id !== selectedSlot.entry!.id) : [...timetable]
        if (formData.subject && formData.class) {
            newTimetable.push({
                id: Math.random().toString(36).substr(2, 9),
                day: selectedSlot.day,
                startTime: period.startTime,
                endTime: period.endTime,
                subject: formData.subject,
                teacher: selectedTeacher.name,
                class: formData.class,
                room: formData.room || 'TBD'
            })
            toast.success('Timetable updated')
        }
        updateTimetable?.(newTimetable)
        setIsEditDialogOpen(false)
    }

    const handleDeleteSlot = () => {
        if (!selectedSlot?.entry) return
        updateTimetable?.(timetable.filter(t => t.id !== selectedSlot.entry!.id))
        setIsEditDialogOpen(false)
        toast.success('Slot cleared')
    }

    const openPeriodsDialog = () => {
        setTempPeriodsConfig({ ...periodsConfig })
        setIsPeriodsDialogOpen(true)
    }

    const handlePeriodCountChange = (count: number) => {
        const newPeriods: PeriodConfig[] = []
        let currentTime = 8 * 60

        for (let i = 0; i < count; i++) {
            const existingPeriod = tempPeriodsConfig.periods[i]
            if (existingPeriod) {
                newPeriods.push(existingPeriod)
            } else {
                const startHour = Math.floor(currentTime / 60)
                const startMin = currentTime % 60
                const endTime = currentTime + 45
                const endHour = Math.floor(endTime / 60)
                const endMin = endTime % 60

                newPeriods.push({
                    id: i + 1,
                    startTime: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
                    endTime: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
                    isBreak: false
                })
            }
            currentTime += 45
        }

        setTempPeriodsConfig({ periodCount: count, periods: newPeriods })
    }

    const handlePeriodUpdate = (index: number, field: keyof PeriodConfig, value: string | boolean) => {
        const newPeriods = [...tempPeriodsConfig.periods]
        newPeriods[index] = { ...newPeriods[index], [field]: value }
        setTempPeriodsConfig({ ...tempPeriodsConfig, periods: newPeriods })
    }

    const savePeriodsConfig = () => {
        if (updatePeriodsConfig) {
            updatePeriodsConfig(tempPeriodsConfig)
            toast.success('Periods configuration saved', { description: `Updated to ${tempPeriodsConfig.periodCount} periods` })
        }
        setIsPeriodsDialogOpen(false)
    }

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in p-1 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 flex-shrink-0">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Teachers Timetable</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">View and manage teacher schedules</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                    <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                        <SelectTrigger className="w-[90px] sm:w-[100px] md:w-[140px] h-7 sm:h-8 text-xs">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>{mockTeachers.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                    </Select>
                    <Badge variant="outline" className="h-7 sm:h-8 px-2 text-xs hidden sm:flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />2025-26
                    </Badge>
                    <Button variant="outline" size="sm" onClick={openPeriodsDialog} className="h-7 sm:h-8 px-2">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 sm:h-8 px-2">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button size="sm" onClick={handleExport} className="h-7 sm:h-8 px-2 bg-gradient-to-r from-purple-500 to-pink-600">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Card className="border-0 shadow-lg flex-1 flex flex-col overflow-hidden min-h-0">
                <CardContent className="flex-1 p-0 overflow-x-auto overflow-y-hidden">
                    <div
                        className="h-full grid"
                        style={{
                            gridTemplateColumns: `minmax(80px, 100px) repeat(${periodsConfig.periodCount}, minmax(60px, 1fr))`,
                            gridTemplateRows: `minmax(32px, 0.6fr) repeat(${days.length}, minmax(0, 1fr))`,
                            minWidth: `${80 + periodsConfig.periodCount * 60}px`
                        }}
                    >
                        <div className="border bg-muted flex items-center justify-center font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>Day</div>
                        {timeSlots.map((slot, i) => (
                            <div key={`header-${i}`} className="border bg-muted flex flex-col items-center justify-center text-center p-0.5">
                                <div className="font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>P{i + 1}</div>
                                <div className="text-muted-foreground hidden lg:block" style={{ fontSize: 'clamp(7px, 1vw, 11px)' }}>{slot.display}</div>
                            </div>
                        ))}
                        {days.map((day) => (
                            <React.Fragment key={day}>
                                <div className="border bg-muted/50 flex items-center justify-center font-bold" style={{ fontSize: 'clamp(7px, 1.3vw, 13px)' }}>
                                    <span className="sm:hidden">{day.slice(0, 2)}</span>
                                    <span className="hidden sm:inline md:hidden">{day.slice(0, 3)}</span>
                                    <span className="hidden md:inline">{day}</span>
                                </div>
                                {timeSlots.map((slot, index) => {
                                    const entry = timetable.find(t => t.day === day && t.startTime === slot.startTime && t.teacher === selectedTeacher?.name)

                                    if (slot.isBreak) return (
                                        <div key={`${day}-${index}`} className="border bg-green-50 dark:bg-green-950/50 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: 'clamp(6px, 1vw, 11px)' }}>{slot.breakName || 'BREAK'}</p>
                                            </div>
                                        </div>
                                    )

                                    return (
                                        <div key={`${day}-${index}`} className="border p-0.5 flex items-center justify-center cursor-pointer hover:bg-muted/50 group" onClick={() => handleSlotClick(day, index, entry)}>
                                            {entry ? (
                                                <div className={`w-full h-full rounded bg-gradient-to-br ${getSubjectColor(entry.subject)} text-white flex flex-col items-center justify-center p-0.5 shadow-sm`}>
                                                    <p className="font-bold truncate w-full text-center drop-shadow-sm" style={{ fontSize: 'clamp(6px, 1.2vw, 13px)' }}>{entry.subject}</p>
                                                    <div className="hidden lg:flex items-center justify-center gap-0.5 opacity-90 font-medium w-full" style={{ fontSize: 'clamp(6px, 0.9vw, 10px)' }}>
                                                        <div className="flex items-center gap-0.5 truncate"><User className="h-2 w-2" /><span>Class {entry.class}</span></div>
                                                        <span className="opacity-60">|</span>
                                                        <div className="flex items-center gap-0.5"><MapPin className="h-2 w-2" /><span>{entry.room}</span></div>
                                                    </div>
                                                </div>
                                            ) : <Badge variant="secondary" className="px-0.5" style={{ fontSize: 'clamp(6px, 0.9vw, 9px)' }}>Free</Badge>}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSlot?.entry ? 'Edit Slot' : 'Assign Class'}</DialogTitle>
                        <DialogDescription>{selectedSlot?.day} • {selectedSlot && timeSlots[selectedSlot.periodIndex]?.display}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Class</Label>
                            <Select value={formData.class} onValueChange={(v) => setFormData({ ...formData, class: v })}>
                                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                                <SelectContent>{classes.map((c) => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2"><Label>Subject</Label><Input placeholder="e.g. Mathematics" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} /></div>
                        <div className="grid gap-2"><Label>Room</Label><Input placeholder="e.g. 101" value={formData.room} onChange={(e) => setFormData({ ...formData, room: e.target.value })} /></div>
                    </div>
                    <DialogFooter className="gap-2">
                        {selectedSlot?.entry && <Button variant="destructive" onClick={handleDeleteSlot} className="sm:mr-auto"><Trash2 className="mr-2 h-4 w-4" />Clear</Button>}
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSlot}><Save className="mr-2 h-4 w-4" />Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Periods Configuration Dialog */}
            <Dialog open={isPeriodsDialogOpen} onOpenChange={setIsPeriodsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Clock className="h-5 w-5" />
                            Configure Periods
                        </DialogTitle>
                        <DialogDescription>
                            Set the number of periods and their timings for the timetable
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Number of Periods</Label>
                            <Select
                                value={tempPeriodsConfig.periodCount.toString()}
                                onValueChange={(v) => handlePeriodCountChange(parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                        <SelectItem key={n} value={n.toString()}>{n} Periods</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            <Label className="text-sm font-medium">Period Settings</Label>
                            {tempPeriodsConfig.periods.map((period, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/50 rounded-lg">
                                    <div className="col-span-1 font-bold text-sm text-center">P{index + 1}</div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={period.startTime}
                                            onChange={(e) => handlePeriodUpdate(index, 'startTime', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-1 text-center text-muted-foreground">to</div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={period.endTime}
                                            onChange={(e) => handlePeriodUpdate(index, 'endTime', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            id={`break-${index}`}
                                            checked={period.isBreak}
                                            onChange={(e) => handlePeriodUpdate(index, 'isBreak', e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor={`break-${index}`} className="text-xs">Break</Label>
                                    </div>
                                    <div className="col-span-2">
                                        {period.isBreak && (
                                            <Input
                                                placeholder="Name"
                                                value={period.breakName || ''}
                                                onChange={(e) => handlePeriodUpdate(index, 'breakName', e.target.value)}
                                                className="h-8 text-xs"
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPeriodsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={savePeriodsConfig} className="bg-gradient-to-r from-purple-500 to-pink-600">
                            <Save className="mr-2 h-4 w-4" />
                            Save Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
