"use client"

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, School as SchoolIcon, Users, GraduationCap, BookOpen, Plus, MoreVertical, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, UserCog } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSchool, useSchoolUsers } from '@/hooks/useSchools'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { UserManagement } from '@/components/school/UserManagement'
import { StaffManagement } from '@/components/school/StaffManagement'
import { useAuth } from '@/contexts/AuthContext'

export default function SchoolConsolePage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, isLoading } = useAuth()
    const isSuperAdmin = user?.role === 'super_admin'
    const canLoad = isSuperAdmin && !isLoading

    // id param is actually slug or id
    const schoolIdOrSlug = params.id as string
    const currentTab = searchParams.get('tab') || 'overview'

    const { data: school, isLoading: isSchoolLoading } = useSchool(schoolIdOrSlug, canLoad)
    // Only fetch users if we have the resolved school ID
    const { data: adminsData, isLoading: isAdminLoading } = useSchoolUsers(school?.id || '', 'admin', canLoad)
    const { data: teachersData } = useSchoolUsers(school?.id || '', 'teacher', canLoad)
    const { data: studentsData } = useSchoolUsers(school?.id || '', 'student', canLoad)

    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        if (isLoading || !user) return
        if (!isSuperAdmin) {
            const fallbackPath =
                user.role === 'admin' ? '/admin/dashboard'
                : user.role === 'teacher' ? '/teacher/dashboard'
                : user.role === 'student' ? '/student/dashboard'
                : '/login'
            router.push(fallbackPath)
        }
    }, [isLoading, isSuperAdmin, router, user])

    if (!isLoading && !isSuperAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Access denied</h1>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        Your account does not have Super Admin permissions.
                    </p>
                </div>
            </div>
        )
    }

    const handleTabChange = (value: string) => {
        router.push(`/super-admin/school/${schoolIdOrSlug}?tab=${value}`)
    }

    if (isSchoolLoading || !school) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-4 w-4 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                    <aside className="w-52 flex-shrink-0 space-y-2">
                        <Skeleton className="h-6 w-6 ml-auto mb-2" />
                        <div className="space-y-1">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-9 w-full" />
                            ))}
                        </div>
                    </aside>

                    <div className="flex-1 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-32 rounded-xl" />
                            ))}
                        </div>
                        <Skeleton className="h-48 rounded-xl" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4">
            <Button
                variant="ghost"
                className="mb-4 gap-2"
                onClick={() => router.push('/super-admin')}
            >
                <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>

            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                    <SchoolIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {school.name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        {school.address || "No address provided"}
                        {school.contact_email && <span className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{school.contact_email}</span>}
                    </p>
                </div>
            </div>

            <Tabs value={currentTab} onValueChange={handleTabChange} orientation="vertical" className="flex flex-col md:flex-row gap-2">
                <aside className={`${isCollapsed ? 'w-12' : 'w-52'} flex-shrink-0 transition-all duration-300 ease-in-out`}>
                    <div className="mb-2 flex justify-end">
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-800" onClick={() => setIsCollapsed(!isCollapsed)}>
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                        </Button>
                    </div>
                    <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1 items-stretch justify-start">
                        <TabsTrigger
                            value="overview"
                            className={`justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none bg-white dark:bg-slate-800 border border-transparent data-[state=active]:border-indigo-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <SchoolIcon className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && "Overview"}
                        </TabsTrigger>
                        <TabsTrigger
                            value="admins"
                            className={`justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none bg-white dark:bg-slate-800 border border-transparent data-[state=active]:border-indigo-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <Users className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && "Admins"}
                            {!isCollapsed && school.stats?.admins > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] justify-center">
                                    {school.stats.admins}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="teachers"
                            className={`justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none bg-white dark:bg-slate-800 border border-transparent data-[state=active]:border-indigo-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <BookOpen className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && "Teachers"}
                            {!isCollapsed && school.stats?.teachers > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] justify-center">
                                    {school.stats.teachers}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="students"
                            className={`justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none bg-white dark:bg-slate-800 border border-transparent data-[state=active]:border-indigo-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <GraduationCap className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && "Students"}
                            {!isCollapsed && school.stats?.students > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] justify-center">
                                    {school.stats.students}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="staff"
                            className={`justify-start px-3 py-2 h-9 text-sm font-medium data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700 data-[state=active]:shadow-none bg-white dark:bg-slate-800 border border-transparent data-[state=active]:border-indigo-100 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isCollapsed ? 'justify-center px-0' : ''}`}
                        >
                            <UserCog className={`h-4 w-4 ${isCollapsed ? '' : 'mr-3'}`} />
                            {!isCollapsed && "Staff"}
                            {!isCollapsed && school.stats?.staff > 0 && (
                                <Badge variant="secondary" className="ml-auto text-xs h-5 px-1.5 min-w-[1.25rem] justify-center">
                                    {school.stats.staff}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </aside>

                <div className="flex-1 min-w-0">
                    <TabsContent value="overview" className="mt-0 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Admins</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{school.stats?.admins || adminsData?.total || 0}</div>
                                    <p className="text-xs text-muted-foreground">Manage school access</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{school.stats?.teachers || teachersData?.total || 0}</div>
                                    <p className="text-xs text-muted-foreground">Academic staff</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{school.stats?.students || studentsData?.total || 0}</div>
                                    <p className="text-xs text-muted-foreground">Enrolled students</p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle>School Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                        <Badge variant={school.is_active ? "default" : "secondary"}>
                                            {school.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground">Joined Date</h4>
                                        <p className="text-sm">{new Date(school.created_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <h4 className="text-sm font-medium text-muted-foreground">School ID / Slug</h4>
                                        <p className="text-sm font-mono bg-slate-100 dark:bg-slate-800 p-1 rounded">{school.slug || school.id}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="admins" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>School Admins</CardTitle>
                                <CardDescription>Manage administrator access for this school.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserManagement role="admin" schoolId={school.id} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="teachers" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Teachers</CardTitle>
                                <CardDescription>Manage teacher accounts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserManagement role="teacher" schoolId={school.id} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="students" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Students</CardTitle>
                                <CardDescription>Manage student accounts.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <UserManagement role="student" schoolId={school.id} />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="staff" className="mt-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>Staff</CardTitle>
                                <CardDescription>Manage non-teaching staff.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <StaffManagement schoolId={school.id} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    )
}
