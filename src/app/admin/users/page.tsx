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
    EyeOff,
    AlertTriangle,
} from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { toast } from 'sonner'
import { useUsers, useUserStats, useCreateUser, useUpdateUser, useDeleteUser, useSuspendUser, useUnsuspendUser, AdminUser } from '@/hooks/useAdminUsers'
import { useStaff, useCreateStaff } from '@/hooks/useAdminStaff'
import { Staff } from '@/types'
import { useClasses, useCreateClass, useDeleteClass, useUpdateClass, SchoolClass } from '@/hooks/useClasses'
import { useAdminCatalogClasses } from '@/hooks/useAdminCatalogClasses'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useQuery, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Separator } from '@/components/ui/separator'
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

// ─── Profile interfaces ──────────────────────────────────────────────────────
interface StudentProfile {
    id: string
    user_id: string
    admission_number?: string
    roll_number?: string
    class_id?: string
    class_name?: string
    section?: string
    gender?: string
    date_of_birth?: string
    blood_group?: string
    address?: string
    parent_name?: string
    parent_email?: string
    parent_phone?: string
    emergency_contact?: string
    admission_date?: string
    academic_year?: string
    bus_route_id?: string
    transport_mode?: string
}

interface TeacherProfileDetail {
    id: string
    userId: string
    employeeId?: string
    department?: string
    designation?: string
    qualifications?: string[]
    subjects?: string[]
    experience?: number
    joinDate?: string
    salary?: number
    status?: string
    classes?: string[]
}

interface BusRoute {
    id: string
    route_name: string
    description?: string
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

export default function UsersPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState<string>('all')
    const [isClassDialogOpen, setIsClassDialogOpen] = useState(false)
    const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear())
    const [newClassName, setNewClassName] = useState<string | null>(null)
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
    } = useUsers(roleFilter, debouncedSearch, pageSize, roleFilter !== 'staff')

    const {
        data: staffData,
        isLoading: isStaffLoading,
        fetchNextPage: fetchNextStaffPage,
        hasNextPage: hasNextStaffPage,
        isFetchingNextPage: isFetchingNextStaffPage,
    } = useStaff(debouncedSearch, pageSize, undefined, undefined, { enabled: roleFilter === 'all' || roleFilter === 'staff' })

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
    const createStaff = useCreateStaff()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()
    const suspendUser = useSuspendUser()
    const unsuspendUser = useUnsuspendUser()

    const users = useMemo(() => {
        const allUsers = data?.pages.flatMap(page => page.users) || []
        const allStaff = staffData?.pages.flatMap(page => page.staff) || []
        const seen = new Set<string>()
        const uniqueUsers: AdminUser[] = []

        for (const user of allUsers) {
            if (!user?.id || seen.has(user.id)) continue
            seen.add(user.id)
            uniqueUsers.push(user)
        }

        for (const s of allStaff) {
            if (!s?.id || seen.has(s.id)) continue
            seen.add(s.id)
            uniqueUsers.push({
                id: s.id,
                email: s.email,
                full_name: s.name,
                role: 'staff',
                phone: s.phone || undefined,
                avatar: s.avatar || undefined,
                department: s.designation,
                designation: s.designation,
                is_suspended: false,
                created_at: s.joinDate || '',
            })
        }

        return uniqueUsers.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', undefined, { sensitivity: 'base' }))
    }, [data, staffData])
    const totalUsersCount = data?.pages[0]?.total || 0
    const classes = classesData?.classes || []
    const catalogClasses = catalogClassesData?.classes || []

    // Infinite Scroll Logic (Intersection Observer)
    const { ref: scrollRef, inView } = useIntersectionObserver({ threshold: 0.1 })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
        if (inView && hasNextStaffPage && !isFetchingNextStaffPage) {
            fetchNextStaffPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, hasNextStaffPage, isFetchingNextStaffPage, fetchNextStaffPage])

    const filteredUsers = users
    const isAnyLoading = isLoading || isStaffLoading
    const fetchTriggerIndex = filteredUsers.length > 0 ? Math.max(0, Math.floor(filteredUsers.length * 0.8) - 1) : -1

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false)
    const [suspendAction, setSuspendAction] = useState<'suspend' | 'unsuspend'>('suspend')
    const [suspendPassword, setSuspendPassword] = useState('')
    const [showSuspendPassword, setShowSuspendPassword] = useState(false)
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
    const [editStudentForm, setEditStudentForm] = useState({
        profileId: '', admissionNumber: '', rollNumber: '', classId: '',
        gender: '', dateOfBirth: '', bloodGroup: '', address: '',
        parentName: '', parentEmail: '', parentPhone: '', emergencyContact: '',
        admissionDate: '', academicYear: '', busRouteId: '', transportMode: ''
    })
    const [editTeacherForm, setEditTeacherForm] = useState({
        profileId: '', employeeId: '', department: '', designation: '',
        qualificationsStr: '', subjectsStr: '', experience: '', hireDate: '', salary: '', status: ''
    })

    // ─── Profile queries (after selectedUser + dialog state are declared) ─────
    const { data: studentProfileData } = useQuery({
        queryKey: ['admin-student-profile', selectedUser?.id],
        enabled: !!(selectedUser?.role === 'student' && (isViewDialogOpen || isEditDialogOpen)),
        queryFn: async () => {
            const res = await api.get<{ student: StudentProfile | null }>(`/admin/students/by-user/${selectedUser!.id}`)
            return res.student
        },
        staleTime: 60 * 1000,
    })

    const { data: teacherProfileData } = useQuery({
        queryKey: ['admin-teacher-profile', selectedUser?.id],
        enabled: !!(selectedUser?.role === 'teacher' && (isViewDialogOpen || isEditDialogOpen)),
        queryFn: async () => {
            const res = await api.get<{ teacher: TeacherProfileDetail | null }>(`/admin/teachers/by-user/${selectedUser!.id}`)
            return res.teacher
        },
        staleTime: 60 * 1000,
    })

    const { data: busRoutesData = [] } = useQuery({
        queryKey: ['admin-bus-routes'],
        enabled: !!(selectedUser?.role === 'student' && isEditDialogOpen),
        queryFn: async () => {
            const res = await api.get<{ bus_routes: BusRoute[] }>('/admin/bus-routes')
            return res.bus_routes || []
        },
        staleTime: 5 * 60 * 1000,
    })

    // ─── Profile mutations ────────────────────────────────────────────────────
    const updateStudentProfile = useMutation({
        mutationFn: async (payload: { id: string } & Record<string, unknown>) => {
            const { id, ...body } = payload
            return api.put(`/admin/students/${id}`, body)
        },
        onSuccess: () => toast.success('Student profile updated'),
        onError: (e: Error) => toast.error('Failed to update student profile', { description: e.message }),
    })

    const updateTeacherProfile = useMutation({
        mutationFn: async (payload: { id: string } & Record<string, unknown>) => {
            const { id, ...body } = payload
            return api.put(`/admin/teachers/${id}`, body)
        },
        onSuccess: () => toast.success('Teacher profile updated'),
        onError: (e: Error) => toast.error('Failed to update teacher profile', { description: e.message }),
    })

    // Sync student profile → edit form when edit dialog opens
    useEffect(() => {
        if (isEditDialogOpen && selectedUser?.role === 'student' && studentProfileData) {
            setEditStudentForm({
                profileId: studentProfileData.id,
                admissionNumber: studentProfileData.admission_number || '',
                rollNumber: studentProfileData.roll_number || '',
                classId: studentProfileData.class_id || '',
                gender: studentProfileData.gender || '',
                dateOfBirth: studentProfileData.date_of_birth?.slice(0, 10) || '',
                bloodGroup: studentProfileData.blood_group || '',
                address: studentProfileData.address || '',
                parentName: studentProfileData.parent_name || '',
                parentEmail: studentProfileData.parent_email || '',
                parentPhone: studentProfileData.parent_phone || '',
                emergencyContact: studentProfileData.emergency_contact || '',
                admissionDate: studentProfileData.admission_date?.slice(0, 10) || '',
                academicYear: studentProfileData.academic_year || '',
                busRouteId: studentProfileData.bus_route_id || '',
                transportMode: studentProfileData.transport_mode || '',
            })
        }
    }, [isEditDialogOpen, selectedUser?.role, studentProfileData])

    // Sync teacher profile → edit form when edit dialog opens
    useEffect(() => {
        if (isEditDialogOpen && selectedUser?.role === 'teacher' && teacherProfileData) {
            setEditTeacherForm({
                profileId: teacherProfileData.id,
                employeeId: teacherProfileData.employeeId || '',
                department: teacherProfileData.department || '',
                designation: teacherProfileData.designation || '',
                qualificationsStr: (teacherProfileData.qualifications || []).join(', '),
                subjectsStr: (teacherProfileData.subjects || []).join(', '),
                experience: teacherProfileData.experience ? String(teacherProfileData.experience) : '',
                hireDate: teacherProfileData.joinDate?.slice(0, 10) || '',
                salary: teacherProfileData.salary ? String(teacherProfileData.salary) : '',
                status: teacherProfileData.status || '',
            })
        }
    }, [isEditDialogOpen, selectedUser?.role, teacherProfileData])

    const [newUser, setNewUser] = useState<{
        name: string;
        email: string;
        role: string;
        phone: string;
        department: string;
        password: string;
        designation: string;
        qualification: string;
    }>({
        name: '',
        email: '',
        role: 'student',
        phone: '',
        department: '',
        password: '',
        designation: '',
        qualification: '',
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

        // Fire profile mutation alongside the user update (fire-and-forget)
        if (selectedUser.role === 'student' && editStudentForm.profileId) {
            updateStudentProfile.mutate({
                id: editStudentForm.profileId,
                admission_number: editStudentForm.admissionNumber || undefined,
                roll_number: editStudentForm.rollNumber || undefined,
                class_id: editStudentForm.classId || undefined,
                gender: editStudentForm.gender || undefined,
                date_of_birth: editStudentForm.dateOfBirth || undefined,
                blood_group: editStudentForm.bloodGroup || undefined,
                address: editStudentForm.address || undefined,
                parent_name: editStudentForm.parentName || undefined,
                parent_email: editStudentForm.parentEmail || undefined,
                parent_phone: editStudentForm.parentPhone || undefined,
                emergency_contact: editStudentForm.emergencyContact || undefined,
                transport_mode: editStudentForm.transportMode || undefined,
                bus_route_id: editStudentForm.busRouteId || undefined,
                academic_year: editStudentForm.academicYear || undefined,
            })
        }

        if (selectedUser.role === 'teacher' && editTeacherForm.profileId) {
            updateTeacherProfile.mutate({
                id: editTeacherForm.profileId,
                employee_id: editTeacherForm.employeeId || undefined,
                department: editTeacherForm.department || undefined,
                designation: editTeacherForm.designation || undefined,
                experience_years: editTeacherForm.experience ? parseInt(editTeacherForm.experience) : undefined,
                hire_date: editTeacherForm.hireDate || undefined,
                salary: editTeacherForm.salary ? parseFloat(editTeacherForm.salary) : undefined,
                status: editTeacherForm.status || undefined,
                qualifications: editTeacherForm.qualificationsStr ? editTeacherForm.qualificationsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined,
                subjects_taught: editTeacherForm.subjectsStr ? editTeacherForm.subjectsStr.split(',').map(s => s.trim()).filter(Boolean) : undefined,
            })
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

        const resetForm = () => {
            setIsAddDialogOpen(false)
            setNewUser({ name: '', email: '', role: 'student', phone: '', department: '', password: '', designation: '', qualification: '' })
            setShowAddPassword(false)
        }

        if (newUser.role === 'staff') {
            if (!newUser.designation.trim()) {
                toast.error('Missing fields', { description: 'Designation is required for staff' })
                return
            }
            createStaff.mutate({
                full_name: trimmedName,
                email: trimmedEmail,
                password: trimmedPassword,
                phone: newUser.phone.trim(),
                designation: newUser.designation.trim(),
                qualification: newUser.qualification.trim(),
                staffType: 'non-teaching',
            }, { onSuccess: resetForm })
            return
        }

        createUser.mutate({
            full_name: trimmedName,
            email: trimmedEmail,
            role: newUser.role,
            phone: newUser.phone.trim(),
            department: newUser.department.trim(),
            password: trimmedPassword,
        }, {
            onSuccess: resetForm
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

    const handleSuspendAction = () => {
        if (!selectedUser || !suspendPassword) return
        const mutate = suspendAction === 'suspend' ? suspendUser : unsuspendUser
        mutate.mutate(
            { id: selectedUser.id, password: suspendPassword },
            {
                onSuccess: () => {
                    setIsSuspendDialogOpen(false)
                    setSuspendPassword('')
                },
            }
        )
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin':
                return <Shield className="h-4 w-4" />
            case 'teacher':
                return <BookOpen className="h-4 w-4" />
            case 'student':
                return <GraduationCap className="h-4 w-4" />
            case 'staff':
                return <Briefcase className="h-4 w-4" />
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
            case 'staff':
                return 'secondary'
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

    const classesByName = useMemo(() => {
        const map = new Map<string, SchoolClass[]>()
        for (const cls of classes) {
            const list = map.get(cls.name) || []
            list.push(cls)
            map.set(cls.name, list)
        }
        for (const [name, list] of map.entries()) {
            list.sort((a, b) => sectionToNumber(a.section) - sectionToNumber(b.section))
            map.set(name, list)
        }
        return map
    }, [classes])

    const availableNames = useMemo(() => {
        const existing = new Set(classes.map(c => c.name))
        return catalogClasses
            .map(item => item.name)
            .filter(name => !existing.has(name))
    }, [catalogClasses, classes])

    const handleAddSection = (name: string) => {
        const nameClasses = classesByName.get(name) || []
        const existingLabels = nameClasses.map(c => c.section || '')
        const nextLabel = getNextSectionLabel(existingLabels)
        createClass.mutate({
            name,
            section: nextLabel,
            academic_year: academicYear,
        })
    }

    const handleRemoveSection = (cls: SchoolClass) => {
        deleteClass.mutate(cls.id)
    }

    const handleShorten = (name: string) => {
        const nameClasses = classesByName.get(name) || []
        if (nameClasses.length === 0) return
        const last = nameClasses[nameClasses.length - 1]
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

    const handleAddClass = () => {
        if (newClassName === null) return
        handleAddSection(newClassName)
        setNewClassName(null)
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
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
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
            <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
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
                    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                        <div className="relative flex-1 min-w-0 md:max-w-sm">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="Role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                className="w-full sm:w-10"
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
                                {isAnyLoading ? (
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
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{user.full_name}</p>
                                                            {user.is_suspended && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-orange-400 text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400">
                                                                    Suspended
                                                                </Badge>
                                                            )}
                                                        </div>
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
                                                        {((user as AdminUser & { rating?: string | number }).rating ?? '0.0')} ★
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{user.phone || '-'}</TableCell>
                                            <TableCell>{user.department || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-end gap-1">
                                                    {(!user.phone || (user.role === 'teacher' && (!user.department || user.department === 'General')) || (user.role === 'student' && (!user.class_name || !user.roll_number || !user.parent_name || !user.parent_phone)) || (user.role === 'staff' && !user.designation)) && (
                                                        <div className="group relative">
                                                            <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center cursor-help">
                                                                <AlertTriangle className="h-3 w-3 text-destructive" />
                                                            </div>
                                                            <div className="absolute bottom-full right-0 mb-2 hidden w-48 rounded bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:block border z-50">
                                                                <p className="font-semibold mb-1 text-destructive">Missing Info:</p>
                                                                <ul className="list-disc pl-3 space-y-0.5">
                                                                    {!user.phone && <li>Phone</li>}
                                                                    {user.role === 'teacher' && (!user.department || user.department === 'General') && <li>Department</li>}
                                                                    {user.role === 'student' && !user.class_name && <li>Class</li>}
                                                                    {user.role === 'student' && !user.roll_number && <li>Roll Number</li>}
                                                                    {user.role === 'student' && !user.parent_name && <li>Parent Name</li>}
                                                                    {user.role === 'student' && !user.parent_phone && <li>Parent Phone</li>}
                                                                    {user.role === 'staff' && !user.designation && <li>Designation</li>}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
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
                                                        {user.role !== 'staff' && (<>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setSelectedUser(user)
                                                                setSuspendAction(user.is_suspended ? 'unsuspend' : 'suspend')
                                                                setSuspendPassword('')
                                                                setShowSuspendPassword(false)
                                                                setIsSuspendDialogOpen(true)
                                                            }}
                                                            className={user.is_suspended ? 'text-green-600' : 'text-orange-600'}
                                                        >
                                                            {user.is_suspended ? (
                                                                <><Unlock className="mr-2 h-4 w-4" />Remove Suspend</>
                                                            ) : (
                                                                <><Lock className="mr-2 h-4 w-4" />Suspend User</>
                                                            )}
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
                                                        </>)}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                </div>
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
                <DialogContent className="w-[95vw] sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Class Management</DialogTitle>
                        <DialogDescription>
                            Add or remove classes and sections for the selected academic year.
                        </DialogDescription>
                    </DialogHeader>

                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Label htmlFor="academic-year">Academic Year</Label>
                                <Select value={academicYear} onValueChange={setAcademicYear}>
                                    <SelectTrigger id="academic-year" className="w-full sm:w-[160px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                <SelectContent>
                                    {academicYears.map(year => (
                                        <SelectItem key={year} value={year}>{year}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <Select
                                value={newClassName ?? ''}
                                onValueChange={(value) => setNewClassName(value)}
                            >
                                <SelectTrigger className="w-full sm:w-[140px]">
                                    <SelectValue placeholder="Add Class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableNames.length === 0 && (
                                        <SelectItem value="none" disabled>No classes left</SelectItem>
                                    )}
                                    {availableNames.map(name => (
                                        <SelectItem key={name} value={name}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                onClick={handleAddClass}
                                disabled={newClassName === null || createClass.isPending}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Class
                            </Button>
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Class options are loaded from centralized backend catalog.
                    </p>

                    <ScrollArea className="h-[50vh] sm:h-[420px] pr-4">
                        <div className="space-y-4">
                            {classesLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground">
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Loading classes...
                                </div>
                            ) : classesByName.size === 0 ? (
                                <div className="rounded-lg border border-dashed p-4 md:p-8 text-center text-muted-foreground">
                                    No classes found for this academic year. Add a class to get started.
                                </div>
                            ) : (
                                Array.from(classesByName.entries())
                                    .sort((a, b) => a[0].localeCompare(b[0]))
                                    .map(([name, nameClasses]) => (
                                        <div key={name} className="rounded-lg border p-4">
                                            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Class</p>
                                                    <p className="text-lg font-semibold">
                                                        {name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAddSection(name)}
                                                        disabled={createClass.isPending}
                                                    >
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Add Section
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleShorten(name)}
                                                        disabled={deleteClass.isPending}
                                                    >
                                                        <Minus className="mr-2 h-4 w-4" />
                                                        Shorten
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {nameClasses.map((cls) => (
                                                    <div key={cls.id} className="flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-sm">
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

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsClassDialogOpen(false)}>
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
                <DialogContent className="w-[95vw] sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
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
                                        <div key={teacher.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-md border p-3">
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

                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        {selectedClassForIncharge?.class_teacher_id && (
                            <Button
                                className="w-full sm:w-auto"
                                variant="outline"
                                onClick={handleClearIncharge}
                                disabled={updateClass.isPending}
                            >
                                Not Assigned
                            </Button>
                        )}
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsInchargeDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="w-[95vw] sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
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

                            {/* Student profile section */}
                            {selectedUser.role === 'student' && studentProfileData && (
                                <>
                                    <Separator />
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Student Profile</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Admission No.', value: studentProfileData.admission_number },
                                            { label: 'Roll No.', value: studentProfileData.roll_number },
                                            { label: 'Class', value: studentProfileData.class_name },
                                            { label: 'Gender', value: studentProfileData.gender },
                                            { label: 'Date of Birth', value: studentProfileData.date_of_birth?.slice(0, 10) },
                                            { label: 'Blood Group', value: studentProfileData.blood_group },
                                            { label: 'Academic Year', value: studentProfileData.academic_year },
                                            { label: 'Transport Mode', value: studentProfileData.transport_mode },
                                            { label: 'Address', value: studentProfileData.address },
                                            { label: 'Parent / Guardian', value: studentProfileData.parent_name },
                                            { label: 'Parent Email', value: studentProfileData.parent_email },
                                            { label: 'Parent Phone', value: studentProfileData.parent_phone },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-3 rounded-lg bg-muted">
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                                <p className="text-sm font-medium break-words">{value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Teacher profile section */}
                            {selectedUser.role === 'teacher' && teacherProfileData && (
                                <>
                                    <Separator />
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Teacher Profile</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { label: 'Employee ID', value: teacherProfileData.employeeId },
                                            { label: 'Department', value: teacherProfileData.department },
                                            { label: 'Designation', value: teacherProfileData.designation },
                                            { label: 'Experience (yrs)', value: teacherProfileData.experience != null ? String(teacherProfileData.experience) : undefined },
                                            { label: 'Hire Date', value: teacherProfileData.joinDate?.slice(0, 10) },
                                            { label: 'Status', value: teacherProfileData.status },
                                            { label: 'Subjects', value: (teacherProfileData.subjects || []).join(', ') || undefined },
                                            { label: 'Classes', value: (teacherProfileData.classes || []).join(', ') || undefined },
                                            { label: 'Qualifications', value: (teacherProfileData.qualifications || []).join(', ') || undefined },
                                        ].map(({ label, value }) => (
                                            <div key={label} className="p-3 rounded-lg bg-muted">
                                                <p className="text-xs text-muted-foreground">{label}</p>
                                                <p className="text-sm font-medium break-words">{value || '—'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsViewDialogOpen(false)}>
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
                <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                                    <SelectTrigger className="w-full">
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

                            {/* ── Student profile edit section ── */}
                            {selectedUser.role === 'student' && (
                                <>
                                    <Separator className="my-1" />
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Student Profile</p>

                                    {/* Academic Info */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Academic Info</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Admission No.</Label>
                                            <Input value={editStudentForm.admissionNumber} onChange={e => setEditStudentForm(f => ({ ...f, admissionNumber: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Roll No.</Label>
                                            <Input value={editStudentForm.rollNumber} onChange={e => setEditStudentForm(f => ({ ...f, rollNumber: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Class</Label>
                                            <Select value={editStudentForm.classId || '__none__'} onValueChange={v => setEditStudentForm(f => ({ ...f, classId: v === '__none__' ? '' : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>{cls.name}{cls.section ? ` - ${cls.section}` : ''}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Academic Year</Label>
                                            <Input value={editStudentForm.academicYear} onChange={e => setEditStudentForm(f => ({ ...f, academicYear: e.target.value }))} placeholder="e.g. 2025-2026" />
                                        </div>
                                    </div>

                                    {/* Personal Details */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Personal Details</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Gender</Label>
                                            <Select value={editStudentForm.gender || '__none__'} onValueChange={v => setEditStudentForm(f => ({ ...f, gender: v === '__none__' ? '' : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Date of Birth</Label>
                                            <Input type="date" value={editStudentForm.dateOfBirth} onChange={e => setEditStudentForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Blood Group</Label>
                                            <Input value={editStudentForm.bloodGroup} onChange={e => setEditStudentForm(f => ({ ...f, bloodGroup: e.target.value }))} placeholder="e.g. A+" />
                                        </div>
                                        <div className="col-span-2 grid gap-1">
                                            <Label>Address</Label>
                                            <Input value={editStudentForm.address} onChange={e => setEditStudentForm(f => ({ ...f, address: e.target.value }))} />
                                        </div>
                                    </div>

                                    {/* Parent & Contact */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Parent &amp; Contact</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Parent / Guardian</Label>
                                            <Input value={editStudentForm.parentName} onChange={e => setEditStudentForm(f => ({ ...f, parentName: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Parent Email</Label>
                                            <Input type="email" value={editStudentForm.parentEmail} onChange={e => setEditStudentForm(f => ({ ...f, parentEmail: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Parent Phone</Label>
                                            <Input value={editStudentForm.parentPhone} onChange={e => setEditStudentForm(f => ({ ...f, parentPhone: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Emergency Contact</Label>
                                            <Input value={editStudentForm.emergencyContact} onChange={e => setEditStudentForm(f => ({ ...f, emergencyContact: e.target.value }))} />
                                        </div>
                                    </div>

                                    {/* Transport */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Transport</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Transport Mode</Label>
                                            <Select value={editStudentForm.transportMode || '__none__'} onValueChange={v => setEditStudentForm(f => ({ ...f, transportMode: v === '__none__' ? '' : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    <SelectItem value="school_bus">School Bus</SelectItem>
                                                    <SelectItem value="private">Private</SelectItem>
                                                    <SelectItem value="walking">Walking</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Bus Route</Label>
                                            <Select value={editStudentForm.busRouteId || '__none__'} onValueChange={v => setEditStudentForm(f => ({ ...f, busRouteId: v === '__none__' ? '' : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    {busRoutesData.map((r: BusRoute) => <SelectItem key={r.id} value={r.id}>{r.route_name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* ── Teacher profile edit section ── */}
                            {selectedUser.role === 'teacher' && (
                                <>
                                    <Separator className="my-1" />
                                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Teacher Profile</p>

                                    {/* Professional Info */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Professional Info</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Employee ID</Label>
                                            <Input value={editTeacherForm.employeeId} onChange={e => setEditTeacherForm(f => ({ ...f, employeeId: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Department</Label>
                                            <Input value={editTeacherForm.department} onChange={e => setEditTeacherForm(f => ({ ...f, department: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Designation</Label>
                                            <Input value={editTeacherForm.designation} onChange={e => setEditTeacherForm(f => ({ ...f, designation: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Experience (yrs)</Label>
                                            <Input type="number" min={0} value={editTeacherForm.experience} onChange={e => setEditTeacherForm(f => ({ ...f, experience: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Hire Date</Label>
                                            <Input type="date" value={editTeacherForm.hireDate} onChange={e => setEditTeacherForm(f => ({ ...f, hireDate: e.target.value }))} />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Status</Label>
                                            <Select value={editTeacherForm.status || '__none__'} onValueChange={v => setEditTeacherForm(f => ({ ...f, status: v === '__none__' ? '' : v }))}>
                                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">None</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                    <SelectItem value="on_leave">On Leave</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Qualifications */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Qualifications</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid gap-3">
                                        <div className="grid gap-1">
                                            <Label>Qualifications <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                                            <Input value={editTeacherForm.qualificationsStr} onChange={e => setEditTeacherForm(f => ({ ...f, qualificationsStr: e.target.value }))} placeholder="B.Ed, M.Sc" />
                                        </div>
                                        <div className="grid gap-1">
                                            <Label>Subjects Taught <span className="text-muted-foreground text-xs">(comma-separated)</span></Label>
                                            <Input value={editTeacherForm.subjectsStr} onChange={e => setEditTeacherForm(f => ({ ...f, subjectsStr: e.target.value }))} placeholder="Math, Science" />
                                        </div>
                                    </div>

                                    {/* Personal & Salary */}
                                    <div className="flex items-center gap-2 mt-2">
                                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground whitespace-nowrap">Personal &amp; Salary</span>
                                        <div className="flex-1 h-px bg-border" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="grid gap-1">
                                            <Label>Salary</Label>
                                            <Input type="number" min={0} value={editTeacherForm.salary} onChange={e => setEditTeacherForm(f => ({ ...f, salary: e.target.value }))} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="w-full sm:w-auto" onClick={handleEditUser} disabled={updateUser.isPending || updateStudentProfile.isPending || updateTeacherProfile.isPending}>
                            {(updateUser.isPending || updateStudentProfile.isPending || updateTeacherProfile.isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
                        </Button>
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
                            <span className="font-semibold">{selectedUser?.full_name}</span>&apos;s account and
                            remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteUser}
                            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Suspend / Unsuspend Confirmation */}
            <Dialog
                open={isSuspendDialogOpen}
                onOpenChange={(open) => {
                    setIsSuspendDialogOpen(open)
                    if (!open) { setSuspendPassword(''); setShowSuspendPassword(false) }
                }}
            >
                <DialogContent className="w-[95vw] sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className={suspendAction === 'suspend' ? 'text-orange-600' : 'text-green-600'}>
                            {suspendAction === 'suspend' ? 'Suspend User' : 'Remove Suspension'}
                        </DialogTitle>
                        <DialogDescription>
                            {suspendAction === 'suspend' ? (
                                <>
                                    <span className="font-semibold">{selectedUser?.full_name}</span> will be unable to log in.
                                    Their materials, documents, and quizzes are fully preserved and can be restored at any time.
                                </>
                            ) : (
                                <>Remove the suspension from <span className="font-semibold">{selectedUser?.full_name}</span>. They will be able to log in again immediately.</>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <Label htmlFor="suspend-password">Your password to confirm</Label>
                        <div className="relative">
                            <Input
                                id="suspend-password"
                                type={showSuspendPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={suspendPassword}
                                onChange={(e) => setSuspendPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && suspendPassword && handleSuspendAction()}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                onClick={() => setShowSuspendPassword(v => !v)}
                            >
                                {showSuspendPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            className="w-full sm:w-auto"
                            onClick={() => setIsSuspendDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={!suspendPassword || suspendUser.isPending || unsuspendUser.isPending}
                            onClick={handleSuspendAction}
                            className={`w-full sm:w-auto ${suspendAction === 'suspend' ? 'bg-orange-600 hover:bg-orange-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                            {(suspendUser.isPending || unsuspendUser.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {suspendAction === 'suspend' ? 'Suspend' : 'Remove Suspension'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add User Dialog */}
            <Dialog
                open={isAddDialogOpen}
                onOpenChange={(open) => {
                    setIsAddDialogOpen(open)
                    if (!open) setShowAddPassword(false)
                }}
            >
                <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
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
                                onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                            >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin</SelectItem>
                                    <SelectItem value="teacher">Teacher</SelectItem>
                                    <SelectItem value="student">Student</SelectItem>
                                    <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {newUser.role === 'staff' ? (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="add-designation">Designation <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="add-designation"
                                        value={newUser.designation}
                                        onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
                                        placeholder="e.g. Librarian, Driver, Security"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="add-qualification">Qualification</Label>
                                    <Input
                                        id="add-qualification"
                                        value={newUser.qualification}
                                        onChange={(e) => setNewUser({ ...newUser, qualification: e.target.value })}
                                        placeholder="e.g. B.Com, ITI"
                                    />
                                </div>
                            </>
                        ) : (
                            newUser.role !== 'student' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="add-dept">Department</Label>
                                    <Input
                                        id="add-dept"
                                        value={newUser.department}
                                        onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                                        placeholder="e.g. Mathematics"
                                    />
                                </div>
                            )
                        )}
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
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button className="w-full sm:w-auto" onClick={handleAddUser}>Create User</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

