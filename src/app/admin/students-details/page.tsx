"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Search,
    Download,
    Upload,
    UserPlus,
    Filter,
    RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import { useStudents, useStudentMutations, useCreateStudent } from '@/hooks/useAdminStudents'
import { useClasses } from '@/hooks/useClasses'
import { useAuth } from '@/contexts/AuthContext'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { sortClassLabels } from '@/lib/classOrdering'

// Imported Components
import { StatsCards } from '@/components/admin/students/StatsCards'
import { AddStudentDialog } from '@/components/admin/students/AddStudentDialog'
import { ViewStudentDialog } from '@/components/admin/students/ViewStudentDialog'
import { EditStudentDialog } from '@/components/admin/students/EditStudentDialog' // Added import
import { StudentTable } from '@/components/admin/students/StudentTable'

export default function StudentsDetailsPage() {
    const searchParams = useSearchParams()
    const { user, isLoading: authLoading } = useAuth()
    const isSuperAdmin = user?.role === 'super_admin'
    const schoolId = searchParams.get('school_id') || undefined

    const [searchQuery, setSearchQuery] = useState('')
    const [classFilter, setClassFilter] = useState<string>('all')
    const [feeFilter, setFeeFilter] = useState<string>('all')

    // Use Infinite Query for Students
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading
    } = useStudents(searchQuery, 20, schoolId)

    const { updateStudent, deleteStudent, isDeleting } = useStudentMutations()
    const createStudent = useCreateStudent()
    const { data: classesData, isLoading: classesLoading } = useClasses()

    const students = data?.pages.flatMap(page => page.students) || []

    // Debug: Log received student data
    useEffect(() => {
        if (students.length > 0) {
            console.log('📊 Received students from backend:', students.length);
            console.log('📋 First student sample:', students[0]);
        }
    }, [students]);

    // Infinite Scroll Logic (Intersection Observer)
    const { ref: scrollRef, inView } = useIntersectionObserver({ threshold: 0.1 })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    // Dialog States
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null)

    // Derived Logic (Client-side filtering for non-search fields for now)
    const filteredStudents = students.filter(student => {
        // Filter out null/undefined students first
        if (!student) return false
        // Search is handled by server, but we keep this if needed for optimistic updates or extra safety
        // const matchesSearch = ... 
        const matchesClass = classFilter === 'all' || student.class_name === classFilter
        // Fee filtering logic would go here if fees were real
        const matchesFee = feeFilter === 'all' || (student.fees?.status || 'pending') === feeFilter
        return matchesClass && matchesFee
    }).sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', undefined, { sensitivity: 'base' }))

    const fetchTriggerIndex = filteredStudents.length > 0 ? Math.max(0, Math.floor(filteredStudents.length * 0.8) - 1) : -1

    // Calculate real stats from student data
    const stats = {
        total: data?.pages[0]?.total || 0,
        feesPaid: students.filter(s => s?.fees?.status === 'paid').length,
        feesPartial: students.filter(s => s?.fees?.status === 'partial').length,
        feesPending: students.filter(s => s?.fees?.status === 'pending').length,
        averageAttendance: students.length > 0
            ? Math.round(students.reduce((sum, s) => sum + (s?.attendance_stats?.attendance_percent || 0), 0) / students.length)
            : 0,
    }

    const classes = sortClassLabels([
        ...new Set(
            students
                .map(s => s?.class_name)
                .filter((className): className is string => Boolean(className))
        )
    ])

    const schoolClasses = (classesData?.classes || []).map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        section: c.section,
    }))

    // Handlers
    const handleAddStudent = (newStudentData: any) => {
        createStudent.mutate(newStudentData, {
            onSuccess: () => setIsAddDialogOpen(false)
        })
    }

    const handleEditStudent = async (id: string, data: any) => {
        try {
            await updateStudent({ id, data })
            setIsEditDialogOpen(false)
            setSelectedStudent(null)
        } catch (error) {
            // Toast handled by mutation
        }
    }

    const handleDeleteStudent = async () => {
        if (!selectedStudent?.id) return

        try {
            await deleteStudent(selectedStudent.id)
            setIsDeleteDialogOpen(false)
            setSelectedStudent(null)
            // Toast handled in mutation onSuccess
        } catch (error) {
            // Toast handled in mutation onError
        }
    }

    const handleImport = () => {
        toast.info('Importing students...', { description: 'Parsing CSV file...' })
        setTimeout(() => toast.success('Import completed'), 1500)
    }

    const exportStudents = () => {
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Class', 'Section', 'Roll No', 'Parent Name'].join(','),
            ...filteredStudents.map(s =>
                [s.full_name, s.email, s.parent_phone, s.class_name, s.section, s.roll_number, s.parent_name].join(',')
            )
        ].join('\n')
        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'students.csv'
        a.click()
        toast.success('Export completed')
    }

    const handleToggleFeeStatus = (student: any) => {
        toast.info('Fee management coming soon')
    }

    // Only block super admins without a school_id, regular admins are fine
    if (!authLoading && isSuperAdmin && !schoolId) {
        return (
            <div className="space-y-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Students Details</h1>
                    <p className="text-muted-foreground">View and manage all student records</p>
                </div>
                <Card>
                    <CardContent className="py-10 text-center space-y-3">
                        <h2 className="text-xl font-semibold">School required</h2>
                        <p className="text-sm text-muted-foreground">
                            Super Admins must specify a school to view student records.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Open a school from the Super Admin console or add a `school_id` query param.
                        </p>
                        <div className="flex justify-center gap-3 pt-2">
                            <Button onClick={() => window.location.href = '/super-admin'}>
                                Go to Super Admin
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Students Details</h1>
                    <p className="text-muted-foreground">View and manage all student records</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <Button variant="outline" onClick={exportStudents}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90"
                        onClick={() => setIsAddDialogOpen(true)}
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Add Student
                    </Button>
                </div>
            </div>

            {/* Component: Stats Cards */}
            <StatsCards stats={stats} />

            {/* Students Table Section */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Select value={classFilter} onValueChange={setClassFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Classes</SelectItem>
                                    {classes.map((c: any) => (
                                        <SelectItem key={c} value={c}>Class {c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={feeFilter} onValueChange={setFeeFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Fee Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setSearchQuery('')
                                    setClassFilter('all')
                                    setFeeFilter('all')
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <StudentTable
                        students={filteredStudents}
                        totalStudents={stats.total}
                        fetchTriggerIndex={fetchTriggerIndex}
                        fetchTriggerRef={scrollRef}
                        onView={(s: any) => { setSelectedStudent(s); setIsViewDialogOpen(true) }}
                        onEdit={(s: any) => { setSelectedStudent(s); setIsEditDialogOpen(true) }}
                        onDelete={(s: any) => { setSelectedStudent(s); setIsDeleteDialogOpen(true) }}
                        onToggleFee={handleToggleFeeStatus}
                    />
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredStudents.length} of {stats.total} students
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddStudentDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                onAdd={handleAddStudent}
                classes={schoolClasses}
                isLoading={classesLoading}
            />

            <ViewStudentDialog
                open={isViewDialogOpen}
                onOpenChange={setIsViewDialogOpen}
                student={selectedStudent}
                schoolId={schoolId}
            />

            <EditStudentDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                student={selectedStudent}
                onSave={handleEditStudent}
                schoolId={schoolId}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{' '}
                            <span className="font-semibold">{selectedStudent?.full_name}</span> from the system.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteStudent}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Student
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
