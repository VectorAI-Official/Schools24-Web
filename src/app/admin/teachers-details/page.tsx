"use client"

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Download,
    Upload,
    Eye,
    BookOpen,
    Users,
    UserPlus,
    Phone,
    Calendar,
    DollarSign,
    Star,
    GraduationCap,
    Filter,
    RefreshCw,
    CheckCircle2,
    Clock,
    Briefcase,
} from 'lucide-react'
import { Teacher } from '@/types'
import { getInitials, formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { useTeachers, useCreateTeacher, useUpdateTeacher, useDeleteTeacher } from '@/hooks/useAdminTeachers'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useAuth } from '@/contexts/AuthContext'
import { EditTeacherDialog } from '@/components/admin/teachers/EditTeacherDialog'

export default function TeachersDetailsPage() {
    const searchParams = useSearchParams()
    const { user } = useAuth()
    const isSuperAdmin = user?.role === 'super_admin'
    const schoolId = searchParams.get('school_id') || undefined

    const [searchQuery, setSearchQuery] = useState('')
    const [departmentFilter, setDepartmentFilter] = useState<string>('all')

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
    const [newTeacher, setNewTeacher] = useState({
        name: '',
        email: '',
        phone: '',
        employeeId: '',
        department: '',
        subjects: '',
        classes: '',
        qualification: '',
        experience: '',
        salary: 0,
    })

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useTeachers(searchQuery, 20, schoolId, departmentFilter)

    const teachers = data?.pages.flatMap(page => page.teachers) || []

    const createMutation = useCreateTeacher()
    const updateMutation = useUpdateTeacher()
    const deleteMutation = useDeleteTeacher()

    // Infinite Scroll Logic (Intersection Observer)
    const { ref: scrollRef, inView } = useIntersectionObserver({ threshold: 0.1 })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const filteredTeachers = teachers
        .filter(teacher => {
            const matchesSearch = !searchQuery ||
                teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesDepartment = departmentFilter === 'all' || teacher.department === departmentFilter
            return matchesSearch && matchesDepartment
        })
        .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }))

    const fetchTriggerIndex = filteredTeachers.length > 0 ? Math.max(0, Math.floor(filteredTeachers.length * 0.8) - 1) : -1

    const departments = [...new Set(teachers.map(t => t.department))].sort()

    const stats = {
        total: data?.pages[0]?.total || teachers.length,
        active: teachers.filter(t => t.status?.toLowerCase() === 'active').length,
        onLeave: teachers.filter(t => t.status?.toLowerCase() === 'on_leave' || t.status?.toLowerCase() === 'on leave').length,
        totalSalary: teachers.reduce((acc, t) => acc + t.salary, 0),
        avgRating: (teachers.reduce((acc, t) => acc + t.rating, 0) / (teachers.length || 1)).toFixed(1),
    }

    // Removed handleAddTeacher function

    const handleEditTeacher = (id: string, data: any) => {
        updateMutation.mutate({ id, data, schoolId }, {
            onSuccess: () => {
                setIsEditDialogOpen(false)
            }
        })
    }

    const handleDeleteTeacher = () => {
        if (!selectedTeacher) return

        deleteMutation.mutate({ id: selectedTeacher.id, schoolId }, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false)
            }
        })
    }



    const handleImport = () => {
        toast.info('Importing teachers...', {
            description: 'Parsing CSV file and updating records'
        })

        setTimeout(() => {
            toast.success('Import completed', {
                description: 'Successfully imported 10 new teachers'
            })
        }, 1500)
    }

    const exportTeachers = () => {
        const csvContent = [
            ['Name', 'Email', 'Phone', 'Employee ID', 'Department', 'Subjects', 'Salary', 'Rating'].join(','),
            ...filteredTeachers.map(t =>
                [t.name, t.email, t.phone, t.employeeId, t.department, t.subjects.join(';'), t.salary, t.rating].join(',')
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'teachers.csv'
        a.click()
        toast.success('Export completed', {
            description: 'Teachers data has been exported to CSV',
        })
    }

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                    />
                ))}
                <span className="ml-1 text-sm font-medium">{rating}</span>
            </div>
        )
    }

    const getStatusBadgeVariant = (status?: string): "default" | "success" | "warning" | "secondary" => {
        const normalized = (status || '').toLowerCase()
        if (normalized === 'active') return 'success'
        if (normalized === 'on_leave' || normalized === 'on leave') return 'warning'
        return 'secondary'
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Teachers Details</h1>
                    <p className="text-muted-foreground">View and manage all teaching staff</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={handleImport}>
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <Button variant="outline" onClick={exportTeachers}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    {/* Only super admins can add teachers directly; normal admins use User Management */}
                    {isSuperAdmin && (
                        <Button
                            className="bg-gradient-to-r from-green-600 to-teal-600 hover:opacity-90"
                            onClick={() => setIsAddDialogOpen(true)}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Add Teacher
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            < div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6" >
                <Card className="bg-gradient-to-br from-green-500 to-teal-600 border-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold text-white">{stats.total}</p>
                                <p className="text-sm text-green-100">Total Teachers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold">{stats.active}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                                <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold">{stats.onLeave}</p>
                                <p className="text-sm text-muted-foreground">On Leave</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/30">
                                <DollarSign className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-xl font-bold">{formatCurrency(stats.totalSalary)}</p>
                                <p className="text-sm text-muted-foreground">Total Salary</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-900/30">
                                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold">{stats.avgRating}</p>
                                <p className="text-sm text-muted-foreground">Avg Rating</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                                <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-xl md:text-3xl font-bold">{departments.length}</p>
                                <p className="text-sm text-muted-foreground">Departments</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div >

            {/* Teachers Table */}
            < Card >
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search teachers..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex gap-3">
                            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Departments</SelectItem>
                                    {departments.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => {
                                    setSearchQuery('')
                                    setDepartmentFilter('all')
                                }}
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Teacher</TableHead>
                                    <TableHead>Employee ID</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Subjects</TableHead>
                                    <TableHead>Salary</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTeachers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No teachers found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTeachers.map((teacher, index) => (
                                        <TableRow key={teacher.id} className="hover:bg-muted/50" ref={index === fetchTriggerIndex ? scrollRef : undefined}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={teacher.avatar} />
                                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white">
                                                            {getInitials(teacher.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{teacher.name}</p>
                                                        <p className="text-sm text-muted-foreground">{teacher.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{teacher.employeeId}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-medium">
                                                    {teacher.department}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {teacher.subjects.slice(0, 2).map((subject, index) => (
                                                        <Badge key={index} variant="secondary" className="text-xs">
                                                            {subject}
                                                        </Badge>
                                                    ))}
                                                    {teacher.subjects.length > 2 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{teacher.subjects.length - 2}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-medium">{formatCurrency(teacher.salary)}</TableCell>
                                            <TableCell>{renderStars(teacher.rating)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTeacher(teacher)
                                                                setIsViewDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedTeacher(teacher)
                                                                setIsEditDialogOpen(true)
                                                            }}
                                                        >
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedTeacher(teacher)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {filteredTeachers.length} of {teachers.length} teachers
                        </p>
                    </div>
                </CardContent>
            </Card >

            {/* View Dialog */}
            < Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} >
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Teacher Details</DialogTitle>
                    </DialogHeader>
                    {selectedTeacher && (
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="academic">Academic</TabsTrigger>
                                <TabsTrigger value="salary">Salary</TabsTrigger>
                            </TabsList>
                            <TabsContent value="profile" className="space-y-4 mt-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-20 w-20">
                                        <AvatarImage src={selectedTeacher.avatar} />
                                        <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-500 text-white text-xl">
                                            {getInitials(selectedTeacher.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="text-xl font-bold">{selectedTeacher.name}</h3>
                                        <p className="text-muted-foreground">{selectedTeacher.email}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant="outline">{selectedTeacher.employeeId}</Badge>
                                            <Badge variant={getStatusBadgeVariant(selectedTeacher.status)}>
                                                {selectedTeacher.status}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="font-medium">{selectedTeacher.phone}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Department</p>
                                            <p className="font-medium">{selectedTeacher.department}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Qualification</p>
                                            <p className="font-medium">{selectedTeacher.qualification}</p>
                                        </div>
                                    </div>
                                    <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">Experience</p>
                                            <p className="font-medium">{selectedTeacher.experience}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-3 rounded-lg bg-muted flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Join Date</p>
                                        <p className="font-medium">{selectedTeacher.joinDate}</p>
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="academic" className="space-y-4 mt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-500 to-teal-500 text-white text-center">
                                        <Star className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{selectedTeacher.rating}</p>
                                        <p className="text-sm opacity-90">Average Rating</p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-center">
                                        <Users className="h-8 w-8 mx-auto mb-2" />
                                        <p className="text-2xl font-bold">{selectedTeacher.classes.length}</p>
                                        <p className="text-sm opacity-90">Classes Assigned</p>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold">Subjects</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTeacher.subjects.map((subject, index) => (
                                            <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                                                {subject}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-semibold">Assigned Classes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTeacher.classes.map((cls, index) => (
                                            <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                                                {cls}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                            <TabsContent value="salary" className="space-y-4 mt-4">
                                <div className="p-4 md:p-6 rounded-lg border text-center">
                                    <DollarSign className="h-12 w-12 mx-auto mb-3 text-green-500" />
                                    <p className="text-sm text-muted-foreground">Monthly Salary</p>
                                    <p className="text-2xl md:text-4xl font-bold text-green-600">{formatCurrency(selectedTeacher.salary)}</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg border text-center">
                                        <p className="text-sm text-muted-foreground">Annual Salary</p>
                                        <p className="text-xl font-bold">{formatCurrency(selectedTeacher.salary * 12)}</p>
                                    </div>
                                    <div className="p-4 rounded-lg border text-center">
                                        <p className="text-sm text-muted-foreground">Per Class Rate</p>
                                        <p className="text-xl font-bold">{formatCurrency(Math.round(selectedTeacher.salary / (selectedTeacher.classes.length * 20)))}/class</p>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >

            {/* Edit Teacher Dialog */}
            <EditTeacherDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                teacher={selectedTeacher}
                onSave={handleEditTeacher}
            />

            {/* Delete Confirmation */}
            < AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen} >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Teacher?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently remove{' '}
                            <span className="font-semibold">{selectedTeacher?.name}</span> from the system
                            and delete all associated records.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteTeacher}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Remove Teacher
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog >
        </div >
    )
}
