"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { PasswordPromptDialog } from "@/components/super-admin/PasswordPromptDialog"
import { QuestionUploaderForm } from "@/app/super-admin/question-generator/page"
import { SuperAdminMaterialsForm } from "@/app/super-admin/materials/page"
import { SuperAdminSettingsPanel } from "@/app/super-admin/settings/page"
import { SuperAdminTrashPanel } from "@/app/super-admin/trash/page"
import { useAuth } from "@/contexts/AuthContext"
import { useDebounce } from "@/hooks/useDebounce"
import { useSchools, useCreateSchool, useDeleteSchool, CreateSchoolParams } from "@/hooks/useSchools"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Mail, MapPin, MoreVertical, Plus, School as SchoolIcon, Search, Trash2, Edit } from "lucide-react"

type SuperAdminTab = "schools" | "catalog" | "question-uploader" | "materials" | "settings" | "trash"

function getTabFromSearch(raw: string | null): SuperAdminTab {
    if (raw === "catalog" || raw === "question-uploader" || raw === "materials" || raw === "settings" || raw === "trash") return raw
    return "schools"
}

function SchoolsSection() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearch = useDebounce(searchQuery, 300)
    const [isAddSchoolOpen, setIsAddSchoolOpen] = useState(false)
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null)
    const [showCreatePasswordPrompt, setShowCreatePasswordPrompt] = useState(false)
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({})
    const [newSchool, setNewSchool] = useState<Omit<CreateSchoolParams, "password">>({
        name: "",
        address: "",
        contact_email: "",
        admins: [{ name: "", email: "", password: "" }],
    })
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const { user, isLoading } = useAuth()
    const isSuperAdmin = user?.role === "super_admin"
    const canLoad = isSuperAdmin && !isLoading
    const { data: schools = [], isLoading: isSchoolsLoading } = useSchools(canLoad)
    const createSchool = useCreateSchool()
    const deleteSchool = useDeleteSchool()

    const filteredSchools = useMemo(() => {
        if (!schools || !Array.isArray(schools)) return []
        return schools.filter((s) =>
            s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            s.contact_email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
    }, [schools, debouncedSearch])

    const validatePassword = (password: string) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
        if (!regex.test(password)) {
            return "Password must be 8+ chars, incl. uppercase, lowercase, number, & special char."
        }
        return ""
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
        setShowCreatePasswordPrompt(true)
    }

    const handleCreateSchoolWithPassword = async (password: string) => {
        try {
            await createSchool.mutateAsync({
                ...newSchool,
                password,
            })
            setIsAddSchoolOpen(false)
            setShowCreatePasswordPrompt(false)
            setNewSchool({ name: "", address: "", contact_email: "", admins: [{ name: "", email: "", password: "" }] })
            setValidationErrors({})
            toast.success("School Created", {
                description: `${newSchool.name} has been successfully created.`,
            })
        } catch (e) {
            throw e
        }
    }

    const confirmDeleteSchool = async (password: string) => {
        if (!deleteConfirmation) return

        try {
            await deleteSchool.mutateAsync({
                schoolId: deleteConfirmation.id,
                password,
            })
            toast.success("School Deleted", {
                description: `${deleteConfirmation.name} has been moved to trash and will be permanently deleted after 24 hours.`,
            })
            setDeleteConfirmation(null)
        } catch (error: unknown) {
            throw error
        }
    }

    return (
        <div className="space-y-6">
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
                                <Input id="name" placeholder="e.g. Springfield High" value={newSchool.name} onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Address</Label>
                                <Input id="address" placeholder="123 Education Lane" value={newSchool.address} onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact">School Contact Email</Label>
                                <Input id="contact" type="email" placeholder="info@school.com" value={newSchool.contact_email} onChange={(e) => setNewSchool({ ...newSchool, contact_email: e.target.value })} />
                            </div>

                            <div className="border-t pt-4 mt-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-medium text-indigo-600">Admin Accounts</h4>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setNewSchool({ ...newSchool, admins: [...(newSchool.admins || []), { name: "", email: "", password: "" }] })}
                                        className="text-xs h-7"
                                    >
                                        <Plus className="h-3 w-3 mr-1" /> Add Admin
                                    </Button>
                                </div>
                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                                    {(newSchool.admins || [{ name: "", email: "", password: "" }]).map((admin, index) => (
                                        <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border relative group">
                                            {index > 0 && (
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute top-1 right-1 h-6 w-6 text-slate-400 hover:text-red-500"
                                                    onClick={() => {
                                                        const newAdmins = [...newSchool.admins]
                                                        newAdmins.splice(index, 1)
                                                        setNewSchool({ ...newSchool, admins: newAdmins })
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
                                                            const newAdmins = [...newSchool.admins]
                                                            newAdmins[index].name = e.target.value
                                                            setNewSchool({ ...newSchool, admins: newAdmins })
                                                        }}
                                                        className={`h-8 text-sm ${validationErrors[`admin_${index}_name`] ? "border-red-500" : ""}`}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="grid gap-1.5">
                                                        <Label className="text-xs">Email</Label>
                                                        <Input
                                                            type="email"
                                                            placeholder="admin@school.com"
                                                            value={admin.email}
                                                            onChange={(e) => {
                                                                const newAdmins = [...newSchool.admins]
                                                                newAdmins[index].email = e.target.value
                                                                setNewSchool({ ...newSchool, admins: newAdmins })
                                                            }}
                                                            className={`h-8 text-sm ${validationErrors[`admin_${index}_email`] ? "border-red-500" : ""}`}
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
                                                                    const newAdmins = [...newSchool.admins]
                                                                    newAdmins[index].password = e.target.value
                                                                    setNewSchool({ ...newSchool, admins: newAdmins })
                                                                }}
                                                                className={`h-8 text-sm pr-9 ${validationErrors[`admin_${index}_password`] ? "border-red-500" : ""}`}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                                                                onClick={() => setShowPasswords({ ...showPasswords, [index]: !showPasswords[index] })}
                                                                aria-label={showPasswords[index] ? "Hide password" : "Show password"}
                                                            >
                                                                {showPasswords[index] ? (
                                                                    <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
                                                                ) : (
                                                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                                                )}
                                                            </button>
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
                                {createSchool.isPending ? "Creating..." : "Create School & Admin"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {isSchoolsLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-xl" />
                            <CardContent className="p-4 md:p-6 space-y-4">
                                <div className="h-4 bg-slate-200 rounded w-3/4" />
                                <div className="h-4 bg-slate-200 rounded w-1/2" />
                            </CardContent>
                        </Card>
                    ))
                ) : filteredSchools.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-muted-foreground">
                        <SchoolIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No schools found.</p>
                        <p className="text-sm">Click &quot;Add New School&quot; to get started.</p>
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
                                    <Badge variant={school.is_active ? "default" : "secondary"} className={school.is_active ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                                        {school.is_active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <CardTitle className="mt-4 text-lg font-bold line-clamp-1" title={school.name}>
                                    {school.name}
                                </CardTitle>
                                <CardDescription className="flex items-center text-xs line-clamp-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {school.address || "No address provided"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pb-4">
                                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span className="truncate">{school.contact_email || "No contact email"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Admins</span>
                                        <Badge variant="outline" className="font-mono">
                                            {school.stats?.admins || school.admin_count || 0}
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
                                        e.stopPropagation()
                                        router.push(`/super-admin/school/${school.slug || school.id}?tab=admins`)
                                    }}
                                >
                                    Manage Admins
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={(e) => e.stopPropagation()}>
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                        <DropdownMenuItem>
                                            <Edit className="h-4 w-4 mr-2" /> Edit Details
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteConfirmation({ id: school.id, name: school.name })
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

            <PasswordPromptDialog
                open={!!deleteConfirmation}
                onOpenChange={(open) => !open && setDeleteConfirmation(null)}
                onConfirm={confirmDeleteSchool}
                title={`Delete School: ${deleteConfirmation?.name}`}
                description="Enter your password to soft delete this school. It will be moved to trash and can be restored within 24 hours."
                actionLabel="Delete School"
                actionVariant="destructive"
                warningMessage="⚠️ After 24 hours, the school will be permanently deleted along with all associated data including admins, teachers, students, classes, attendance records, and the entire database schema."
            />

            <PasswordPromptDialog
                open={showCreatePasswordPrompt}
                onOpenChange={setShowCreatePasswordPrompt}
                onConfirm={handleCreateSchoolWithPassword}
                title="Verify Your Password"
                description={`Enter your password to create "${newSchool.name}". This will set up a new school with admin accounts and database schema.`}
                actionLabel="Create School"
                actionVariant="default"
            />
        </div>
    )
}

interface GlobalClass {
    id: string
    name: string
    sort_order: number
}

interface GlobalSubject {
    id: string
    name: string
    code: string
}

interface AssignmentItem {
    class: GlobalClass
    subjects: GlobalSubject[]
}

function CatalogSection() {
    const queryClient = useQueryClient()
    const [showClassesDialog, setShowClassesDialog] = useState(false)
    const [showSubjectsDialog, setShowSubjectsDialog] = useState(false)
    const [newClassName, setNewClassName] = useState("")
    const [newClassSortOrder, setNewClassSortOrder] = useState("0")
    const [newSubjectName, setNewSubjectName] = useState("")
    const [newSubjectCode, setNewSubjectCode] = useState("")
    const [selectedClassId, setSelectedClassId] = useState<string>("")
    const [assignedByClass, setAssignedByClass] = useState<Record<string, string[]>>({})
    const [editingClassId, setEditingClassId] = useState<string | null>(null)
    const [editingClassName, setEditingClassName] = useState("")
    const [editingClassSort, setEditingClassSort] = useState("0")
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null)
    const [editingSubjectName, setEditingSubjectName] = useState("")
    const [editingSubjectCode, setEditingSubjectCode] = useState("")

    const classesQuery = useQuery({
        queryKey: ["super-admin-catalog-classes"],
        queryFn: () => api.get<{ classes: GlobalClass[] }>("/super-admin/catalog/classes"),
    })
    const subjectsQuery = useQuery({
        queryKey: ["super-admin-catalog-subjects"],
        queryFn: () => api.get<{ subjects: GlobalSubject[] }>("/super-admin/catalog/subjects"),
    })
    const assignmentsQuery = useQuery({
        queryKey: ["super-admin-catalog-assignments"],
        queryFn: () => api.get<{ assignments: AssignmentItem[] }>("/super-admin/catalog/assignments"),
    })

    const classes = useMemo(() => classesQuery.data?.classes || [], [classesQuery.data?.classes])
    const subjects = useMemo(() => subjectsQuery.data?.subjects || [], [subjectsQuery.data?.subjects])
    const assignments = useMemo(() => assignmentsQuery.data?.assignments || [], [assignmentsQuery.data?.assignments])
    const effectiveSelectedClassId = selectedClassId || classes[0]?.id || ""
    const defaultAssignedSubjectIds = useMemo(() => {
        if (!effectiveSelectedClassId) return []
        const current = assignments.find((item) => item.class.id === effectiveSelectedClassId)
        return (current?.subjects || []).map((s) => s.id)
    }, [assignments, effectiveSelectedClassId])
    const assignedSubjectIds = assignedByClass[effectiveSelectedClassId] || defaultAssignedSubjectIds

    const invalidateCatalog = async () => {
        await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["super-admin-catalog-classes"] }),
            queryClient.invalidateQueries({ queryKey: ["super-admin-catalog-subjects"] }),
            queryClient.invalidateQueries({ queryKey: ["super-admin-catalog-assignments"] }),
        ])
    }

    const createClassMutation = useMutation({
        mutationFn: (payload: { name: string; sort_order: number }) => api.post<{ class: GlobalClass }>("/super-admin/catalog/classes", payload),
        onSuccess: async () => {
            setNewClassName("")
            setNewClassSortOrder("0")
            await invalidateCatalog()
            toast.success("Class created")
        },
        onError: (error) => {
            toast.error("Failed to create class", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const updateClassMutation = useMutation({
        mutationFn: (payload: { id: string; name: string; sort_order: number }) =>
            api.put<{ class: GlobalClass }>(`/super-admin/catalog/classes/${payload.id}`, { name: payload.name, sort_order: payload.sort_order }),
        onSuccess: async () => {
            setEditingClassId(null)
            await invalidateCatalog()
            toast.success("Class updated")
        },
        onError: (error) => {
            toast.error("Failed to update class", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const deleteClassMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/super-admin/catalog/classes/${id}`),
        onSuccess: async () => {
            if (effectiveSelectedClassId && !classes.some((c) => c.id !== effectiveSelectedClassId)) {
                setSelectedClassId("")
            }
            await invalidateCatalog()
            toast.success("Class deleted")
        },
        onError: (error) => {
            toast.error("Failed to delete class", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const createSubjectMutation = useMutation({
        mutationFn: (payload: { name: string; code: string }) => api.post<{ subject: GlobalSubject }>("/super-admin/catalog/subjects", payload),
        onSuccess: async () => {
            setNewSubjectName("")
            setNewSubjectCode("")
            await invalidateCatalog()
            toast.success("Subject created")
        },
        onError: (error) => {
            toast.error("Failed to create subject", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const updateSubjectMutation = useMutation({
        mutationFn: (payload: { id: string; name: string; code: string }) =>
            api.put<{ subject: GlobalSubject }>(`/super-admin/catalog/subjects/${payload.id}`, { name: payload.name, code: payload.code }),
        onSuccess: async () => {
            setEditingSubjectId(null)
            await invalidateCatalog()
            toast.success("Subject updated")
        },
        onError: (error) => {
            toast.error("Failed to update subject", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const deleteSubjectMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/super-admin/catalog/subjects/${id}`),
        onSuccess: async () => {
            await invalidateCatalog()
            toast.success("Subject deleted")
        },
        onError: (error) => {
            toast.error("Failed to delete subject", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const assignSubjectsMutation = useMutation({
        mutationFn: (payload: { classId: string; subjectIds: string[] }) =>
            api.put(`/super-admin/catalog/classes/${payload.classId}/subjects`, { subject_ids: payload.subjectIds }),
        onSuccess: async () => {
            await invalidateCatalog()
            toast.success("Class subjects updated")
        },
        onError: (error) => {
            toast.error("Failed to update class subjects", { description: error instanceof Error ? error.message : "Unexpected error" })
        },
    })

    const isBusy =
        createClassMutation.isPending ||
        updateClassMutation.isPending ||
        deleteClassMutation.isPending ||
        createSubjectMutation.isPending ||
        updateSubjectMutation.isPending ||
        deleteSubjectMutation.isPending ||
        assignSubjectsMutation.isPending

    const shownClassName = classes.find((c) => c.id === effectiveSelectedClassId)?.name || "Select a class"
    const catalogError = classesQuery.error || subjectsQuery.error || assignmentsQuery.error

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Global Subjects and Classes</CardTitle>
                    <CardDescription>
                        Manage centralized class levels, subjects, and assign subjects to classes for all schools.
                    </CardDescription>
                </CardHeader>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Classes</CardTitle>
                        <CardDescription>Total centralized classes</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-2xl md:text-4xl font-bold">
                            {classesQuery.isLoading ? "..." : classes.length}
                        </div>
                        <Button onClick={() => setShowClassesDialog(true)} disabled={classesQuery.isLoading}>
                            Show Classes
                        </Button>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Subjects</CardTitle>
                        <CardDescription>Total centralized subjects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-2xl md:text-4xl font-bold">
                            {subjectsQuery.isLoading ? "..." : subjects.length}
                        </div>
                        <Button onClick={() => setShowSubjectsDialog(true)} disabled={subjectsQuery.isLoading}>
                            Show Subjects
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {catalogError ? (
                <Card className="border-red-300">
                    <CardHeader>
                        <CardTitle className="text-red-600">Catalog Load Failed</CardTitle>
                        <CardDescription>
                            {catalogError instanceof Error ? catalogError.message : "Failed to load catalog data from backend."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() => {
                                classesQuery.refetch()
                                subjectsQuery.refetch()
                                assignmentsQuery.refetch()
                            }}
                        >
                            Retry
                        </Button>
                    </CardContent>
                </Card>
            ) : null}

            <div className="grid grid-cols-1 xl:grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Classes</CardTitle>
                        <CardDescription>Create and maintain centralized class levels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                                placeholder="Class name (e.g. Class 5)"
                                value={newClassName}
                                onChange={(e) => setNewClassName(e.target.value)}
                                className="md:col-span-2"
                            />
                            <Input
                                type="number"
                                placeholder="Sort"
                                value={newClassSortOrder}
                                onChange={(e) => setNewClassSortOrder(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => createClassMutation.mutate({ name: newClassName.trim(), sort_order: Number(newClassSortOrder || "0") })}
                            disabled={!newClassName.trim() || isBusy}
                        >
                            Add Class
                        </Button>

                        <div className="space-y-2 max-h-80 overflow-auto pr-1">
                            {classesQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">Loading classes...</p>
                            ) : classes.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No classes added yet.</p>
                            ) : (
                                classes.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 border rounded-md p-2">
                                        {editingClassId === item.id ? (
                                            <>
                                                <Input value={editingClassName} onChange={(e) => setEditingClassName(e.target.value)} />
                                                <Input type="number" value={editingClassSort} onChange={(e) => setEditingClassSort(e.target.value)} className="w-24" />
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        updateClassMutation.mutate({
                                                            id: item.id,
                                                            name: editingClassName.trim(),
                                                            sort_order: Number(editingClassSort || "0"),
                                                        })
                                                    }
                                                    disabled={!editingClassName.trim() || isBusy}
                                                >
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingClassId(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`flex-1 text-left text-sm ${effectiveSelectedClassId === item.id ? "font-semibold text-indigo-600" : ""}`}
                                                    onClick={() => setSelectedClassId(item.id)}
                                                >
                                                    {item.name}
                                                </button>
                                                <Badge variant="outline">Sort {item.sort_order}</Badge>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingClassId(item.id)
                                                        setEditingClassName(item.name)
                                                        setEditingClassSort(String(item.sort_order))
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteClassMutation.mutate(item.id)} disabled={isBusy}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Subjects</CardTitle>
                        <CardDescription>Create and maintain centralized subjects</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                                placeholder="Subject name"
                                value={newSubjectName}
                                onChange={(e) => setNewSubjectName(e.target.value)}
                                className="md:col-span-2"
                            />
                            <Input
                                placeholder="Code (optional)"
                                value={newSubjectCode}
                                onChange={(e) => setNewSubjectCode(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={() => createSubjectMutation.mutate({ name: newSubjectName.trim(), code: newSubjectCode.trim() })}
                            disabled={!newSubjectName.trim() || isBusy}
                        >
                            Add Subject
                        </Button>

                        <div className="space-y-2 max-h-80 overflow-auto pr-1">
                            {subjectsQuery.isLoading ? (
                                <p className="text-sm text-muted-foreground">Loading subjects...</p>
                            ) : subjects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No subjects added yet.</p>
                            ) : (
                                subjects.map((item) => (
                                    <div key={item.id} className="flex items-center gap-2 border rounded-md p-2">
                                        {editingSubjectId === item.id ? (
                                            <>
                                                <Input value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} />
                                                <Input value={editingSubjectCode} onChange={(e) => setEditingSubjectCode(e.target.value)} className="w-28" />
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        updateSubjectMutation.mutate({
                                                            id: item.id,
                                                            name: editingSubjectName.trim(),
                                                            code: editingSubjectCode.trim(),
                                                        })
                                                    }
                                                    disabled={!editingSubjectName.trim() || isBusy}
                                                >
                                                    Save
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingSubjectId(null)}>Cancel</Button>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex-1 text-sm">{item.name}</div>
                                                {item.code ? <Badge variant="outline">{item.code}</Badge> : null}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => {
                                                        setEditingSubjectId(item.id)
                                                        setEditingSubjectName(item.name)
                                                        setEditingSubjectCode(item.code || "")
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button size="icon" variant="ghost" onClick={() => deleteSubjectMutation.mutate(item.id)} disabled={isBusy}>
                                                    <Trash2 className="h-4 w-4 text-red-600" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Class to Subject Assignment</CardTitle>
                    <CardDescription>Select a class and assign the allowed subjects</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                        <Label htmlFor="assignment-class-select">Select Class</Label>
                        <div className="md:col-span-2">
                            <Select
                                value={effectiveSelectedClassId}
                                onValueChange={(value) => setSelectedClassId(value)}
                                disabled={classesQuery.isLoading || classes.length === 0}
                            >
                                <SelectTrigger id="assignment-class-select" className="w-full md:w-[360px]">
                                    <SelectValue placeholder={classes.length === 0 ? "No classes available" : "Choose class"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {classes.length > 0 ? (
                                <div className="mt-2">
                                    <Badge variant="secondary">Selected Class: {shownClassName}</Badge>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                        {subjects.map((subject) => {
                            const checked = assignedSubjectIds.includes(subject.id)
                            return (
                                <label key={subject.id} className="flex items-center gap-2 border rounded-md px-3 py-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setAssignedByClass((prev) => ({
                                                    ...prev,
                                                    [effectiveSelectedClassId]: [...assignedSubjectIds, subject.id],
                                                }))
                                            } else {
                                                setAssignedByClass((prev) => ({
                                                    ...prev,
                                                    [effectiveSelectedClassId]: assignedSubjectIds.filter((id) => id !== subject.id),
                                                }))
                                            }
                                        }}
                                        disabled={!effectiveSelectedClassId}
                                    />
                                    <span className="text-sm">{subject.name}</span>
                                    {subject.code ? <span className="text-xs text-muted-foreground">({subject.code})</span> : null}
                                </label>
                            )
                        })}
                    </div>
                    <Button
                        onClick={() => {
                            if (!effectiveSelectedClassId) return
                            assignSubjectsMutation.mutate({ classId: effectiveSelectedClassId, subjectIds: assignedSubjectIds })
                        }}
                        disabled={!effectiveSelectedClassId || isBusy}
                    >
                        Save Class Subjects
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={showClassesDialog} onOpenChange={setShowClassesDialog}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>All Classes</DialogTitle>
                        <DialogDescription>Loaded from centralized DB catalog</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto space-y-2 pr-1">
                        {classesQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading classes...</p>
                        ) : classes.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No classes found in DB.</p>
                        ) : (
                            classes.map((item) => (
                                <div key={item.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                                    <span className="font-medium">{item.name}</span>
                                    <Badge variant="outline">Sort {item.sort_order}</Badge>
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showSubjectsDialog} onOpenChange={setShowSubjectsDialog}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle>All Subjects</DialogTitle>
                        <DialogDescription>Loaded from centralized DB catalog</DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[60vh] overflow-auto space-y-2 pr-1">
                        {subjectsQuery.isLoading ? (
                            <p className="text-sm text-muted-foreground">Loading subjects...</p>
                        ) : subjects.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No subjects found in DB.</p>
                        ) : (
                            subjects.map((item) => (
                                <div key={item.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                                    <span className="font-medium">{item.name}</span>
                                    {item.code ? <Badge variant="outline">{item.code}</Badge> : <span className="text-xs text-muted-foreground">No code</span>}
                                </div>
                            ))
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function SuperAdminPage() {
    const { user, isLoading } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    const tab = getTabFromSearch(searchParams.get("tab"))

    useEffect(() => {
        if (isLoading || !user) return
        if (user.role !== "super_admin") {
            const fallbackPath =
                user.role === "admin" ? "/admin/dashboard"
                    : user.role === "teacher" ? "/teacher/dashboard"
                        : user.role === "student" ? "/student/dashboard"
                            : "/login"
            router.push(fallbackPath)
        }
    }, [isLoading, router, user])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!user || user.role !== "super_admin") return null

    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
                    {tab === "schools" && <SchoolsSection />}
                    {tab === "catalog" && <CatalogSection />}
                    {tab === "question-uploader" && <QuestionUploaderForm />}
                    {tab === "materials" && <SuperAdminMaterialsForm />}
                    {tab === "settings" && <SuperAdminSettingsPanel embedded />}
                    {tab === "trash" && <SuperAdminTrashPanel embedded />}
                </main>
            </div>
        </div>
    )
}
