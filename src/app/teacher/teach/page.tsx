"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Play, PenTool, Users, Monitor, BookOpen, Clock } from 'lucide-react'
import { mockTimetable } from '@/lib/mockData'

export default function TeachPage() {
    const currentClass = mockTimetable[0]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Teach</h1>
                    <p className="text-muted-foreground">Start your teaching session</p>
                </div>
            </div>

            {/* Current Class */}
            <Card className="border-primary border-2">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Badge variant="default" className="animate-pulse">Live Now</Badge>
                        <Badge variant="secondary">{currentClass.startTime} - {currentClass.endTime}</Badge>
                    </div>
                    <CardTitle className="text-2xl">{currentClass.subject}</CardTitle>
                    <CardDescription>Class {currentClass.class} • Room {currentClass.room}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4">
                        <Link href="/teacher/teach/whiteboard" className="flex-1">
                            <Button className="w-full h-12 gradient-primary border-0" size="lg">
                                <PenTool className="mr-2 h-5 w-5" />
                                Open Whiteboard
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="card-hover cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white mx-auto mb-4">
                            <Play className="h-7 w-7" />
                        </div>
                        <h3 className="font-semibold mb-1">Start Live Class</h3>
                        <p className="text-sm text-muted-foreground">Begin a live teaching session</p>
                    </CardContent>
                </Card>
                <Card className="card-hover cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 text-white mx-auto mb-4">
                            <Users className="h-7 w-7" />
                        </div>
                        <h3 className="font-semibold mb-1">Take Attendance</h3>
                        <p className="text-sm text-muted-foreground">Mark student attendance</p>
                    </CardContent>
                </Card>
                <Card className="card-hover cursor-pointer">
                    <CardContent className="p-6 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500 text-white mx-auto mb-4">
                            <BookOpen className="h-7 w-7" />
                        </div>
                        <h3 className="font-semibold mb-1">Share Materials</h3>
                        <p className="text-sm text-muted-foreground">Upload study materials</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
