"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Upload, Download, CheckCircle, XCircle, Clock, Users, Save, Search, UserCheck, UserX } from 'lucide-react'
import { mockStudents } from '@/lib/mockData'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface AttendanceStatus {
    studentId: string
    status: 'present' | 'absent'
}

export default function AttendanceUploadPage() {
    const [selectedClass, setSelectedClass] = useState('10-A')
    const [selectedDate, setSelectedDate] = useState('2026-01-31')
    const [searchQuery, setSearchQuery] = useState('')
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent'>>({})

    // Get students filtered by class
    const getStudentsByClass = () => {
        const classNumber = selectedClass.split('-')[0]
        const section = selectedClass.split('-')[1]
        return mockStudents.filter(s => s.class === classNumber && s.section === section)
    }

    const filteredStudents = getStudentsByClass().filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.includes(searchQuery)
    )

    // Initialize empty attendance - no checkboxes pre-selected
    useEffect(() => {
        setAttendance({})
    }, [selectedClass])

    const handleAttendanceChange = (studentId: string, status: 'present' | 'absent') => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }))
    }

    const handleMarkAllPresent = () => {
        const newAttendance: Record<string, 'present' | 'absent'> = {}
        getStudentsByClass().forEach(student => {
            newAttendance[student.id] = 'present'
        })
        setAttendance(newAttendance)
        toast.success('All students marked as present')
    }

    const handleMarkAllAbsent = () => {
        const newAttendance: Record<string, 'present' | 'absent'> = {}
        getStudentsByClass().forEach(student => {
            newAttendance[student.id] = 'absent'
        })
        setAttendance(newAttendance)
        toast.success('All students marked as absent')
    }

    const handleSaveAttendance = () => {
        // Save attendance to localStorage for admin to view
        const attendanceData = {
            class: selectedClass,
            date: selectedDate,
            records: Object.entries(attendance).map(([studentId, status]) => {
                const student = mockStudents.find(s => s.id === studentId)
                return {
                    studentId,
                    studentName: student?.name || '',
                    rollNumber: student?.rollNumber || '',
                    status
                }
            }),
            savedAt: new Date().toISOString()
        }

        // Get existing attendance records
        const existingRecords = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')

        // Check if record for this class and date already exists, update it
        const existingIndex = existingRecords.findIndex(
            (r: { class: string; date: string }) => r.class === selectedClass && r.date === selectedDate
        )

        if (existingIndex >= 0) {
            existingRecords[existingIndex] = attendanceData
        } else {
            existingRecords.push(attendanceData)
        }

        localStorage.setItem('attendanceRecords', JSON.stringify(existingRecords))
        toast.success('Attendance saved successfully!')
    }

    const presentCount = Object.values(attendance).filter(s => s === 'present').length
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length
    const totalCount = getStudentsByClass().length
    const notMarkedCount = totalCount - presentCount - absentCount

    const classes = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B']

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                        Attendance
                    </h1>
                    <p className="text-muted-foreground mt-1">Mark and manage student attendance</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline"><Upload className="mr-2 h-4 w-4" />Import</Button>
                    <Button variant="outline"><Download className="mr-2 h-4 w-4" />Export</Button>
                    <Button onClick={handleSaveAttendance} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0">
                        <Save className="mr-2 h-4 w-4" />Save Attendance
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 flex-wrap">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                        {classes.map(cls => (
                            <SelectItem key={cls} value={cls}>Class {cls}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[180px]"
                />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{presentCount}</p>
                                <p className="text-sm text-muted-foreground">Present</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-red-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                <XCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{absentCount}</p>
                                <p className="text-sm text-muted-foreground">Absent</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalCount}</p>
                                <p className="text-sm text-muted-foreground">Total Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{notMarkedCount}</p>
                                <p className="text-sm text-muted-foreground">Not Marked</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Mark Attendance Card */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Mark Attendance - Class {selectedClass}</CardTitle>
                            <CardDescription>
                                Select Present or Absent for each student
                            </CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <div className="relative flex-1 md:flex-initial">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-full md:w-[200px]"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={handleMarkAllPresent}>
                                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                Mark All Present
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleMarkAllAbsent}>
                                <UserX className="mr-2 h-4 w-4 text-red-500" />
                                Mark All Absent
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No students found in this class</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredStudents.map((student, index) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                                >
                                    {/* Student Info */}
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                            {index + 1}
                                        </span>
                                        <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                            <AvatarImage src={student.avatar} />
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium">
                                                {getInitials(student.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold text-base">{student.name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-xs">
                                                    Roll: {student.rollNumber}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">
                                                    Class {student.class}-{student.section}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Attendance Checkboxes */}
                                    <div className="flex items-center gap-6">
                                        {/* Present Checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer group/present">
                                            <div className={`flex items-center justify-center h-6 w-6 rounded-md border-2 transition-all ${attendance[student.id] === 'present'
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-muted-foreground/30 hover:border-green-500'
                                                }`}>
                                                {attendance[student.id] === 'present' && (
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={attendance[student.id] === 'present'}
                                                onChange={() => handleAttendanceChange(student.id, 'present')}
                                            />
                                            <span className={`text-sm font-medium transition-colors ${attendance[student.id] === 'present'
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-muted-foreground group-hover/present:text-green-600'
                                                }`}>
                                                Present
                                            </span>
                                        </label>

                                        {/* Absent Checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer group/absent">
                                            <div className={`flex items-center justify-center h-6 w-6 rounded-md border-2 transition-all ${attendance[student.id] === 'absent'
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-muted-foreground/30 hover:border-red-500'
                                                }`}>
                                                {attendance[student.id] === 'absent' && (
                                                    <XCircle className="h-4 w-4 text-white" />
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={attendance[student.id] === 'absent'}
                                                onChange={() => handleAttendanceChange(student.id, 'absent')}
                                            />
                                            <span className={`text-sm font-medium transition-colors ${attendance[student.id] === 'absent'
                                                ? 'text-red-600 dark:text-red-400'
                                                : 'text-muted-foreground group-hover/absent:text-red-600'
                                                }`}>
                                                Absent
                                            </span>
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
