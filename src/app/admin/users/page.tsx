"use client"

import { useMemo, useState } from 'react'
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
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
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
import {
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Download,
    Eye,
    Shield,
    GraduationCap,
    BookOpen,
    Users,
    CheckCircle2,
    XCircle,
    Filter,
    RefreshCw,
    Plus,
    Upload,
    Briefcase,
    Lock,
    Unlock,
    Loader2,
    Check,
    X,
    Minus,
    EyeOff
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { useUsers, useUserStats, useCreateUser, useUpdateUser, useDeleteUser, AdminUser } from '@/hooks/useAdminUsers'
import { useClasses, useCreateClass, useDeleteClass, useUpdateClass, SchoolClass } from '@/hooks/useClasses'
import { useAdminCatalogClasses } from '@/hooks/useAdminCatalogClasses'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
// import { useDebounce } from '@/hooks/useDebounce'
// I will just use simple useEffect debounce or just separate state for debounced search.
import { useEffect } from 'react'

const normalizeSection = (value: string) => value.trim().toUpperCase().replace(/[^A-Z]/g, '')

const sectionToNumber = (label?: string | null) => {
    if (!label) return 0
    const normalized = normalizeSection(label)
    if (!normalized) return 0
    let num = 0
    for (const char of normalized) {
        num = num * 26 + (char.charCodeAt(0) - 64)
    }
    return num
}

const numberToSection = (num: number) => {
    if (num <= 0) return ''
    let result = ''
    let n = num
    while (n > 0) {
        const rem = (n - 1) % 26
        result = String.fromCharCode(65 + rem) + result
        n = Math.floor((n - 1) / 26)
    }
    return result
}

const getNextSectionLabel = (existingLabels: string[]) => {
    let max = 0
    for (const label of existingLabels) {
        const value = sectionToNumber(label)
        if (value > max) max = value
    }
    return max === 0 ? 'A' : numberToSection(max + 1)
}

const getCurrentAcademicYear = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    if (month < 4) {
        return `${year - 1}-${year}`
    }
    return `${year}-${year + 1}`
}

const getAcademicYears = () => {
    const now = new Date()
    const base = now.getFullYear()
    const years: string[] = []
    for (let i = -2; i <= 1; i += 1) {
        const start = base + i
        years.push(`${start}-${start + 1}`)
    }
    return years
}

const parseGradeFromClassName = (name: string): number | null => {
    const normalized = name.trim().toUpperCase()
    if (normalized === 'LKG') return -1
    if (normalized === 'UKG') return 0
    const match = name.match(/\d+/)
    if (!match) return null
    const parsed = parseInt(match[0], 10)
    if (Number.isNaN(parsed) || parsed < 1) return null
    return parsed
}

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
    const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
    const [newGrade, setNewGrade] = useState<number | null>(null)
    const [editingSection, setEditingSection] = useState<{ id: string; value: string } | null>(null)
    const [isInchargeDialogOpen, setIsInchargeDialogOpen] = useState(false)
    const [selectedClassForIncharge, setSelectedClassForIncharge] = useState<SchoolClass | null>(null)
    const [teacherSearch, setTeacherSearch] = useState('')
    const [debouncedTeacherSearch, setDebouncedTeacherSearch] = useState('')

    // Pagination state
    const pageSize = 20

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTeacherSearch(teacherSearch)
        }, 300)
        return () => clearTimeout(timer)
    }, [teacherSearch])

    // Queries
    const {
        data,
        isLoading,
        isError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useUsers(roleFilter, debouncedSearch, pageSize)

    const { data: statsData, isLoading: statsLoading } = useUserStats()

    const { data: classesData, isLoading: classesLoading } = useClasses(academicYear)
    const { data: catalogClassesData } = useAdminCatalogClasses(true)
    const createClass = useCreateClass()
    const updateClass = useUpdateClass()
    const deleteClass = useDeleteClass()

    const { data: classInchargeTeachers = [], isLoading: isClassInchargeTeachersLoading } = useQuery({
        queryKey: ['class-incharge-teachers', debouncedTeacherSearch, isInchargeDialogOpen],
        enabled: isInchargeDialogOpen,
        queryFn: async () => {
            const params = new URLSearchParams()
            if (debouncedTeacherSearch) params.append('search', debouncedTeacherSearch)
            params.append('page', '1')
            params.append('page_size', '20')
            params.append('status', 'active')

            const response = await api.get<{ teachers: Array<{ id: string; name: string; email: string; department?: string | null }> }>(
                `/admin/teachers?${params.toString()}`
            )
            return response.teachers || []
        },
        staleTime: 30 * 1000,
    })

    // Mutations
    const createUser = useCreateUser()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()

    const users = useMemo(() => {
        const allUsers = data?.pages.flatMap(page => page.users) || []
        const seen = new Set<string>()
        const uniqueUsers: AdminUser[] = []

        for (const user of allUsers) {
            if (!user?.id || seen.has(user.id)) continue
            seen.add(user.id)
            uniqueUsers.push(user)
        }

        return uniqueUsers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', undefined, { sensitivity: 'base' }))
    }, [data])
    const totalUsersCount = data?.pages[0]?.total || 0
    const classes = classesData?.classes || []
    const catalogClasses = catalogClassesData?.classes || []

    const catalogClassNameByGrade = useMemo(() => {
        const map = new Map<number, string>()
        for (const item of catalogClasses) {
            const grade = parseGradeFromClassName(item.name)
            if (grade !== null && !map.has(grade)) {
                map.set(grade, item.name)
            }
        }
        return map
    }, [catalogClasses])

    // Infinite Scroll Logic (Intersection Observer)
    const { ref: scrollRef, inView } = useIntersectionObserver({ threshold: 0.1 })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])
    const filteredUsers = users
    const fetchTriggerIndex = filteredUsers.length > 0 ? Math.max(0, Math.floor(filteredUsers.length * 0.8) - 1) : -1

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [newUser, setNewUser] = useState<{
        name: string;
        email: string;
        role: string;
        phone: string;
        department: string;
        password: string;
    }>({
        name: '',
        email: '',
        role: 'student',
        phone: '',
        department: '',
        password: ''
    })
    const [editPassword, setEditPassword] = useState('')
    const [showAddPassword, setShowAddPassword] = useState(false)
    const [showEditPassword, setShowEditPassword] = useState(false)

    // Computed Stats (Naive implementation based on current view or basic assumption)
    // Real stats should come from Dashboard API.
    // For now, I will use data.total for total.
    // I cannot calculate exact Active/Inactive count for WHOLE DB without helper API.
    // I'll leave stats static or based on current page (which is wrong but safer than breaking).
    // Or I fetch stats separately? `useDashboardStats`?
    // I'll simply show "Total Users: {data?.total}" and maybe hide others or show "-"
    const userStats = {
        total: statsData?.total || 0,
        admins: statsData?.admins || 0,
        teachers: statsData?.teachers || 0,
        students: statsData?.students || 0,
    }
    // Note: User stats cards might look empty. I should ideally fetch dashboard stats.
    // But I'll focus on CRUD first.



    const handleEditUser = () => {
        if (!selectedUser) return

        if (editPassword && editPassword.length < 6) {
            toast.error('Invalid password', {
                description: 'Password must be at least 6 characters'
            })
            return
        }

        updateUser.mutate({
            id: selectedUser.id,
            full_name: selectedUser.full_name,
            email: selectedUser.email,
            role: selectedUser.role,
            phone: selectedUser.phone,
            department: selectedUser.department,
            password: editPassword || undefined,
        }, {
            onSuccess: () => {
                setIsEditDialogOpen(false)
                setEditPassword('')
                setShowEditPassword(false)
            }
        })
    }

    const handleAddUser = () => {
        const trimmedName = newUser.name.trim()
        const trimmedEmail = newUser.email.trim()
        const trimmedPassword = newUser.password.trim()

        if (!trimmedName || !trimmedEmail || !trimmedPassword) {
            toast.error('Missing fields', {
                description: 'Please fill in Name, Email, and Password'
            })
            return
        }

        // Validate email format before hitting the backend
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(trimmedEmail)) {
            toast.error('Invalid email address', {
                description: `"${trimmedEmail}" is not a valid email. Example: john@school.com`
            })
            return
        }

        if (trimmedPassword.length < 6) {
            toast.error('Invalid password', {
                description: 'Password must be at least 6 characters'
            })
            return
        }

        if (newUser.role === 'student') {
            toast.info('Student created — add class & details in Students Details page', {
                description: 'Class assignment and parent info can be filled in via Students Details → Edit.',
                duration: 6000,
            })
            // Fall through — let creation proceed
        }

        createUser.mutate({
            full_name: trimmedName,
            email: trimmedEmail,
            role: newUser.role,
            phone: newUser.phone.trim(),
            department: newUser.department.trim(),
            password: trimmedPassword,
        }, {
            onSuccess: () => {
                setIsAddDialogOpen(false)
                setNewUser({
                    name: '',
                    email: '',
                    role: 'student',
                    phone: '',
                    department: '',
                    password: ''
                })
                setShowAddPassword(false)
            }
        })
    }

    const handleImport = () => {
        // Backend doesn't support import yet. Keeping mock toast.
        toast.info('Importing users...', {
            description: 'Feature coming soon (Backend pending)'
        })
    }

    const handleDeleteUser = () => {
        if (!selectedUser) return
        deleteUser.mutate(selectedUser.id, {
            onSuccess: () => setIsDeleteDialogOpen(false)
        })
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-4 w-4" />
            case 'teacher':
                return <BookOpen className="h-4 w-4" />
            case 'student':
                return <GraduationCap className="h-4 w-4" />
            default:
                return <Users className="h-4 w-4" />
        }
    }

    const getRoleBadgeVariant = (role: string): "default" | "success" | "warning" | "secondary" => {
        switch (role) {
            case 'admin':
                return 'default'
            case 'teacher':
                return 'success'
            case 'student':
                return 'warning'
            default:
                return 'secondary'
        }
    }

    const exportUsers = () => {
        const csvContent = [
            ['Name', 'Email', 'Role', 'Phone', 'Department'].join(','),
            ...filteredUsers.map(u =>
                [u.full_name, u.email, u.role, u.phone || '', u.department || ''].join(',')
            )
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'users.csv'
        a.click()
        toast.success('Export completed', {
            description: 'Users data has been exported to CSV',
        })
    }

    const academicYears = useMemo(() => getAcademicYears(), [])

    const classesByGrade = useMemo(() => {
        const map = new Map<number, SchoolClass[]>()
        for (const cls of classes) {
            const list = map.get(cls.grade) || []
            list.push(cls)
            map.set(cls.grade, list)
        }
        for (const [grade, list] of map.entries()) {
            list.sort((a, b) => sectionToNumber(a.section) - sectionToNumber(b.section))
            map.set(grade, list)
        }
        return map
    }, [classes])

    const availableGrades = useMemo(() => {
        const all = Array.from(
            new Set(
                catalogClasses
                    .map((item) => parseGradeFromClassName(item.name))
                    .filter((grade): grade is number => grade !== null)
            )
        ).sort((a, b) => a - b)
        const existing = new Set(classes.map(c => c.grade))
        return all.filter(g => !existing.has(g))
    }, [catalogClasses, classes])

    const handleAddSection = (grade: number) => {
        const gradeClasses = classesByGrade.get(grade) || []
        const existingLabels = gradeClasses.map(c => c.section || '')
        const nextLabel = getNextSectionLabel(existingLabels)
        const className = catalogClassNameByGrade.get(grade) || `Class ${grade}`
        createClass.mutate({
            name: className,
            grade,
            section: nextLabel,
            academic_year: academicYear,
        })
    }

    const handleRemoveSection = (cls: SchoolClass) => {
        deleteClass.mutate(cls.id)
    }

    const handleShorten = (grade: number) => {
        const gradeClasses = classesByGrade.get(grade) || []
        if (gradeClasses.length === 0) return
        const last = gradeClasses[gradeClasses.length - 1]
        deleteClass.mutate(last.id)
    }

    const handleRenameSection = (cls: SchoolClass) => {
        if (!editingSection) return
        const nextValue = normalizeSection(editingSection.value)
        if (!nextValue) {
            toast.error('Section label is required')
            return
        }
        updateClass.mutate({
            id: cls.id,
            section: nextValue,
        }, {
            onSuccess: () => setEditingSection(null)
        })
    }

    const handleAddGrade = () => {
        if (!newGrade) return
        handleAddSection(newGrade)
        setNewGrade(null)
    }

    const openInchargeDialog = (cls: SchoolClass) => {
        setSelectedClassForIncharge(cls)
        setTeacherSearch('')
        setDebouncedTeacherSearch('')
        setIsInchargeDialogOpen(true)
    }

    const handleAssignIncharge = (teacherId: string) => {
        if (!selectedClassForIncharge) return
        updateClass.mutate(
            { id: selectedClassForIncharge.id, class_teacher_id: teacherId },
            {
                onSuccess: () => {
                    setIsInchargeDialogOpen(false)
                    setSelectedClassForIncharge(null)
                }
            }
        )
    }

    const handleClearIncharge = () => {
        if (!selectedClassForIncharge) return
        updateClass.mutate(
            { id: selectedClassForIncharge.id, class_teacher_id: '' },
            {
                onSuccess: () => {
                    setIsInchargeDialogOpen(false)
                    setSelectedClassForIncharge(null)
                }
            }
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-xl md:text-3xl font-bold">User Management</h1>
                        <div className="relative">
                            {/* Pulsing beacon to draw admin attention to Class Management */}
                            <span className="absolute -top-1 -right-1 flex h-3 w-3 z-10">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
                            </span>
                            <Button
                                variant="outline"
                                onClick={() => setIsClassDialogOpen(true)}
                                className="border-amber-400 bg-amber-50 text-amber-800 hover:bg-amber-100 hover:border-amber-500 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/40"
                            >
                                <BookOpen className="mr-2 h-4 w-4" />
                                Class Management
                            </Button>
                        </div>
                    </div>
                    <p className="text-muted-foreground">Manage all users in the system</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={handleImport} className="w-full">
                        <Upload className="mr-2 h-4 w-4" />
                        Import
                    </Button>
                    <Button variant="outline" onClick={exportUsers} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={() => setIsAddDialogOpen(true)} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0">
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                                <Users className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{userStats.total}</p>
                                <p className="text-xs text-muted-foreground">Total Users</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                                <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{userStats.admins}</p>
                                <p className="text-xs text-muted-foreground">Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                                <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{userStats.teachers}</p>
                                <p className="text-xs text-muted-foreground">Teachers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                                <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{userStats.students}</p>
                                <p className="text-xs text-muted-foreground">Students</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-0 md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full md:w-[160px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-full md:w-10"
                                onClick={() => {
                                    setSearchQuery('')
                                    setRoleFilter('all')
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
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Rating</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">
                                            <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user, index) => (
                                        <TableRow key={user.id} className="hover:bg-muted/50" ref={index === fetchTriggerIndex ? scrollRef : undefined}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                                                            {getInitials(user.full_name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium">{user.full_name}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={getRoleBadgeVariant(user.role)} className="gap-1">
                                                    {getRoleIcon(user.role)}
                                                    <span className="capitalize">{user.role}</span>
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.role === 'teacher' ? (
                                                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">
                                                        {(user as any).rating || '0.0'} ★
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{user.phone || '-'}</TableCell>
                                            <TableCell>{user.department || '-'}</TableCell>
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
                                                                setSelectedUser(user)
                                                                setIsViewDialogOpen(true)
                                                            }}
                                                        >
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setEditPassword('')
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
                                                                setSelectedUser(user)
                                                                setIsDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
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
                            Showing {users.length} of {totalUsersCount} users
                        </p>
                        {isFetchingNextPage && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Loading more...
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Class Management Dialog */}
            <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>Class Management</DialogTitle>
                        <DialogDescription>
                            Add or remove classes and sections for the selected academic year.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="academic-year">Academic Year</Label>
                            <Select value={academicYear} onValueChange={setAcademicYear}>
                                <SelectTrigger id="academic-year" className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center gap-2">
                            <Select
                                value={newGrade ? newGrade.toString() : ''}
                                onValueChange={(value) => setNewGrade(parseInt(value, 10))}
                            >
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Add Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableGrades.length === 0 && (
                                        <SelectItem value="none" disabled>No grades left</SelectItem>
                                    )}
                                    {availableGrades.map(grade => (
                                        <SelectItem key={grade} value={grade.toString()}>
                                            {catalogClassNameByGrade.get(grade) || `Class ${grade}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddGrade}
                                disabled={!newGrade || createClass.isPending}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Class
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Class options are loaded from centralized backend catalog.
                    </p>

                    <ScrollArea className="h-[420px] pr-4">
                        <div className="space-y-4">
                            {classesLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading classes...
                                </div>
                            ) : classesByGrade.size === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 md:p-8 text-center text-muted-foreground">
                                    No classes found for this academic year. Add a class to get started.
                                </div>
                            ) : (
                                Array.from(classesByGrade.entries())
                                    .sort((a, b) => a[0] - b[0])
                                    .map(([grade, gradeClasses]) => (
                                        <div key={grade} className="rounded-lg border p-4">
                                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Class</p>
                                                    <p className="text-lg font-semibold">
                                                        {gradeClasses[0]?.name || catalogClassNameByGrade.get(grade) || `Class ${grade}`}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAddSection(grade)}
                                                        disabled={createClass.isPending}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Section
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleShorten(grade)}
                                                        disabled={deleteClass.isPending}
                                                    >
                                                        <Minus className="mr-2 h-4 w-4" />
                                                        Shorten
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {gradeClasses.map((cls) => (
                                                    <div key={cls.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                                                        {editingSection?.id === cls.id ? (
                                                            <>
                                                                <Input
                                                                    value={editingSection.value}
                                                                    onChange={(e) => setEditingSection({ id: cls.id, value: e.target.value })}
                                                                    className="h-7 w-20"
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleRenameSection(cls)}
                                                                    disabled={updateClass.isPending}
                                                                >
                                                                    <Check className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingSection(null)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span className="font-medium">{cls.section || '-'}</span>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => setEditingSection({ id: cls.id, value: cls.section || '' })}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    onClick={() => handleRemoveSection(cls)}
                                                                    disabled={deleteClass.isPending}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant={cls.class_teacher_id ? "default" : "outline"}
                                                                    onClick={() => openInchargeDialog(cls)}
                                                                >
                                                                    {cls.class_teacher_name?.trim() || 'Not Assigned'}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Sections follow A, B, C... Z, AA, AB patterns. You can also type custom labels like AA or AAA.
                                            </p>
                                        </div>
                                    ))
                            )}
                        </div>
                    </ScrollArea>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isInchargeDialogOpen}
                onOpenChange={(open) => {
                    setIsInchargeDialogOpen(open)
                    if (!open) {
                        setSelectedClassForIncharge(null)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[560px]">
                    <DialogHeader>
                        <DialogTitle>Assign Class Incharge</DialogTitle>
                        <DialogDescription>
                            {selectedClassForIncharge
                                ? `Class ${selectedClassForIncharge.grade}${selectedClassForIncharge.section ? `-${selectedClassForIncharge.section}` : ''}`
                                : 'Select a teacher for this class'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search teacher by name or email"
                                value={teacherSearch}
                                onChange={(e) => setTeacherSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>

                        <ScrollArea className="h-[260px] rounded-md border">
                            <div className="p-2 space-y-2">
                                {isClassInchargeTeachersLoading ? (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Loading teachers...
                                    </div>
                                ) : classInchargeTeachers.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-muted-foreground">
                                        No teachers found.
                                    </div>
                                ) : (
                                    classInchargeTeachers.map((teacher) => (
                                        <div key={teacher.id} className="flex items-center justify-between rounded-md border p-3">
                                            <div>
                                                <p className="font-medium">{teacher.name}</p>
                                                <p className="text-xs text-muted-foreground">{teacher.email}</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAssignIncharge(teacher.id)}
                                                disabled={updateClass.isPending}
                                            >
                                                Select
                                            </Button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="gap-2">
                        {selectedClassForIncharge?.class_teacher_id && (
                            <Button
                                variant="outline"
                                onClick={handleClearIncharge}
                                disabled={updateClass.isPending}
                            >
                                Not Assigned
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setIsInchargeDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Details</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={selectedUser.avatar} />
                                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xl">
                                        {getInitials(selectedUser.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-xl font-bold">{selectedUser.full_name}</h3>
                                    <p className="text-muted-foreground">{selectedUser.email}</p>
                                    <Badge variant={getRoleBadgeVariant(selectedUser.role)} className="mt-2 gap-1">
                                        {getRoleIcon(selectedUser.role)}
                                        <span className="capitalize">{selectedUser.role}</span>
                                    </Badge>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-3 rounded-lg bg-muted">
                                    <p className="text-sm text-muted-foreground">Phone</p>
                                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                                </div>
                                {selectedUser.department && (
                                    <div className="p-3 rounded-lg bg-muted">
                                        <p className="text-sm text-muted-foreground">Department</p>
                                        <p className="font-medium">{selectedUser.department}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog
                open={isEditDialogOpen}
                onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) {
                        setEditPassword('')
                        setShowEditPassword(false)
                    }
                }}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update user information.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="edit-name">Full Name</Label>
                                <Input
                                    id="edit-name"
                                    value={selectedUser.full_name}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, full_name: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-email">Email Address</Label>
                                <Input
                                    id="edit-email"
                                    type="email"
                                    value={selectedUser.email}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-role">Role</Label>
                                <Select
                                    value={selectedUser.role}
                                    onValueChange={(value: 'admin' | 'teacher' | 'student' | 'staff') =>
                                        setSelectedUser({ ...selectedUser, role: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="teacher">Teacher</SelectItem>
                                        <SelectItem value="student">Student</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-phone">Phone Number</Label>
                                <Input
                                    id="edit-phone"
                                    type="tel"
                                    inputMode="numeric"
                                    maxLength={10}
                                    placeholder="10-digit mobile number"
                                    value={selectedUser.phone || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-department">Department</Label>
                                <Input
                                    id="edit-department"
                                    value={selectedUser.department || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="edit-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="edit-password"
                                        type={showEditPassword ? "text" : "password"}
                                        value={editPassword}
                                        onChange={(e) => setEditPassword(e.target.value)}
                                        placeholder="Leave blank to keep current password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEditPassword((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        aria-label={showEditPassword ? "Hide password" : "Show password"}
                                    >
                                        {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditUser}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{' '}
                            <span className="font-semibold">{selectedUser?.full_name}</span>'s account and
                            remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Add User Dialog */}
            <Dialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open)
                    if (!open) setShowAddPassword(false)
                }}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>
                            Create a new user account.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="add-name">Full Name</Label>
                            <Input
                                id="add-name"
                                value={newUser.name}
                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-email">Email Address</Label>
                            <Input
                                id="add-email"
                                type="email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                placeholder="john@school.com"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-role">Role</Label>
                            <Select
                                value={newUser.role}
                                onValueChange={(value) => setNewUser({ ...newUser, role: value as any })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-phone">Phone Number</Label>
                            <Input
                                id="add-phone"
                                type="tel"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="10-digit mobile number"
                                value={newUser.phone}
                                onChange={(e) => setNewUser({ ...newUser, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="add-password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="add-password"
                                    type={showAddPassword ? "text" : "password"}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    placeholder="Minimum 6 characters"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowAddPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showAddPassword ? "Hide password" : "Show password"}
                                >
                                    {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleAddUser}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
