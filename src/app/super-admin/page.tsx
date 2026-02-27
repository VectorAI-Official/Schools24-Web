"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
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
import SuperAdminQuizSchedulerPage from "@/app/super-admin/quiz-scheduler/page"
import { SuperAdminSettingsPanel } from "@/app/super-admin/settings/page"
import { SuperAdminTrashPanel } from "@/app/super-admin/trash/page"
import { useAuth } from "@/contexts/AuthContext"
import { useDebounce } from "@/hooks/useDebounce"
import { useSchools, useCreateSchool, useDeleteSchool, CreateSchoolParams } from "@/hooks/useSchools"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Eye, EyeOff, Loader2, Mail, MapPin, MoreVertical, Plus, School as SchoolIcon, Search, Trash2, Edit, Layers3, BookOpenCheck, Check, X, Shield, Sparkles, CheckCircle2, Save } from "lucide-react"

type SuperAdminTab = "schools" | "catalog" | "question-uploader" | "quiz-scheduler" | "materials" | "settings" | "trash"

function getTabFromSearch(raw: string | null): SuperAdminTab {
    if (raw === "catalog" || raw === "question-uploader" || raw === "quiz-scheduler" || raw === "materials" || raw === "settings" || raw === "trash") return raw
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

    const totalSchools = schools.length
    const activeSchools = schools.filter((s) => s.is_active).length
    const inactiveSchools = Math.max(0, totalSchools - activeSchools)

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
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 md:p-5 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-indigo-500" />
                    <Input
                        placeholder="Search schools by name or email..."
                        className="pl-10 bg-indigo-50/50 dark:bg-slate-800 border-indigo-100 dark:border-slate-700"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Dialog open={isAddSchoolOpen} onOpenChange={setIsAddSchoolOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
                {isSchoolsLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="animate-pulse rounded-2xl border-slate-200/80 dark:border-slate-800">
                            <CardHeader className="h-24 bg-slate-100 dark:bg-slate-800 rounded-t-2xl" />
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
                            className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-500/10"
                            onClick={() => router.push(`/super-admin/school/${school.slug || school.id}`)}
                        >
                            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500" />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800/30 pointer-events-none" />
                            <CardHeader className="relative pb-3 pt-5">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-900/60 bg-indigo-50 dark:bg-indigo-900/20">
                                        <SchoolIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                    </div>
                                </div>
                                <CardTitle className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100 line-clamp-1" title={school.name}>
                                    {school.name}
                                </CardTitle>
                                <CardDescription className="flex items-center text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {school.address || "No address provided"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative pb-4 space-y-3">
                                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/70 p-2.5">
                                    <div className="flex items-center text-sm text-slate-600 dark:text-slate-400">
                                        <Mail className="h-4 w-4 mr-2" />
                                        <span className="truncate">{school.contact_email || "No contact email"}</span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-2 py-2 text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Admins</p>
                                        <p className="text-sm font-semibold">{school.stats?.admins || school.admin_count || 0}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-2 py-2 text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Teachers</p>
                                        <p className="text-sm font-semibold">{school.stats?.teachers || 0}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900 px-2 py-2 text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Students</p>
                                        <p className="text-sm font-semibold">{school.stats?.students || 0}</p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="relative bg-slate-50/80 dark:bg-slate-900/40 p-3.5 border-t border-slate-200 dark:border-slate-800 flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs bg-white dark:bg-slate-900"
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
        staleTime: 10 * 60_000,
        refetchOnWindowFocus: false,
    })
    const subjectsQuery = useQuery({
        queryKey: ["super-admin-catalog-subjects"],
        queryFn: () => api.get<{ subjects: GlobalSubject[] }>("/super-admin/catalog/subjects"),
        staleTime: 10 * 60_000,
        refetchOnWindowFocus: false,
    })
    const assignmentsQuery = useQuery({
        queryKey: ["super-admin-catalog-assignments"],
        queryFn: () => api.get<{ assignments: AssignmentItem[] }>("/super-admin/catalog/assignments"),
        staleTime: 10 * 60_000,
        refetchOnWindowFocus: false,
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
        <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                <Card className="group relative overflow-hidden border-indigo-100 dark:border-indigo-900/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <Layers3 className="w-24 h-24 text-indigo-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <div className="p-1.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                <Layers3 className="h-4 w-4" />
                            </div>
                            Centralized Classes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 dark:text-white">
                                {classesQuery.isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : classes.length}
                            </span>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                Active
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="group relative overflow-hidden border-fuchsia-100 dark:border-fuchsia-900/50 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-slate-900">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                        <BookOpenCheck className="w-24 h-24 text-fuchsia-600" />
                    </div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <div className="p-1.5 rounded-md bg-fuchsia-50 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400">
                                <BookOpenCheck className="h-4 w-4" />
                            </div>
                            Subject Catalog
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl md:text-5xl font-bold tracking-tighter text-slate-900 dark:text-white">
                                {subjectsQuery.isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : subjects.length}
                            </span>
                            <span className="text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                Managed
                            </span>
                        </div>
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
                {/* Classes Panel */}
                <Card className="flex flex-col border-indigo-100 dark:border-indigo-900/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-indigo-900 dark:text-indigo-100">Manage Classes</CardTitle>
                                <CardDescription>Create and maintain centralized class levels</CardDescription>
                            </div>
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full">
                                <Layers3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col pt-4">
                        <div className="px-5 pb-5 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Layers3 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Class name (e.g. Class 5)"
                                        value={newClassName}
                                        onChange={(e) => setNewClassName(e.target.value)}
                                        className="pl-9 border-slate-200 focus-visible:ring-indigo-500 bg-slate-50 dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="relative w-full sm:w-28">
                                    <Input
                                        type="number"
                                        placeholder="Sort Order"
                                        value={newClassSortOrder}
                                        onChange={(e) => setNewClassSortOrder(e.target.value)}
                                        className="border-slate-200 focus-visible:ring-indigo-500 bg-slate-50 dark:bg-slate-900/50"
                                    />
                                </div>
                                <Button
                                    onClick={() => createClassMutation.mutate({ name: newClassName.trim(), sort_order: Number(newClassSortOrder || "0") })}
                                    disabled={!newClassName.trim() || isBusy}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shrink-0 transition-all hover:shadow-md"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </div>

                            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {classesQuery.isLoading ? (
                                    <div className="flex items-center pt-4 justify-center text-indigo-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
                                ) : classes.length === 0 ? (
                                    <div className="text-center pt-6 pb-4 text-slate-400 italic">No classes added yet.</div>
                                ) : (
                                    classes.map((item) => (
                                        <div key={item.id} className="group flex items-center gap-3 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800 transition-all duration-300">
                                            {editingClassId === item.id ? (
                                                <div className="flex-1 flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                    <Input value={editingClassName} onChange={(e) => setEditingClassName(e.target.value)} className="h-9" autoFocus />
                                                    <Input type="number" value={editingClassSort} onChange={(e) => setEditingClassSort(e.target.value)} className="h-9 w-20" />
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        onClick={() =>
                                                            updateClassMutation.mutate({
                                                                id: item.id,
                                                                name: editingClassName.trim(),
                                                                sort_order: Number(editingClassSort || "0"),
                                                            })
                                                        }
                                                        disabled={!editingClassName.trim() || isBusy}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => setEditingClassId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        className={`flex-1 text-left flex items-center gap-3 py-1 ${effectiveSelectedClassId === item.id ? "text-indigo-700 dark:text-indigo-400 font-semibold" : "text-slate-700 dark:text-slate-300 font-medium"}`}
                                                        onClick={() => setSelectedClassId(item.id)}
                                                    >
                                                        {effectiveSelectedClassId === item.id && <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 animate-in zoom-in" />}
                                                        <span>{item.name}</span>
                                                    </button>

                                                    <span className="flex-shrink-0 text-[11px] uppercase tracking-wider font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                        Sort {item.sort_order}
                                                    </span>

                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                                                            onClick={() => {
                                                                setEditingClassId(item.id)
                                                                setEditingClassName(item.name)
                                                                setEditingClassSort(String(item.sort_order))
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            onClick={() => deleteClassMutation.mutate(item.id)}
                                                            disabled={isBusy}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subjects Panel */}
                <Card className="flex flex-col border-fuchsia-100 dark:border-fuchsia-900/50 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                    <CardHeader className="bg-fuchsia-50/50 dark:bg-fuchsia-950/20 border-b border-fuchsia-100 dark:border-fuchsia-900/50 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-fuchsia-900 dark:text-fuchsia-100">Manage Subjects</CardTitle>
                                <CardDescription>Create and maintain centralized subjects</CardDescription>
                            </div>
                            <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/40 rounded-full">
                                <BookOpenCheck className="h-5 w-5 text-fuchsia-600 dark:text-fuchsia-400" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col pt-4">
                        <div className="px-5 pb-5 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <BookOpenCheck className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                    <Input
                                        placeholder="Subject name"
                                        value={newSubjectName}
                                        onChange={(e) => setNewSubjectName(e.target.value)}
                                        className="pl-9 border-slate-200 focus-visible:ring-fuchsia-500 bg-slate-50 dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="relative w-full sm:w-32">
                                    <Input
                                        placeholder="Code (opt)"
                                        value={newSubjectCode}
                                        onChange={(e) => setNewSubjectCode(e.target.value)}
                                        className="border-slate-200 focus-visible:ring-fuchsia-500 bg-slate-50 dark:bg-slate-900/50 uppercase"
                                    />
                                </div>
                                <Button
                                    onClick={() => createSubjectMutation.mutate({ name: newSubjectName.trim(), code: newSubjectCode.trim() })}
                                    disabled={!newSubjectName.trim() || isBusy}
                                    className="bg-fuchsia-600 hover:bg-fuchsia-700 text-white shadow-sm shrink-0 transition-all hover:shadow-md"
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Add
                                </Button>
                            </div>

                            <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {subjectsQuery.isLoading ? (
                                    <div className="flex items-center pt-4 justify-center text-fuchsia-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...</div>
                                ) : subjects.length === 0 ? (
                                    <div className="text-center pt-6 pb-4 text-slate-400 italic">No subjects added yet.</div>
                                ) : (
                                    subjects.map((item) => (
                                        <div key={item.id} className="group flex items-center gap-3 border border-slate-100 dark:border-slate-800/60 rounded-xl p-3 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 shadow-sm hover:shadow-md hover:border-fuchsia-200 dark:hover:border-fuchsia-800 transition-all duration-300">
                                            {editingSubjectId === item.id ? (
                                                <div className="flex-1 flex items-center gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                                                    <Input value={editingSubjectName} onChange={(e) => setEditingSubjectName(e.target.value)} className="h-9" autoFocus />
                                                    <Input value={editingSubjectCode} onChange={(e) => setEditingSubjectCode(e.target.value)} className="h-9 w-24 uppercase" />
                                                    <Button
                                                        size="sm"
                                                        className="h-9 px-3 bg-fuchsia-600 hover:bg-fuchsia-700 text-white"
                                                        onClick={() =>
                                                            updateSubjectMutation.mutate({
                                                                id: item.id,
                                                                name: editingSubjectName.trim(),
                                                                code: editingSubjectCode.trim(),
                                                            })
                                                        }
                                                        disabled={!editingSubjectName.trim() || isBusy}
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" className="h-9 px-3" onClick={() => setEditingSubjectId(null)}>
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex-1 text-slate-700 dark:text-slate-300 font-medium py-1">{item.name}</div>

                                                    {item.code ? (
                                                        <span className="flex-shrink-0 text-[11px] font-bold tracking-widest text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-500/10 px-2 py-1 rounded-md border border-fuchsia-100 dark:border-fuchsia-800/50">
                                                            {item.code}
                                                        </span>
                                                    ) : null}

                                                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-500/10"
                                                            onClick={() => {
                                                                setEditingSubjectId(item.id)
                                                                setEditingSubjectName(item.name)
                                                                setEditingSubjectCode(item.code || "")
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                            onClick={() => deleteSubjectMutation.mutate(item.id)}
                                                            disabled={isBusy}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
                <div className="h-1 w-full bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400"></div>
                <CardHeader className="pb-4 pt-6">
                    <CardTitle className="text-xl flex items-center gap-2 text-slate-800 dark:text-slate-100">
                        <Shield className="h-5 w-5 text-violet-500" /> Subject Mapping
                    </CardTitle>
                    <CardDescription className="text-base">
                        Select a class and assign the allowed subjects. This defines the curriculum availability for all schools.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/40 dark:border-slate-800">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                            <Label htmlFor="assignment-class-select" className="text-sm font-semibold text-slate-600 dark:text-slate-300 shrink-0">
                                Target Class
                            </Label>
                            <div className="flex-1 max-w-sm relative">
                                <Select
                                    value={effectiveSelectedClassId}
                                    onValueChange={(value) => setSelectedClassId(value)}
                                    disabled={classesQuery.isLoading || classes.length === 0}
                                >
                                    <SelectTrigger id="assignment-class-select" className="w-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-sm h-11">
                                        <SelectValue placeholder={classes.length === 0 ? "No classes available" : "Choose class"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id} className="font-medium">
                                                {cls.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {classes.length > 0 && effectiveSelectedClassId ? (
                                <div className="hidden md:flex ml-auto items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Configuring {shownClassName}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Available Subjects</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {subjects.map((subject) => {
                                const checked = assignedSubjectIds.includes(subject.id)
                                return (
                                    <label key={subject.id} className={`group relative flex items-center gap-3 border rounded-xl px-4 py-3 cursor-pointer transition-all duration-300 overflow-hidden ${checked ? "border-violet-500 bg-violet-50/50 dark:bg-violet-500/10 shadow-[0_4px_14px_0_rgba(139,92,246,0.15)] dark:shadow-none translate-y-[-1px]" : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-violet-300 dark:hover:border-violet-700 hover:shadow-sm"}`}>
                                        <div className={`absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/5 dark:to-violet-500/10 transition-opacity duration-300 ${checked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}></div>

                                        <div className={`relative flex items-center justify-center w-5 h-5 rounded-[6px] border transition-all duration-300 ${checked ? "bg-violet-600 border-violet-600 text-white" : "border-slate-300 dark:border-slate-600 bg-transparent group-hover:border-violet-400"}`}>
                                            <Check className={`w-3.5 h-3.5 transition-transform duration-300 ${checked ? "scale-100" : "scale-0"}`} strokeWidth={4} />
                                        </div>

                                        <input
                                            type="checkbox"
                                            className="sr-only"
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

                                        <div className="relative flex-1 min-w-0">
                                            <div className={`text-sm tracking-tight truncate transition-colors duration-300 ${checked ? "font-semibold text-violet-900 dark:text-violet-100" : "font-medium text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                                                {subject.name}
                                            </div>
                                            {subject.code ? (
                                                <div className={`text-[10px] uppercase font-bold tracking-widest truncate mt-0.5 transition-colors duration-300 ${checked ? "text-violet-600 dark:text-violet-400" : "text-slate-400"}`}>
                                                    {subject.code}
                                                </div>
                                            ) : null}
                                        </div>
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                        <Button
                            onClick={() => {
                                if (!effectiveSelectedClassId) return
                                assignSubjectsMutation.mutate({ classId: effectiveSelectedClassId, subjectIds: assignedSubjectIds })
                            }}
                            disabled={!effectiveSelectedClassId || isBusy}
                            size="lg"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none min-w-[200px] transition-all"
                        >
                            {isBusy ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                            Save Configuration
                        </Button>
                    </div>
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

function SuperAdminPageContent() {
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
                    {tab === "quiz-scheduler" && <SuperAdminQuizSchedulerPage />}
                    {tab === "materials" && <SuperAdminMaterialsForm />}
                    {tab === "settings" && <SuperAdminSettingsPanel embedded />}
                    {tab === "trash" && <SuperAdminTrashPanel embedded />}
                </main>
            </div>
        </div>
    )
}

export default function SuperAdminPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <SuperAdminPageContent />
        </Suspense>
    )
}
