"use client"

import { useState, useEffect } from 'react'
import { Plus, Search, Edit2, Trash2, MoreVertical, Mail, Phone as PhoneIcon, Eye, EyeOff } from 'lucide-react'
import { useInfiniteSchoolUsers, useCreateUser, useUpdateUser, useDeleteUser, User } from '@/hooks/useSchools'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
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


    const resetForm = () => {
        setFormData({ full_name: '', email: '', password: '', phone: '' })
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
        setIsDialogOpen(true)
    }



    const handleSubmit = async () => {
        try {
            if (editingUser) {
                if (formData.password && formData.password.length < 6) {
                    alert('Password must be at least 6 characters.')
                    return
                }
                // Update
                await updateUserMutation.mutateAsync({
                    id: editingUser.id,
                    school_id: schoolId,
                    full_name: formData.full_name,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password || undefined // Only send if changed
                })
            } else {
                if (!formData.password) {
                    alert('Password is required when creating a user.')
                    return
                }
                if (formData.password.length < 6) {
                    alert('Password must be at least 6 characters.')
                    return
                }
                // Create
                await createUserMutation.mutateAsync({
                    school_id: schoolId,
                    role: role,
                    full_name: formData.full_name,
                    email: formData.email,
                    password: formData.password,
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
        if (role === 'admin' && (usersData?.pages?.[0]?.total || 0) <= 1) {
            alert('Cannot delete the last admin of the school. At least one administrator is required.');
            return;
        }

        if (confirm(`Are you sure you want to delete ${user.full_name}? This action is permanent.`)) {
            try {
                await deleteUserMutation.mutateAsync({ userId: user.id, schoolId: schoolId })
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
                <DialogContent className="max-h-[85vh] overflow-y-auto">
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
                                    placeholder={editingUser ? "Leave empty to keep current" : "Minimum 6 characters"}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </button>
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
