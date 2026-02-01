"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Shield, Plus, School as SchoolIcon, MapPin, Mail, Trash2, Edit, MoreVertical, Search, LogOut, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSchools, useCreateSchool, School } from '@/hooks/useSchools'
import { getInitials } from '@/lib/utils'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function SuperAdminPage() {
    const { user, logout } = useAuth()
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState('')
    const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false)

    // Form state for new school
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
    const [newSchool, setNewSchool] = useState<NewSchool>({
        name: '',
        address: '',
        contact_email: '',
        admins: [{ name: '', email: '', password: '' }]
    })
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const { data: schools = [], isLoading } = useSchools()
    const createSchool = useCreateSchool()

    const handleLogout = () => {
        logout()
        router.push('/login')
    }

    const filteredSchools = useMemo(() => {
        return schools.filter(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.contact_email?.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [schools, searchQuery])

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!regex.test(password)) {
            return "Password must be 8+ chars, incl. uppercase, lowercase, number, & special char.";
        }
        return "";
    }

    const handleCreateSchool = async () => {
        setValidationErrors({})
        const errors: Record<string, string> = {}
        let hasError = false

        if (!newSchool.name) {
            toast.error("School name is required")
            return
        }

        newSchool.admins.forEach((admin, index) => {
            if (!admin.name) errors[`admin_${index}_name`] = "Name is required"
            if (!admin.email) errors[`admin_${index}_email`] = "Email is required"

            if (!admin.password) {
                errors[`admin_${index}_password`] = "Password is required"
            } else {
                const passErr = validatePassword(admin.password)
                if (passErr) errors[`admin_${index}_password`] = passErr
            }

            if (Object.keys(errors).length > 0) hasError = true
        })

        if (hasError) {
            setValidationErrors(errors)
            return
        }

        try {
            await createSchool.mutateAsync(newSchool)
            setIsAddSchoolOpen(false)
            setNewSchool({ name: '', address: '', contact_email: '', admins: [{ name: '', email: '', password: '' }] })
            setValidationErrors({})
        } catch (e) {
            // Handled by hook
        }
    }

    const handleDeleteSchool = (id: string, name: string) => {
        // Implement delete hook
        toast.info("Delete functionality coming soon for " + name)
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Header */}
            <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Super Admin Console</h1>
                            <p className="text-xs text-slate-400">School & Access Overview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-indigo-800/50 rounded-full border border-indigo-700/50 shadow-inner">
                            <SchoolIcon className="h-4 w-4 text-indigo-300" />
                            <span className="text-sm font-medium text-indigo-100">
                                {schools.length} {schools.length === 1 ? 'School' : 'Schools'}
                            </span>
                        </div>
                        <div className="hidden md:flex flex-col items-end mr-2">
                            <span className="text-sm font-medium">{user?.name || 'Super Admin'}</span>
                            <span className="text-xs text-indigo-400">{user?.email}</span>
                        </div>
                        <Avatar className="border-2 border-indigo-500">
                            <AvatarImage src={user?.avatar} />
                            <AvatarFallback className="bg-indigo-700">SA</AvatarFallback>
                        </Avatar>
                        <Button variant="destructive" size="sm" onClick={handleLogout} className="ml-2">
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Stats Removed as per request */}

                {/* Toolbar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search schools..."
                            className="pl-10 bg-white"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Dialog open={isAddSchoolOpen} onOpenChange={setIsAddSchoolOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Add New School
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New School</DialogTitle>
                                <DialogDescription>
                                    Create a new school namespace. This will automatically create a default Admin account.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">School Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g. Springfield High"
                                        value={newSchool.name}
                                        onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input
                                        id="address"
                                        placeholder="123 Education Lane"
                                        value={newSchool.address}
                                        onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="contact">School Contact Email</Label>
                                    <Input
                                        id="contact"
                                        type="email"
                                        placeholder="info@school.com"
                                        value={newSchool.contact_email}
                                        onChange={(e) => setNewSchool({ ...newSchool, contact_email: e.target.value })}
                                    />
                                </div>

                                <div className="border-t pt-4 mt-2">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-medium text-indigo-600">Admin Accounts</h4>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setNewSchool({
                                                ...newSchool,
                                                admins: [...(newSchool.admins || []), { name: '', email: '', password: '' }]
                                            })}
                                            className="text-xs h-7"
                                        >
                                            <Plus className="h-3 w-3 mr-1" /> Add Admin
                                        </Button>
                                    </div>
                                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                        {(newSchool.admins || [{ name: '', email: '', password: '' }]).map((admin, index) => (
                                            <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border relative group">
                                                {index > 0 && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="absolute top-1 right-1 h-6 w-6 text-slate-400 hover:text-red-500"
                                                        onClick={() => {
                                                            const newAdmins = [...newSchool.admins];
                                                            newAdmins.splice(index, 1);
                                                            setNewSchool({ ...newSchool, admins: newAdmins });
                                                        }}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <div className="grid gap-3">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-xs">Admin Name</Label>
                                                        <Input
                                                            placeholder="e.g. Principal Skinner"
                                                            value={admin.name}
                                                            onChange={(e) => {
                                                                const newAdmins = [...newSchool.admins];
                                                                newAdmins[index].name = e.target.value;
                                                                setNewSchool({ ...newSchool, admins: newAdmins });
                                                            }}
                                                            className={`h-8 text-sm ${validationErrors[`admin_${index}_name`] ? 'border-red-500' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="grid gap-1.5">
                                                            <Label className="text-xs">Email</Label>
                                                            <Input
                                                                type="email"
                                                                placeholder="admin@school.com"
                                                                value={admin.email}
                                                                onChange={(e) => {
                                                                    const newAdmins = [...newSchool.admins];
                                                                    newAdmins[index].email = e.target.value;
                                                                    setNewSchool({ ...newSchool, admins: newAdmins });
                                                                }}
                                                                className={`h-8 text-sm ${validationErrors[`admin_${index}_email`] ? 'border-red-500' : ''}`}
                                                            />
                                                        </div>
                                                        <div className="grid gap-1.5">
                                                            <Label className="text-xs">Password</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    type={showPasswords[index] ? "text" : "password"}
                                                                    placeholder="Strong Password"
                                                                    value={admin.password}
                                                                    onChange={(e) => {
                                                                        const newAdmins = [...newSchool.admins];
                                                                        newAdmins[index].password = e.target.value;
                                                                        setNewSchool({ ...newSchool, admins: newAdmins });
                                                                        // Clear error on type
                                                                        if (validationErrors[`admin_${index}_password`]) {
                                                                            const newErrors = { ...validationErrors }
                                                                            delete newErrors[`admin_${index}_password`]
                                                                            setValidationErrors(newErrors)
                                                                        }
                                                                    }}
                                                                    className={`h-8 text-sm pr-9 ${validationErrors[`admin_${index}_password`] ? 'border-red-500' : ''}`}
                                                                />
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute right-0 top-0 h-8 w-8 hover:bg-transparent"
                                                                    onClick={() => setShowPasswords({ ...showPasswords, [index]: !showPasswords[index] })}
                                                                >
                                                                    {showPasswords[index] ? (
                                                                        <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    ) : (
                                                                        <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {validationErrors[`admin_${index}_password`] && (
                                                        <div className="text-[10px] text-red-500 font-medium mt-1">
                                                            {validationErrors[`admin_${index}_password`]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddSchoolOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateSchool} disabled={createSchool.isPending}>
                                    {createSchool.isPending ? 'Creating...' : 'Create School & Admin'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Schools Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                                <CardContent className="p-6 space-y-4">
                                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                                </CardContent>
                            </Card>
                        ))
                    ) : filteredSchools.length === 0 ? (
                        <div className="col-span-full text-center py-20 text-muted-foreground">
                            <SchoolIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">No schools found.</p>
                            <p className="text-sm">Click "Add New School" to get started.</p>
                        </div>
                    ) : (
                        filteredSchools.map((school) => (
                            <Card
                                key={school.id}
                                className="group hover:shadow-lg transition-all duration-300 border-slate-200 overflow-hidden cursor-pointer hover:border-indigo-300 transform hover:-translate-y-1"
                                onClick={() => router.push(`/super-admin/school/${school.slug || school.id}`)}
                            >
                                <div className="h-2 bg-indigo-500 group-hover:h-3 transition-all" />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                                            <SchoolIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <Badge variant={school.is_active ? 'default' : 'secondary'} className={school.is_active ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                            {school.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <CardTitle className="mt-4 text-lg font-bold line-clamp-1" title={school.name}>
                                        {school.name}
                                    </CardTitle>
                                    <CardDescription className="flex items-center text-xs line-clamp-1">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        {school.address || 'No address provided'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pb-4">
                                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                            <Mail className="h-4 w-4 mr-2" />
                                            <span className="truncate">{school.contact_email || 'No contact email'}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Admins</span>
                                            <Badge variant="outline" className="font-mono">
                                                {/* Mock count until backend sends it, typically 1 */}
                                                {(school.admin_count || 1)}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-slate-50 dark:bg-slate-900/30 p-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 text-xs"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Open Manage Admin Dialog
                                            router.push(`/super-admin/school/${school.slug || school.id}?tab=admins`)
                                        }}
                                    >
                                        Manage Admins
                                    </Button>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={(e) => {
                                                e.stopPropagation();
                                                // Edit logic
                                            }}>
                                                <Edit className="h-4 w-4 mr-2" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-red-600"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSchool(school.id, school.name);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete School
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}
