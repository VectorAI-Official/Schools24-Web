"use client"

import { getSubjectColor } from '@/lib/constants'

import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Download, Printer, Calendar, Plus, Edit, Trash2, Save, User, MapPin, Settings, Clock, BookOpen, Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useAuth } from '@/contexts/AuthContext'
import { useClasses } from '@/hooks/useClasses'
import { sortSchoolClasses } from '@/lib/classOrdering'
import { useTeachers } from '@/hooks/useAdminTeachers'
import { useClassSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject, type CreateSubjectRequest } from '@/hooks/useClassSubjects'
import { useSubjects } from '@/hooks/useSubjects'
import {
    useAdminTimetableConfig,
    useUpdateTimetableConfig,
    useClassTimetable,
    useUpsertTimetableSlot,
    useDeleteTimetableSlot,
    TimetablePeriodConfig
} from '@/hooks/useAdminTimetable'
import { toast } from 'sonner'

const EMPTY_SUBJECTS: { id: string; name: string; code: string; description?: string | null; grade_levels?: number[]; credits?: number; is_optional?: boolean }[] = []

const getCurrentAcademicYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    if (month < 4) {
        return `${year - 1}-${year}`
    }
    return `${year}-${year + 1}`
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

const getDisplayClassLabel = (cls: { name?: string | null; grade?: number | null; section?: string | null }) => {
    const baseName = (cls.name || '').trim() || (typeof cls.grade === 'number' ? `Class ${cls.grade}` : 'Class')
    const section = (cls.section || '').trim()
    if (!section) return baseName

    const upperBase = baseName.toUpperCase()
    const upperSection = section.toUpperCase()
    if (upperBase.endsWith(`-${upperSection}`) || upperBase.endsWith(` ${upperSection}`)) {
        return baseName
    }
    return `${baseName}-${section}`
}

export default function StudentsTimetablePage() {
    const searchParams = useSearchParams()
    const { user, isLoading } = useAuth()
    const isSuperAdmin = user?.role === 'super_admin'
    const schoolId = searchParams.get('school_id') || undefined
    const canLoad = !!user && !isLoading && (!isSuperAdmin || !!schoolId)
    const academicYear = getCurrentAcademicYear()

    const { data: classesData } = useClasses(academicYear)
    const classOptions = useMemo(() => sortSchoolClasses(classesData?.classes || []), [classesData?.classes])
    const [selectedClassId, setSelectedClassId] = useState('')
    const effectiveSelectedClassId = selectedClassId || classOptions[0]?.id || ''

    const { data: configData } = useAdminTimetableConfig(schoolId, { enabled: canLoad })
    const updateConfig = useUpdateTimetableConfig()
    const { data: classTimetableData } = useClassTimetable(effectiveSelectedClassId, academicYear, schoolId, { enabled: canLoad && !!effectiveSelectedClassId })
    const upsertSlot = useUpsertTimetableSlot()
    const deleteSlot = useDeleteTimetableSlot()

    const { data: teachersData } = useTeachers('', 200, schoolId, undefined, undefined, { enabled: canLoad })
    const teachers = useMemo(() => teachersData?.pages.flatMap(page => page.teachers) || [], [teachersData])
    const { data: classSubjectsData } = useClassSubjects(effectiveSelectedClassId, { enabled: canLoad && !!effectiveSelectedClassId })
    const classSubjects = useMemo(() => classSubjectsData?.subjects || EMPTY_SUBJECTS, [classSubjectsData?.subjects])
    const { data: allSubjectsData } = useSubjects({ enabled: canLoad, schoolId })
    const allSubjects = useMemo(() => allSubjectsData?.subjects || EMPTY_SUBJECTS, [allSubjectsData?.subjects])
    const createSubject = useCreateSubject(effectiveSelectedClassId)
    const updateSubject = useUpdateSubject(effectiveSelectedClassId)
    const deleteSubject = useDeleteSubject(effectiveSelectedClassId)

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isPeriodsDialogOpen, setIsPeriodsDialogOpen] = useState(false)
    const [isSubjectsDialogOpen, setIsSubjectsDialogOpen] = useState(false)
    const [isSubjectFormOpen, setIsSubjectFormOpen] = useState(false)
    const [editingSubject, setEditingSubject] = useState<(typeof classSubjects)[number] | null>(null)
    const [selectedSlot, setSelectedSlot] = useState<{ dayOfWeek: number; periodNumber: number; entryId?: string } | null>(null)
    const [formData, setFormData] = useState({
        subjectId: '',
        teacherId: '',
        room: ''
    })

    const [subjectForm, setSubjectForm] = useState<CreateSubjectRequest>({
        name: '',
        code: '',
        description: null,
        grade_levels: [],
        credits: 1,
        is_optional: false
    })

    const fallbackDayConfigs = useMemo(() => ([
        { day_of_week: 1, day_name: 'Monday', is_active: true },
        { day_of_week: 2, day_name: 'Tuesday', is_active: true },
        { day_of_week: 3, day_name: 'Wednesday', is_active: true },
        { day_of_week: 4, day_name: 'Thursday', is_active: true },
        { day_of_week: 5, day_name: 'Friday', is_active: true },
        { day_of_week: 6, day_name: 'Saturday', is_active: true }
    ]), [])

    const dayConfigs = useMemo(() => {
        const days = configData?.config?.days || []
        const active = days.filter(d => d.is_active).sort((a, b) => a.day_of_week - b.day_of_week)
        return active.length > 0 ? active : fallbackDayConfigs
    }, [configData, fallbackDayConfigs])

    const periodsConfig = useMemo(() => {
        return (configData?.config?.periods || []).sort((a, b) => a.period_number - b.period_number)
    }, [configData])

    const timetableEntries = classTimetableData?.timetable || []
    const selectedClass = useMemo(() => classOptions.find(c => c.id === effectiveSelectedClassId), [classOptions, effectiveSelectedClassId])
    const selectedClassLabel = selectedClass ? getDisplayClassLabel(selectedClass) : ''
    const selectedTeacher = useMemo(
        () => teachers.find((teacher) => teacher.id === formData.teacherId),
        [teachers, formData.teacherId]
    )
    const teacherSubjectOptionsFromAll = useMemo(() => {
        if (!selectedTeacher || !selectedTeacher.subjects || selectedTeacher.subjects.length === 0) {
            return EMPTY_SUBJECTS
        }
        const selectedSubjectSet = new Set(selectedTeacher.subjects.map((subject) => subject.trim().toLowerCase()))
        return allSubjects.filter((subject) => {
            const subjectName = subject.name.trim().toLowerCase()
            const subjectCode = subject.code.trim().toLowerCase()
            const subjectID = subject.id.trim().toLowerCase()
            return selectedSubjectSet.has(subjectName) || selectedSubjectSet.has(subjectCode) || selectedSubjectSet.has(subjectID)
        })
    }, [selectedTeacher, allSubjects])
    const teacherSubjectOptions = useMemo(() => {
        if (!selectedTeacher || !selectedTeacher.subjects || selectedTeacher.subjects.length === 0) {
            return classSubjects
        }

        const selectedSubjectSet = new Set(selectedTeacher.subjects.map((subject) => subject.trim().toLowerCase()))
        return classSubjects.filter((subject) => {
            const subjectName = subject.name.trim().toLowerCase()
            const subjectCode = subject.code.trim().toLowerCase()
            const subjectID = subject.id.trim().toLowerCase()
            return selectedSubjectSet.has(subjectName) || selectedSubjectSet.has(subjectCode) || selectedSubjectSet.has(subjectID)
        })
    }, [selectedTeacher, classSubjects])

    const availableSubjectOptions = useMemo(() => {
        const hasTeacherScopedSubjects = !!selectedTeacher && !!selectedTeacher.subjects && selectedTeacher.subjects.length > 0
        if (hasTeacherScopedSubjects) {
            if (teacherSubjectOptions.length > 0) return teacherSubjectOptions
            if (teacherSubjectOptionsFromAll.length > 0) return teacherSubjectOptionsFromAll
            return EMPTY_SUBJECTS
        }
        if (teacherSubjectOptions.length > 0) return teacherSubjectOptions
        if (classSubjects.length > 0) return classSubjects
        return allSubjects
    }, [selectedTeacher, teacherSubjectOptions, teacherSubjectOptionsFromAll, classSubjects, allSubjects])
    const effectiveSubjectId = useMemo(
        () => (availableSubjectOptions.some((subject) => subject.id === formData.subjectId) ? formData.subjectId : ''),
        [availableSubjectOptions, formData.subjectId]
    )

    const [tempConfig, setTempConfig] = useState({
        days: dayConfigs,
        periods: periodsConfig
    })

    // Generate time slots from periods config
    const timeSlots = useMemo(() => {
        return periodsConfig.map(p => ({
            ...p,
            display: formatTimeSlot(p.start_time, p.end_time)
        }))
    }, [periodsConfig])

    const handlePrint = () => {
        window.print()
        toast.success('Print dialog opened', { description: `Printing timetable for ${selectedClassLabel}` })
    }

    const handleExport = () => {
        const csvContent = [
            ['Time', ...dayConfigs.map(d => d.day_name)].join(','),
            ...timeSlots.map(slot =>
                [slot.display, ...dayConfigs.map(day => {
                    const entry = timetableEntries.find(t => t.day_of_week === day.day_of_week && t.period_number === slot.period_number)
                    return entry ? `${entry.subject_name || ''} - ${entry.teacher_name || ''}` : '-'
                })].join(',')
            )
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `timetable-${selectedClassLabel}.csv`
        a.click()
        toast.success('Export completed', { description: `Timetable for ${selectedClassLabel} exported to CSV` })
    }

    const handleSlotClick = (dayOfWeek: number, periodIndex: number) => {
        const period = periodsConfig[periodIndex]
        if (!period || period.is_break) return
        const entry = timetableEntries.find(t => t.day_of_week === dayOfWeek && t.period_number === period.period_number)
        setSelectedSlot({ dayOfWeek, periodNumber: period.period_number, entryId: entry?.id })
        setFormData({
            subjectId: entry?.subject_id || '',
            teacherId: entry?.teacher_id || '',
            room: entry?.room_number || ''
        })
        setIsEditDialogOpen(true)
    }

    const handleSaveSlot = () => {
        if (!selectedSlot || !effectiveSelectedClassId) return
        const period = periodsConfig.find(p => p.period_number === selectedSlot.periodNumber)
        if (!period) return

        if (!effectiveSubjectId || !formData.teacherId) {
            toast.error('Please select both subject and teacher')
            return
        }

        upsertSlot.mutate({
            payload: {
                class_id: effectiveSelectedClassId,
                day_of_week: selectedSlot.dayOfWeek,
                period_number: selectedSlot.periodNumber,
                subject_id: effectiveSubjectId,
                teacher_id: formData.teacherId,
                start_time: period.start_time,
                end_time: period.end_time,
                room_number: formData.room || undefined,
                academic_year: academicYear,
            },
            schoolId,
        }, {
            onSuccess: () => {
                setIsEditDialogOpen(false)
            }
        })
    }

    const handleDeleteSlot = () => {
        if (!selectedSlot || !effectiveSelectedClassId) return
        deleteSlot.mutate({
            classId: effectiveSelectedClassId,
            dayOfWeek: selectedSlot.dayOfWeek,
            periodNumber: selectedSlot.periodNumber,
            academicYear,
            schoolId,
        }, {
            onSuccess: () => setIsEditDialogOpen(false)
        })
    }

    const openPeriodsDialog = () => {
        setTempConfig({ days: dayConfigs, periods: periodsConfig })
        setIsPeriodsDialogOpen(true)
    }

    const handlePeriodCountChange = (count: number) => {
        const newPeriods: TimetablePeriodConfig[] = []
        let currentTime = 8 * 60

        for (let i = 0; i < count; i++) {
            const periodNumber = i + 1
            const existingPeriod = tempConfig.periods.find(p => p.period_number === periodNumber)
            if (existingPeriod) {
                newPeriods.push({ ...existingPeriod, period_number: periodNumber })
            } else {
                const startHour = Math.floor(currentTime / 60)
                const startMin = currentTime % 60
                const endTime = currentTime + 45
                const endHour = Math.floor(endTime / 60)
                const endMin = endTime % 60

                newPeriods.push({
                    period_number: periodNumber,
                    start_time: `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`,
                    end_time: `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`,
                    is_break: false,
                    break_name: null,
                })
            }
            currentTime += 45
        }

        setTempConfig({ ...tempConfig, periods: newPeriods })
    }

    const handlePeriodUpdate = (index: number, field: keyof TimetablePeriodConfig, value: string | boolean) => {
        const newPeriods = [...tempConfig.periods]
        newPeriods[index] = { ...newPeriods[index], [field]: value }
        setTempConfig({ ...tempConfig, periods: newPeriods })
    }

    const toggleDayActive = (dayOfWeek: number) => {
        const newDays = tempConfig.days.map(day =>
            day.day_of_week === dayOfWeek ? { ...day, is_active: !day.is_active } : day
        )
        setTempConfig({ ...tempConfig, days: newDays })
    }
    const handleOpenSubjectForm = (subject?: (typeof classSubjects)[number]) => {
        if (subject) {
            setEditingSubject(subject)
            setSubjectForm({
                name: subject.name,
                code: subject.code,
                description: subject.description,
                grade_levels: subject.grade_levels || [],
                credits: subject.credits || 1,
                is_optional: subject.is_optional || false
            })
        } else {
            setEditingSubject(null)
            // Auto-populate grade_levels with the selected class's grade
            const defaultGradeLevels = selectedClass?.grade ? [selectedClass.grade] : []
            setSubjectForm({
                name: '',
                code: '',
                description: null,
                grade_levels: defaultGradeLevels,
                credits: 1,
                is_optional: false
            })
        }
        setIsSubjectFormOpen(true)
    }

    const handleSaveSubject = async () => {
        if (!subjectForm.name || !subjectForm.code) {
            toast.error('Please fill in required fields')
            return
        }

        // Validate grade_levels: must not be empty and must include current class grade
        if (!subjectForm.grade_levels || subjectForm.grade_levels.length === 0) {
            toast.error('Class levels cannot be empty', {
                description: 'Please specify at least one class level'
            })
            return
        }

        // Ensure current class grade is included
        const currentGrade = selectedClass?.grade
        if (currentGrade && !subjectForm.grade_levels.includes(currentGrade)) {
            toast.error(`Class ${currentGrade} must be included`, {
                description: 'The subject must be available for the current class'
            })
            return
        }

        try {
            if (editingSubject) {
                await updateSubject.mutateAsync({ id: editingSubject.id, data: subjectForm })
            } else {
                await createSubject.mutateAsync(subjectForm)
            }
            setIsSubjectFormOpen(false)
        } catch {
            // Error handled by mutation
        }
    }

    const handleDeleteSubject = async (subjectId: string) => {
        if (!confirm('Are you sure you want to delete this subject?')) return
        try {
            await deleteSubject.mutateAsync(subjectId)
        } catch {
            // Error handled by mutation
        }
    }
    const savePeriodsConfig = () => {
        updateConfig.mutate({
            payload: { days: tempConfig.days, periods: tempConfig.periods },
            schoolId,
        }, {
            onSuccess: () => setIsPeriodsDialogOpen(false)
        })
    }

    const selectedDayLabel = selectedSlot
        ? dayConfigs.find(d => d.day_of_week === selectedSlot.dayOfWeek)?.day_name
        : ''
    const selectedPeriodDisplay = selectedSlot
        ? timeSlots.find(p => p.period_number === selectedSlot.periodNumber)?.display
        : ''

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col animate-fade-in p-1 overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 flex-shrink-0">
                <div>
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Students Timetable</h1>
                    <p className="text-xs text-muted-foreground hidden sm:block">View and manage class timetables</p>
                </div>
                <div className="flex items-center gap-1 flex-wrap w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => setIsSubjectsDialogOpen(true)} disabled={!effectiveSelectedClassId}>
                        <BookOpen className="mr-1.5 h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Subjects</span>
                    </Button>
                    <Select value={effectiveSelectedClassId} onValueChange={setSelectedClassId}>
                        <SelectTrigger className="w-full sm:w-[100px] md:w-[120px] h-7 sm:h-8 text-xs">
                            <SelectValue placeholder="Select Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classOptions.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                    {getDisplayClassLabel(cls)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <TooltipProvider delayDuration={100}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground cursor-help shrink-0" />
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                                Make sure to set up classes in &ldquo;Class Management&rdquo; from the User Management page first.
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <Badge variant="outline" className="h-7 sm:h-8 px-2 text-xs hidden sm:flex items-center">
                        <Calendar className="mr-1 h-3 w-3" />
                        2025-26
                    </Badge>
                    <Button variant="outline" size="sm" onClick={openPeriodsDialog} className="h-7 sm:h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                        <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={handlePrint} className="h-7 sm:h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all">
                        <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleExport}
                        className="h-7 sm:h-8 px-2 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 border-0 shadow-lg shadow-blue-500/20"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Timetable Card */}
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
                        {timeSlots.map((slot, index) => (
                            <div key={`header-${index}`} className="border bg-muted flex flex-col items-center justify-center text-center p-0.5">
                                <div className="font-bold" style={{ fontSize: 'clamp(8px, 1.5vw, 14px)' }}>P{index + 1}</div>
                                <div className="text-muted-foreground hidden lg:block" style={{ fontSize: 'clamp(7px, 1vw, 11px)' }}>{slot.display}</div>
                            </div>
                        ))}

                        {/* Data Rows */}
                        {dayConfigs.map((day) => (
                            <React.Fragment key={day.day_of_week}>
                                <div className="border bg-muted/50 flex items-center justify-center font-bold" style={{ fontSize: 'clamp(7px, 1.3vw, 13px)' }}>
                                    <span className="sm:hidden">{day.day_name.slice(0, 2)}</span>
                                    <span className="hidden sm:inline md:hidden">{day.day_name.slice(0, 3)}</span>
                                    <span className="hidden md:inline">{day.day_name}</span>
                                </div>
                                {timeSlots.map((slot, index) => {
                                    const timetableEntry = timetableEntries.find(
                                        t => t.day_of_week === day.day_of_week && t.period_number === slot.period_number
                                    )

                                    if (slot.is_break) return (
                                        <div key={`${day.day_name}-${index}`} className="border bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 flex items-center justify-center">
                                            <div className="text-center">
                                                <p className="text-green-600 dark:text-green-400 font-bold" style={{ fontSize: 'clamp(6px, 1vw, 11px)' }}>{slot.break_name || 'BREAK'}</p>
                                            </div>
                                        </div>
                                    )

                                    return (
                                        <div
                                            key={`${day.day_name}-${index}`}
                                            className="border p-0.5 flex items-center justify-center cursor-pointer hover:bg-muted/50 transition-all group"
                                            onClick={() => handleSlotClick(day.day_of_week, index)}
                                        >
                                            {timetableEntry ? (
                                                <div className={`w-full h-full rounded bg-gradient-to-br ${getSubjectColor(timetableEntry.subject_name || '')} text-white flex flex-col items-center justify-center p-0.5 relative shadow-sm`}>
                                                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Edit className="h-2 w-2 md:h-3 md:w-3 text-white" />
                                                    </div>
                                                    <p className="font-bold truncate w-full text-center drop-shadow-sm" style={{ fontSize: 'clamp(6px, 1.2vw, 13px)' }}>{timetableEntry.subject_name}</p>
                                                    <div className="hidden lg:flex items-center justify-center gap-0.5 opacity-90 font-medium w-full" style={{ fontSize: 'clamp(6px, 0.9vw, 10px)' }}>
                                                        <div className="flex items-center gap-0.5 truncate">
                                                            <User className="h-2 w-2" />
                                                            <span className="truncate">{timetableEntry.teacher_name?.split(' ')[0] || ''}</span>
                                                        </div>
                                                        <span className="opacity-60">|</span>
                                                        <div className="flex items-center gap-0.5">
                                                            <MapPin className="h-2 w-2" />
                                                            <span>{timetableEntry.room_number || ''}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-blue-500 font-medium" style={{ fontSize: 'clamp(6px, 1vw, 11px)' }}>
                                                    <Plus className="h-3 w-3" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </React.Fragment>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedSlot?.entryId ? 'Edit Timetable Slot' : 'Add Timetable Slot'}</DialogTitle>
                        <DialogDescription>
                            {selectedDayLabel} • {selectedPeriodDisplay}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Subject</Label>
                            <Select
                                value={effectiveSubjectId}
                                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableSubjectOptions.map((subject) => (
                                        <SelectItem key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Teacher</Label>
                            <Select
                                value={formData.teacherId}
                                onValueChange={(value) => setFormData({ ...formData, teacherId: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teachers.map((teacher) => (
                                        <SelectItem key={teacher.id} value={teacher.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{teacher.name}</span>
                                                <span className="text-xs text-muted-foreground">{teacher.email}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="room">Room Number</Label>
                            <Input
                                id="room"
                                placeholder="e.g. 101"
                                value={formData.room}
                                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        {selectedSlot?.entryId && (
                            <Button
                                variant="destructive"
                                onClick={handleDeleteSlot}
                                type="button"
                                className="sm:mr-auto"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Clear Slot
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSlot}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
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
                                value={tempConfig.periods.length.toString()}
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

                        <div className="border rounded-lg p-4 space-y-3">
                            <Label className="text-sm font-medium">Active Days (max 7)</Label>
                            <div className="grid grid-cols-2 sm:grid-cols-1 md:grid-cols-3 gap-2">
                                {tempConfig.days.map((day) => (
                                    <label key={day.day_of_week} className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={day.is_active}
                                            onChange={() => toggleDayActive(day.day_of_week)}
                                            className="h-4 w-4"
                                        />
                                        {day.day_name}
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="border rounded-lg p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            <Label className="text-sm font-medium">Period Settings</Label>
                            {tempConfig.periods.map((period, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 bg-muted/50 rounded-lg">
                                    <div className="col-span-1 font-bold text-sm text-center">P{period.period_number}</div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={period.start_time}
                                            onChange={(e) => handlePeriodUpdate(index, 'start_time', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-1 text-center text-muted-foreground">to</div>
                                    <div className="col-span-3">
                                        <Input
                                            type="time"
                                            value={period.end_time}
                                            onChange={(e) => handlePeriodUpdate(index, 'end_time', e.target.value)}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                    <div className="col-span-2 flex items-center gap-1">
                                        <input
                                            type="checkbox"
                                            id={`break-${index}`}
                                            checked={period.is_break}
                                            onChange={(e) => handlePeriodUpdate(index, 'is_break', e.target.checked)}
                                            className="h-4 w-4"
                                        />
                                        <Label htmlFor={`break-${index}`} className="text-xs">Break</Label>
                                    </div>
                                    <div className="col-span-2">
                                        {period.is_break && (
                                            <Input
                                                placeholder="Name"
                                                value={period.break_name || ''}
                                                onChange={(e) => handlePeriodUpdate(index, 'break_name', e.target.value)}
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
                        <Button onClick={savePeriodsConfig} className="bg-gradient-to-r from-blue-500 to-cyan-600">
                            <Save className="mr-2 h-4 w-4" />
                            Save Configuration
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subjects Dialog */}
            <Dialog open={isSubjectsDialogOpen} onOpenChange={setIsSubjectsDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Subjects for {selectedClassLabel}
                        </DialogTitle>
                        <DialogDescription className="flex items-center justify-between">
                            <span>Manage subjects for this class based on class level</span>
                            <Button onClick={() => handleOpenSubjectForm()} size="sm">
                                <Plus className="h-4 w-4 mr-1" />
                                Add Subject
                            </Button>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-auto">
                        {classSubjects.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                No subjects found for this class
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {classSubjects.map((subject) => (
                                    <Card key={subject.id} className="border hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-base">{subject.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{subject.code}</p>
                                                    {subject.description && (
                                                        <p className="text-xs text-muted-foreground mt-2">{subject.description}</p>
                                                    )}
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {subject.credits && subject.credits > 0 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {subject.credits} {subject.credits === 1 ? 'Credit' : 'Credits'}
                                                            </Badge>
                                                        )}
                                                        {subject.is_optional && (
                                                            <Badge variant="outline" className="text-xs">Optional</Badge>
                                                        )}
                                                        {subject.grade_levels && subject.grade_levels.length > 0 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Classes: {subject.grade_levels.join(', ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 ml-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenSubjectForm(subject)}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <Edit className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteSubject(subject.id)}
                                                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubjectsDialogOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Subject Form Dialog */}
            <Dialog open={isSubjectFormOpen} onOpenChange={setIsSubjectFormOpen}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>{editingSubject ? 'Edit Subject' : 'Add New Subject'}</DialogTitle>
                        <DialogDescription>
                            {editingSubject ? 'Update subject information' : 'Create a new subject for this class'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Subject Name *</Label>
                                <Input
                                    id="name"
                                    value={subjectForm.name}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                    placeholder="e.g., Mathematics"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="code">Subject Code *</Label>
                                <Input
                                    id="code"
                                    value={subjectForm.code}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                                    placeholder="e.g., MATH10"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={subjectForm.description || ''}
                                onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value || null })}
                                placeholder="Brief description"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="credits">Credits</Label>
                                <Input
                                    id="credits"
                                    type="number"
                                    min="0"
                                    value={subjectForm.credits}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="grade_levels">
                                    Class Levels * (comma-separated)
                                    {selectedClass?.grade && (
                                        <span className="text-xs text-muted-foreground ml-1">
                                            (must include {selectedClass.grade})
                                        </span>
                                    )}
                                </Label>
                                <Input
                                    id="grade_levels"
                                    value={subjectForm.grade_levels?.join(', ') || ''}
                                    onChange={(e) => setSubjectForm({
                                        ...subjectForm,
                                        grade_levels: e.target.value.split(',').map(g => parseInt(g.trim())).filter(g => !isNaN(g))
                                    })}
                                    placeholder={selectedClass?.grade ? `e.g., ${selectedClass.grade}, ${selectedClass.grade + 1}` : "e.g., 9, 10, 11"}
                                    className={!subjectForm.grade_levels || subjectForm.grade_levels.length === 0 ? 'border-red-500' : ''}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_optional"
                                checked={subjectForm.is_optional}
                                onChange={(e) => setSubjectForm({ ...subjectForm, is_optional: e.target.checked })}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="is_optional">Optional Subject</Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubjectFormOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveSubject} disabled={createSubject.isPending || updateSubject.isPending}>
                            <Save className="h-4 w-4 mr-2" />
                            {editingSubject ? 'Update' : 'Create'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
