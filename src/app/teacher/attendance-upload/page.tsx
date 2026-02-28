"use client"

import { useEffect, useMemo, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { CheckCircle, Clock, Loader2, Save, Search, UserCheck, UserX, Users, XCircle } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { getInitials } from "@/lib/utils"
import { sortTeacherClassRows } from "@/lib/classOrdering"

interface TeacherClass {
    class_id: string
    class_name: string
}

interface ClassStudent {
    id: string
    user_id: string
    roll_number: string
    full_name: string
    email: string
}

interface AttendanceStudentRecord {
    student_id: string
    user_id: string
    full_name: string
    roll_number: string
    email: string
    status: string
    remarks: string
}

type AttendanceStatus = "present" | "absent" | "late"

export default function AttendanceUploadPage() {
    const queryClient = useQueryClient()
    const [selectedClassId, setSelectedClassId] = useState("")
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
    const [searchQuery, setSearchQuery] = useState("")
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({})

    const { data: classesData, isLoading: classesLoading } = useQuery({
        queryKey: ["teacher-attendance-classes"],
        queryFn: () => api.getOrEmpty<{ classes: TeacherClass[] }>("/teacher/classes", { classes: [] }),
        staleTime: 30 * 1000,
    })

    const classOptions = useMemo(() => {
        const classes = classesData?.classes || []
        const seen = new Set<string>()
        const unique: TeacherClass[] = []
        for (const cls of classes) {
            if (!cls?.class_id || seen.has(cls.class_id)) continue
            seen.add(cls.class_id)
            unique.push(cls)
        }
        return sortTeacherClassRows(unique)
    }, [classesData])

    useEffect(() => {
        if (!selectedClassId && classOptions.length > 0) {
            setSelectedClassId(classOptions[0].class_id)
        }
    }, [classOptions, selectedClassId])

    const { data: studentsData, isLoading: studentsLoading } = useQuery({
        queryKey: ["teacher-attendance-students", selectedClassId],
        queryFn: () => api.getOrEmpty<{ students: ClassStudent[] }>(`/teacher/classes/${selectedClassId}/students`, { students: [] }),
        enabled: !!selectedClassId,
        staleTime: 10 * 1000,
    })

    const students = studentsData?.students || []

    const { data: existingAttendanceData, isLoading: existingAttendanceLoading } = useQuery({
        queryKey: ["teacher-attendance-existing", selectedClassId, selectedDate],
        enabled: !!selectedClassId && !!selectedDate,
        queryFn: () =>
            api.getOrEmpty<{ class_id: string; date: string; students: AttendanceStudentRecord[] }>(
                `/teacher/attendance?class_id=${selectedClassId}&date=${selectedDate}`,
                { class_id: '', date: '', students: [] }
            ),
        staleTime: 0,
    })

    useEffect(() => {
        setAttendance({})
    }, [selectedClassId, selectedDate])

    useEffect(() => {
        if (!existingAttendanceData?.students) return

        const next: Record<string, AttendanceStatus> = {}
        for (const row of existingAttendanceData.students) {
            if (row.status === "present" || row.status === "absent" || row.status === "late") {
                next[row.student_id] = row.status
            }
        }
        setAttendance(next)
    }, [existingAttendanceData])

    const filteredStudents = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        if (!query) return students
        return students.filter((student) =>
            student.full_name.toLowerCase().includes(query) || (student.roll_number || "").toLowerCase().includes(query)
        )
    }, [students, searchQuery])

    const markAttendanceMutation = useMutation({
        mutationFn: () => {
            const rows = Object.entries(attendance).map(([studentId, status]) => ({
                student_id: studentId,
                status,
                remarks: "",
            }))

            return api.post("/teacher/attendance", {
                class_id: selectedClassId,
                date: selectedDate,
                attendance: JSON.stringify(rows),
            })
        },
        onSuccess: () => {
            toast.success("Attendance saved successfully")
            queryClient.invalidateQueries({ queryKey: ["teacher-attendance-existing", selectedClassId, selectedDate] })
        },
        onError: (error: any) => {
            toast.error("Failed to save attendance", {
                description: error?.message || "Please try again",
            })
        },
    })

    const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance((prev) => ({
            ...prev,
            [studentId]: status,
        }))
    }

    const handleMarkAllPresent = () => {
        const next: Record<string, AttendanceStatus> = {}
        for (const student of students) {
            next[student.id] = "present"
        }
        setAttendance(next)
    }

    const handleMarkAllAbsent = () => {
        const next: Record<string, AttendanceStatus> = {}
        for (const student of students) {
            next[student.id] = "absent"
        }
        setAttendance(next)
    }

    const presentCount = Object.values(attendance).filter((s) => s === "present").length
    const absentCount = Object.values(attendance).filter((s) => s === "absent").length
    const lateCount = Object.values(attendance).filter((s) => s === "late").length
    const totalCount = students.length
    const notMarkedCount = Math.max(totalCount - presentCount - absentCount - lateCount, 0)

    const canSave = selectedClassId && Object.keys(attendance).length > 0 && !markAttendanceMutation.isPending

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                        Attendance
                    </h1>
                    <p className="text-muted-foreground mt-1">Mark attendance for your assigned classes only</p>
                </div>
                <Button
                    onClick={() => markAttendanceMutation.mutate()}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white border-0"
                    disabled={!canSave}
                >
                    {markAttendanceMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Attendance
                </Button>
            </div>

            <div className="flex gap-4 flex-wrap">
                <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={classesLoading || classOptions.length === 0}>
                    <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder={classesLoading ? "Loading classes..." : "Select Class"} />
                    </SelectTrigger>
                    <SelectContent>
                        {classOptions.map((cls) => (
                            <SelectItem key={cls.class_id} value={cls.class_id}>
                                {cls.class_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-[180px]"
                />
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                            <CheckCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{presentCount}</p>
                            <p className="text-sm text-muted-foreground">Present</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600">
                            <XCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{absentCount}</p>
                            <p className="text-sm text-muted-foreground">Absent</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600">
                            <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{totalCount}</p>
                            <p className="text-sm text-muted-foreground">Total Students</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600">
                            <Clock className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{notMarkedCount}</p>
                            <p className="text-sm text-muted-foreground">Not Marked</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Mark Attendance</CardTitle>
                            <CardDescription>Only students assigned to the selected class are listed</CardDescription>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search students..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 w-[220px]"
                                />
                            </div>
                            <Button variant="outline" size="sm" onClick={handleMarkAllPresent} disabled={!students.length}>
                                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                                Mark All Present
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleMarkAllAbsent} disabled={!students.length}>
                                <UserX className="mr-2 h-4 w-4 text-red-500" />
                                Mark All Absent
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {studentsLoading || existingAttendanceLoading ? (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Loading attendance...
                        </div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No students found for this class</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredStudents.map((student, index) => (
                                <div key={student.id} className="flex items-center justify-between p-4 rounded-xl border bg-card">
                                    <div className="flex items-center gap-4">
                                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                            {index + 1}
                                        </span>
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                                                {getInitials(student.full_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-semibold">{student.full_name}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <Badge variant="outline" className="text-xs">
                                                    Roll: {student.roll_number || "-"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={
                                                attendance[student.id] === "present"
                                                    ? "bg-green-600 border-green-600 text-white hover:bg-green-700 hover:border-green-700"
                                                    : "border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30"
                                            }
                                            onClick={() => handleAttendanceChange(student.id, "present")}
                                        >
                                            Present
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={
                                                attendance[student.id] === "absent"
                                                    ? "bg-red-600 border-red-600 text-white hover:bg-red-700 hover:border-red-700"
                                                    : "border-red-600 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                            }
                                            onClick={() => handleAttendanceChange(student.id, "absent")}
                                        >
                                            Absent
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className={
                                                attendance[student.id] === "late"
                                                    ? "bg-blue-600 border-blue-600 text-white hover:bg-blue-700 hover:border-blue-700"
                                                    : "border-blue-600 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                            }
                                            onClick={() => handleAttendanceChange(student.id, "late")}
                                        >
                                            Late
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
