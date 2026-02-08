"use client"

import { useRef, useEffect, useState } from 'react'
import { Plus, Search, Edit2, Trash2, MoreVertical, Mail, Phone as PhoneIcon, Eye, EyeOff } from 'lucide-react'
import { useInfiniteSchoolUsers, useCreateUser, useUpdateUser, useDeleteUser, User } from '@/hooks/useSchools'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useStudents, useStudentMutations, Student as StudentRecord } from '@/hooks/useAdminStudents'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'

interface UserManagementProps {
    role: 'admin' | 'teacher' | 'student';
    schoolId: string;
}

export function UserManagement({ role, schoolId }: UserManagementProps) {
    const {
        data: usersData,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInfiniteSchoolUsers(schoolId, role, 100)

    const { ref: observerRef, inView } = useIntersectionObserver({
        threshold: 0,
    })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const createUserMutation = useCreateUser()
    const updateUserMutation = useUpdateUser()
    const deleteUserMutation = useDeleteUser()
    const { updateStudent } = useStudentMutations()

    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    const [showPassword, setShowPassword] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        phone: '',
    })
    const [studentFormData, setStudentFormData] = useState({
        // Academic
        admission_number: '',
        class_id: '',
        roll_number: '',
        section: '',
        admission_date: '',
        academic_year: '',
        // Personal
        date_of_birth: '',
        gender: '',
        blood_group: '',
        address: '',
        // Parent & Contact
        parent_name: '',
        parent_phone: '',
        parent_email: '',
        emergency_contact: '',
    })
    const [studentSearch, setStudentSearch] = useState('')
    const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null)

    const { data: studentsData } = useStudents(studentSearch, 10, schoolId, {
        enabled: role === 'student' && isDialogOpen && !!studentSearch,
    })
    const students = studentsData?.pages.flatMap(page => page.students) || []

    const resetForm = () => {
        setFormData({ full_name: '', email: '', password: '', phone: '' })
        setStudentFormData({
            admission_number: '',
            class_id: '',
            roll_number: '',
            section: '',
            admission_date: '',
            academic_year: '',
            date_of_birth: '',
            gender: '',
            blood_group: '',
            address: '',
            parent_name: '',
            parent_phone: '',
            parent_email: '',
            emergency_contact: '',
        })
        setStudentSearch('')
        setSelectedStudent(null)
        setEditingUser(null)
    }

    const handleOpenChange = (open: boolean) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
    }

    const handleEditClick = (user: User) => {
        setEditingUser(user)
        setFormData({
            full_name: user.full_name,
            email: user.email,
            password: '', // Password empty on edit
            phone: user.phone || '',
        })
        if (role === 'student') {
            setStudentSearch(user.email)
        }
        setIsDialogOpen(true)
    }

    useEffect(() => {
        if (role !== 'student' || !editingUser) return

        const matched = students.find(s => s.user_id === editingUser.id || s.email === editingUser.email)
        if (!matched) return

        setSelectedStudent(matched)
        setStudentFormData({
            admission_number: matched.admission_number || '',
            class_id: matched.class_id || '',
            roll_number: matched.roll_number || '',
            section: matched.section || '',
            admission_date: matched.admission_date ? matched.admission_date.split('T')[0] : '',
            academic_year: matched.academic_year || '',
            date_of_birth: matched.date_of_birth ? matched.date_of_birth.split('T')[0] : '',
            gender: matched.gender || '',
            blood_group: matched.blood_group || '',
            address: matched.address || '',
            parent_name: matched.parent_name || '',
            parent_phone: matched.parent_phone || '',
            parent_email: matched.parent_email || '',
            emergency_contact: matched.emergency_contact || '',
        })
    }, [role, editingUser, students])

    const handleSubmit = async () => {
        try {
            if (editingUser) {
                // Update
                await updateUserMutation.mutateAsync({
                    id: editingUser.id,
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password || undefined // Only send if changed
                })

                if (role === 'student' && selectedStudent) {
                    const payload = {
                        full_name: formData.full_name,
                        email: formData.email,
                        admission_number: studentFormData.admission_number,
                        roll_number: studentFormData.roll_number || undefined,
                        class_id: studentFormData.class_id || undefined,
                        section: studentFormData.section || undefined,
                        admission_date: studentFormData.admission_date || undefined,
                        academic_year: studentFormData.academic_year || undefined,
                        date_of_birth: studentFormData.date_of_birth || undefined,
                        gender: studentFormData.gender || undefined,
                        blood_group: studentFormData.blood_group || undefined,
                        address: studentFormData.address || undefined,
                        parent_name: studentFormData.parent_name || undefined,
                        parent_phone: studentFormData.parent_phone || undefined,
                        parent_email: studentFormData.parent_email || undefined,
                        emergency_contact: studentFormData.emergency_contact || undefined,
                    }
                    await updateStudent({ id: selectedStudent.id, data: payload })
                }
            } else {
                // Create
                await createUserMutation.mutateAsync({
                    school_id: schoolId,
                    role: role,
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password || undefined, // will auto-gen if empty
                    phone: formData.phone
                })
            }
            setIsDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error('User management submission failed:', error)
            // Error is already toasted by mutation hooks
        }
    }

    const handleDelete = async (user: User) => {
        if (role === 'admin' && (usersData?.total || 0) <= 1) {
            alert('Cannot delete the last admin of the school. At least one administrator is required.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${user.full_name}? This action is permanent.`)) {
            try {
                await deleteUserMutation.mutateAsync(user.id)
            } catch (err) {
                // Error already handled in hook (onError)
                console.warn('Silent deletion error (likely already deleted):', err)
            }
        }
    }

    const allUsers = usersData?.pages.flatMap(page => page.users) || []
    const flatUsers = allUsers.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add {role.charAt(0).toUpperCase() + role.slice(1)}
                </Button>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900 max-h-[600px] overflow-y-auto" onScroll={(e) => {
                const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop === e.currentTarget.clientHeight;
                if (bottom && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            }}>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-10 w-[200px]" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                    <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : flatUsers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            <>
                                {flatUsers.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarFallback>{user.full_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="font-medium">{user.full_name}</div>
                                                    <div className="text-xs text-muted-foreground capitalize">{user.role}</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {user.email}
                                                </div>
                                                {user.phone && (
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <PhoneIcon className="h-3 w-3" />
                                                        {user.phone}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditClick(user)}>
                                                        <Edit2 className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {isFetchingNextPage && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-4">
                                            <div className="flex justify-center items-center gap-2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                Loading more...
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow ref={observerRef} />
                            </>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : `Add New ${role.charAt(0).toUpperCase() + role.slice(1)}`}</DialogTitle>
                        <DialogDescription>
                            {editingUser ? 'Update user credentials details.' : 'Enter details to create a new user account.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="full_name">Full Name</Label>
                            <Input
                                id="full_name"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password {editingUser && '(Leave empty to keep current)'}</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder={editingUser ? "Unchanged" : "Auto-generated if empty"}
                                    className="pr-10"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phone">Phone (Optional)</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {editingUser && role === 'student' && (
                        <div className="space-y-4 pt-2">
                            <div>
                                <DialogTitle>Edit Student Details</DialogTitle>
                                <DialogDescription>
                                    Update all student information.
                                </DialogDescription>
                            </div>

                            <Tabs defaultValue="academic" className="w-full">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="academic">Academic Info</TabsTrigger>
                                    <TabsTrigger value="personal">Personal Details</TabsTrigger>
                                    <TabsTrigger value="parent">Parent & Contact</TabsTrigger>
                                </TabsList>

                                <TabsContent value="academic" className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Admission Number</Label>
                                            <Input
                                                value={studentFormData.admission_number}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, admission_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Class ID</Label>
                                            <Input
                                                value={studentFormData.class_id}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, class_id: e.target.value })}
                                                placeholder="Class ID"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Roll Number</Label>
                                            <Input
                                                value={studentFormData.roll_number}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, roll_number: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Section</Label>
                                            <Select
                                                value={studentFormData.section}
                                                onValueChange={(val) => setStudentFormData({ ...studentFormData, section: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Section" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {['A', 'B', 'C', 'D', 'E'].map(s => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Admission Date</Label>
                                            <Input
                                                type="date"
                                                value={studentFormData.admission_date}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, admission_date: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Academic Year</Label>
                                            <Input
                                                value={studentFormData.academic_year}
                                                placeholder="e.g. 2024-2025"
                                                onChange={(e) => setStudentFormData({ ...studentFormData, academic_year: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="personal" className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Date of Birth</Label>
                                            <Input
                                                type="date"
                                                value={studentFormData.date_of_birth}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, date_of_birth: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Gender</Label>
                                            <Select
                                                value={studentFormData.gender}
                                                onValueChange={(val) => setStudentFormData({ ...studentFormData, gender: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Blood Group</Label>
                                        <Select
                                            value={studentFormData.blood_group}
                                            onValueChange={(val) => setStudentFormData({ ...studentFormData, blood_group: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                                                    <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Address</Label>
                                        <Input
                                            value={studentFormData.address}
                                            placeholder="Full residential address"
                                            onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="parent" className="space-y-4 py-4">
                                    <div className="grid gap-2">
                                        <Label>Parent/Guardian Name</Label>
                                        <Input
                                            value={studentFormData.parent_name}
                                            onChange={(e) => setStudentFormData({ ...studentFormData, parent_name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="grid gap-2">
                                            <Label>Parent Phone</Label>
                                            <Input
                                                value={studentFormData.parent_phone}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, parent_phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Parent Email</Label>
                                            <Input
                                                value={studentFormData.parent_email}
                                                onChange={(e) => setStudentFormData({ ...studentFormData, parent_email: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Emergency Contact</Label>
                                        <Input
                                            value={studentFormData.emergency_contact}
                                            placeholder="Alternative phone number"
                                            onChange={(e) => setStudentFormData({ ...studentFormData, emergency_contact: e.target.value })}
                                        />
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
