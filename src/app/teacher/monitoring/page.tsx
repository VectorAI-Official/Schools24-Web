"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Eye, Monitor, Clock, CheckCircle, AlertCircle, Users, Activity } from 'lucide-react'
import { mockStudents } from '@/lib/mockData'
import { getInitials } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'

export default function MonitoringPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedClass, setSelectedClass] = useState('10-A')

    // Filter students by class and search
    const getStudentsByClass = () => {
        const classNumber = selectedClass.split('-')[0]
        const section = selectedClass.split('-')[1]
        return mockStudents.filter(s => s.class === classNumber && s.section === section)
    }

    const filteredStudents = getStudentsByClass().filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.includes(searchQuery)
    )

    // Status based on index (simulated)
    const getStatus = (index: number) => {
        if (index < 3) return 'active'
        if (index === 3) return 'idle'
        return 'offline'
    }

    const onlineCount = filteredStudents.filter((_, i) => getStatus(i) !== 'offline').length
    const activeCount = filteredStudents.filter((_, i) => getStatus(i) === 'active').length
    const idleCount = filteredStudents.filter((_, i) => getStatus(i) === 'idle').length
    const offlineCount = filteredStudents.filter((_, i) => getStatus(i) === 'offline').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                        Student Monitoring
                    </h1>
                    <p className="text-muted-foreground mt-1">Monitor student activity and engagement in real-time</p>
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Select Class" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="9-A">Class 9-A</SelectItem>
                        <SelectItem value="9-B">Class 9-B</SelectItem>
                        <SelectItem value="10-A">Class 10-A</SelectItem>
                        <SelectItem value="10-B">Class 10-B</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                                <CheckCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{onlineCount}</p>
                                <p className="text-sm text-muted-foreground">Online Now</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{activeCount}</p>
                                <p className="text-sm text-muted-foreground">Active</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                                <Clock className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{idleCount}</p>
                                <p className="text-sm text-muted-foreground">Idle</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent" />
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 shadow-lg">
                                <AlertCircle className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{offlineCount}</p>
                                <p className="text-sm text-muted-foreground">Offline</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Student List Card */}
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Students - Class {selectedClass}</CardTitle>
                            <CardDescription>Monitor individual student activity</CardDescription>
                        </div>
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search students..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {filteredStudents.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                            <p className="text-muted-foreground">No students found</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredStudents.map((student, index) => {
                                const status = getStatus(index)
                                const engagement = 80 + index * 5

                                return (
                                    <div
                                        key={student.id}
                                        className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200 group"
                                    >
                                        {/* Student Info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-medium">
                                                {index + 1}
                                            </span>
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                                                    <AvatarImage src={student.avatar} />
                                                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-medium">
                                                        {getInitials(student.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white ${status === 'active' ? 'bg-green-500' :
                                                        status === 'idle' ? 'bg-amber-500' :
                                                            'bg-red-500'
                                                    }`} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-base">{student.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-xs">
                                                        Roll: {student.rollNumber}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        Class {student.class}-{student.section}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Engagement Progress */}
                                        <div className="hidden md:flex items-center gap-4 w-48">
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between text-xs mb-1">
                                                    <span className="text-muted-foreground">Engagement</span>
                                                    <span className="font-medium">{engagement}%</span>
                                                </div>
                                                <Progress
                                                    value={engagement}
                                                    className="h-2"
                                                />
                                            </div>
                                        </div>

                                        {/* Status & Actions */}
                                        <div className="flex items-center gap-4 ml-4">
                                            <Badge
                                                className={`${status === 'active'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : status === 'idle'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    }`}
                                            >
                                                {status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                                                {status === 'idle' && <Clock className="h-3 w-3 mr-1" />}
                                                {status === 'offline' && <AlertCircle className="h-3 w-3 mr-1" />}
                                                {status.charAt(0).toUpperCase() + status.slice(1)}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Monitor className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
