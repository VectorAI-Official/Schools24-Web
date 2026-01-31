"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Star, Users, Award, TrendingUp } from 'lucide-react'
import { leaderboardData, mockTeachers } from '@/lib/mockData'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'

export default function TeacherLeaderboardPage() {
    const { user } = useAuth()

    // Get current user's rank (simulated as rank 2)
    const myRank = 2
    const myRating = 4.8
    const myTeacher = mockTeachers[1] // Simulated current teacher

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 bg-clip-text text-transparent">
                    Leaderboard
                </h1>
                <p className="text-muted-foreground mt-1">Your ranking and top performing teachers</p>
            </div>

            {/* Top 3 Teachers - At the top */}
            <div className="grid gap-4 md:grid-cols-3">
                {leaderboardData.teachers.slice(0, 3).map((teacher, index) => (
                    <Card
                        key={teacher.rank}
                        className={`relative overflow-hidden transition-all hover:shadow-lg ${index === 0 ? 'border-yellow-500/50 border-2' :
                            index === 1 ? 'border-emerald-500/50 border-2' : ''
                            }`}
                    >
                        {index === 1 && (
                            <div className="absolute top-2 right-2">
                                <Badge className="bg-emerald-500 text-white text-xs">You</Badge>
                            </div>
                        )}
                        <CardContent className="p-4 text-center">
                            <div className="relative inline-block mb-3">
                                <Avatar className="h-16 w-16">
                                    <AvatarFallback className={`text-lg ${index === 0 ? 'bg-yellow-500 text-white' :
                                        index === 1 ? 'bg-emerald-500 text-white' :
                                            'bg-amber-600 text-white'
                                        }`}>
                                        {getInitials(teacher.name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className={`absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full text-white text-sm font-bold shadow-md ${index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                        'bg-amber-600'
                                    }`}>
                                    {index === 0 ? <Trophy className="h-4 w-4" /> : teacher.rank}
                                </div>
                            </div>
                            <h3 className="font-semibold">{teacher.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">{teacher.department}</p>
                            <div className="flex items-center justify-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                <span className="font-bold">{teacher.rating}</span>
                                <span className="text-xs text-muted-foreground ml-1">• {teacher.students} students</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* My Rank Card + Quick Stats */}
            <div className="grid gap-4 lg:grid-cols-4">
                {/* My Rank - Prominent */}
                <Card className="lg:col-span-2 border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-transparent">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-6">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-2xl shadow-lg">
                                #{myRank}
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold">Your Current Rank</h3>
                                <p className="text-sm text-muted-foreground">Based on student ratings</p>
                                <div className="flex items-center gap-1 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-5 w-5 ${i < Math.floor(myRating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`} />
                                    ))}
                                    <span className="ml-2 text-lg font-bold">{myRating}</span>
                                </div>
                            </div>
                            <div className="hidden md:block">
                                <Badge className="bg-emerald-500 text-white">Top 10%</Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent" />
                    <CardContent className="p-6 text-center relative">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">180</p>
                        <p className="text-xs text-muted-foreground">Total Students</p>
                    </CardContent>
                </Card>

                <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-transparent" />
                    <CardContent className="p-6 text-center relative">
                        <TrendingUp className="h-8 w-8 mx-auto mb-2 text-amber-500" />
                        <p className="text-2xl font-bold">+2</p>
                        <p className="text-xs text-muted-foreground">Rank Improvement</p>
                    </CardContent>
                </Card>
            </div>

            {/* All Teachers List - Compact */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">All Teachers Rankings</CardTitle>
                    <CardDescription>Complete leaderboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {mockTeachers.map((teacher, index) => (
                            <div
                                key={teacher.id}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${index === 1 ? 'border-emerald-500/50 bg-emerald-500/5' : 'hover:bg-muted/50'
                                    }`}
                            >
                                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                        index === 2 ? 'bg-amber-600 text-white' :
                                            'bg-muted text-muted-foreground'
                                    }`}>
                                    {index + 1}
                                </div>
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs">{getInitials(teacher.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-sm truncate">{teacher.name}</p>
                                        {index === 1 && <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-600">You</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{teacher.department}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
                                    <span className="text-sm font-medium">{teacher.rating}</span>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={`text-xs ${teacher.status === 'active' ? 'border-green-500 text-green-600' : 'border-amber-500 text-amber-600'}`}
                                >
                                    {teacher.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
