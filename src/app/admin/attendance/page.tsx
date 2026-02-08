"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    CheckCircle,
    XCircle,
    Users,
    Calendar,
    Download,
    Search,
    GraduationCap,
    Clock,
    Printer,
    Filter,
    BarChart3,
    RefreshCw
} from 'lucide-react'
import { mockStudents } from '@/lib/mockData'

interface AttendanceRecord {
    class: string
    date: string
    records: {
        studentId: string
        studentName: string
        rollNumber: string
        status: 'present' | 'absent'
    }[]
    savedAt: string
}

interface ClassSummary {
    className: string
    totalStudents: number
    present: number
    absent: number
    attendanceRate: number
    lastUpdated: string | null
}

export default function AdminAttendancePage() {
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
    const [selectedClass, setSelectedClass] = useState('all')
    const [selectedDate, setSelectedDate] = useState('')
    const [searchQuery, setSearchQuery] = useState('')
    const [activeTab, setActiveTab] = useState('classwise')

    const classes = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-B', '12-A', '12-B']

    // Load attendance records from localStorage
    useEffect(() => {
        const loadRecords = () => {
            const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
            setAttendanceRecords(records)
        }
        loadRecords()

        // Listen for storage changes
        window.addEventListener('storage', loadRecords)
        return () => window.removeEventListener('storage', loadRecords)
    }, [])

    const refreshData = () => {
        const records = JSON.parse(localStorage.getItem('attendanceRecords') || '[]')
        setAttendanceRecords(records)
    }

    // Get class-wise summary
    const getClassSummary = (): ClassSummary[] => {
        return classes.map(className => {
            const classRecords = attendanceRecords.filter(r => r.class === className)
            const latestRecord = classRecords.sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            )[0]

            if (latestRecord) {
                const present = latestRecord.records.filter(r => r.status === 'present').length
                const total = latestRecord.records.length
                return {
                    className,
                    totalStudents: total,
                    present,
                    absent: total - present,
                    attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0,
                    lastUpdated: latestRecord.savedAt
                }
            }

            // If no records, show default from mock data
            const classNumber = className.split('-')[0]
            const section = className.split('-')[1]
            const studentsInClass = mockStudents.filter(s => s.class === classNumber && s.section === section)

            return {
                className,
                totalStudents: studentsInClass.length,
                present: 0,
                absent: 0,
                attendanceRate: 0,
                lastUpdated: null
            }
        })
    }

    // Get filtered records for detailed view
    const getFilteredRecords = () => {
        let records = attendanceRecords

        if (selectedClass !== 'all') {
            records = records.filter(r => r.class === selectedClass)
        }

        if (selectedDate) {
            records = records.filter(r => r.date === selectedDate)
        }

        return records
    }

    // Get all students with their attendance from filtered records
    const getStudentAttendance = () => {
        const filteredRecords = getFilteredRecords()

        const allStudents: {
            studentId: string
            studentName: string
            rollNumber: string
            class: string
            status: 'present' | 'absent'
            date: string
        }[] = []

        filteredRecords.forEach(record => {
            record.records.forEach(student => {
                if (
                    student.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    student.rollNumber.includes(searchQuery)
                ) {
                    allStudents.push({
                        ...student,
                        class: record.class,
                        date: record.date
                    })
                }
            })
        })

        return allStudents
    }

    // Overall stats
    const totalPresent = attendanceRecords.reduce((sum, r) =>
        sum + r.records.filter(s => s.status === 'present').length, 0
    )
    const totalAbsent = attendanceRecords.reduce((sum, r) =>
        sum + r.records.filter(s => s.status === 'absent').length, 0
    )
    const totalRecords = totalPresent + totalAbsent

    const handlePrint = () => {
        window.print()
    }

    const handleExport = () => {
        const data = JSON.stringify(attendanceRecords, null, 2)
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.json`
        a.click()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                        Attendance Management
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        View and manage class-wise student attendance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={refreshData}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                                <BarChart3 className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{attendanceRecords.length}</p>
                                <p className="text-sm text-muted-foreground">Total Records</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-green-500/5 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{totalPresent}</p>
                                <p className="text-sm text-muted-foreground">Total Present</p>
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
                                <p className="text-2xl font-bold">{totalAbsent}</p>
                                <p className="text-sm text-muted-foreground">Total Absent</p>
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
                                <p className="text-2xl font-bold">
                                    {totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0}%
                                </p>
                                <p className="text-sm text-muted-foreground">Overall Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs for different views */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="classwise">Class-wise Summary</TabsTrigger>
                    <TabsTrigger value="detailed">Detailed Records</TabsTrigger>
                </TabsList>

                {/* Class-wise Summary Tab */}
                <TabsContent value="classwise" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {getClassSummary().map((summary) => (
                            <Card key={summary.className} className="relative overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent" />
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 shadow-md">
                                                <GraduationCap className="h-5 w-5 text-white" />
                                            </div>
                                            <CardTitle className="text-lg">Class {summary.className}</CardTitle>
                                        </div>
                                        <Badge
                                            variant={summary.attendanceRate >= 80 ? 'default' : summary.attendanceRate >= 60 ? 'secondary' : 'destructive'}
                                            className={summary.attendanceRate >= 80 ? 'bg-green-500' : ''}
                                        >
                                            {summary.attendanceRate}%
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Total Students</span>
                                            <span className="font-medium">{summary.totalStudents}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                                <span className="text-muted-foreground">Present</span>
                                            </div>
                                            <span className="font-medium text-green-600">{summary.present}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-1.5">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-muted-foreground">Absent</span>
                                            </div>
                                            <span className="font-medium text-red-600">{summary.absent}</span>
                                        </div>
                                        {summary.lastUpdated && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    Updated: {new Date(summary.lastUpdated).toLocaleString()}
                                                </p>
                                            </div>
                                        )}
                                        {!summary.lastUpdated && (
                                            <div className="pt-2 border-t">
                                                <p className="text-xs text-muted-foreground">No attendance recorded yet</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Detailed Records Tab */}
                <TabsContent value="detailed" className="mt-6 space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by student name or roll number..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                                        <SelectTrigger className="w-[150px]">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue placeholder="Class" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Classes</SelectItem>
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
                            </div>
                        </CardContent>
                    </Card>

                    {/* Records Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Attendance Records</CardTitle>
                            <CardDescription>Detailed view of all student attendance records</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-lg border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead>Student Name</TableHead>
                                            <TableHead>Roll Number</TableHead>
                                            <TableHead>Class</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getStudentAttendance().length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-12">
                                                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
                                                    <p className="text-muted-foreground">No attendance records found</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Teachers can mark attendance from their dashboard
                                                    </p>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            getStudentAttendance().map((student, index) => (
                                                <TableRow key={`${student.studentId}-${student.date}`} className="hover:bg-muted/30">
                                                    <TableCell className="font-medium">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{student.studentName}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{student.rollNumber}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5">
                                                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                                            {student.class}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1.5 text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            {new Date(student.date).toLocaleDateString()}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {student.status === 'present' ? (
                                                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100">
                                                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                                                Present
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100">
                                                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                                                Absent
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
