"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Star, Users } from 'lucide-react'
import { useTeacherLeaderboard } from '@/hooks/useTeacherLeaderboard'
import { getInitials } from '@/lib/utils'

export default function TeachersLeaderboardPage() {
    const { data, isLoading } = useTeacherLeaderboard()

    const top3 = data?.top_3 || []
    const allItems = data?.items || []

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Teachers Leaderboard</h1>
                    <p className="text-muted-foreground">Top performing teachers by rating</p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-6 flex flex-col items-center gap-3">
                                <div className="h-20 w-20 rounded-full bg-muted" />
                                <div className="h-4 bg-muted rounded w-32" />
                                <div className="h-3 bg-muted rounded w-24" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : top3.length === 0 && allItems.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                        <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-1">No leaderboard data yet</h3>
                        <p className="text-sm text-muted-foreground">Rankings will appear once teacher evaluations are available.</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Top 3 */}
                    {top3.length > 0 && (
                        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-3">
                            {top3.map((teacher, index) => (
                                <Card key={teacher.teacher_id} className={`card-hover ${index === 0 ? 'border-yellow-500 border-2' : ''}`}>
                                    <CardContent className="p-4 md:p-6 text-center">
                                        <div className="relative inline-block mb-4">
                                            <Avatar className="h-20 w-20">
                                                <AvatarFallback className={`text-xl ${index === 0 ? 'bg-yellow-500 text-white' :
                                                        index === 1 ? 'bg-gray-400 text-white' : 'bg-amber-600 text-white'
                                                    }`}>
                                                    {getInitials(teacher.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className={`absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full text-white text-sm font-bold ${index === 0 ? 'bg-yellow-500' :
                                                    index === 1 ? 'bg-gray-400' : 'bg-amber-600'
                                                }`}>
                                                {index === 0 ? <Trophy className="h-4 w-4" /> : teacher.rank}
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-lg">{teacher.name}</h3>
                                        <p className="text-sm text-muted-foreground">{teacher.department}</p>
                                        <div className="flex items-center justify-center gap-1 mt-3">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`h-4 w-4 ${i < Math.floor(teacher.rating) ? 'fill-yellow-500 text-yellow-500' : 'text-muted'}`} />
                                            ))}
                                            <span className="ml-2 font-bold">{teacher.rating}</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            {teacher.students_count} students
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Full List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Teachers</CardTitle>
                            <CardDescription>Complete rankings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {allItems.map((teacher, index) => (
                                    <div key={teacher.teacher_id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                                                index === 1 ? 'bg-gray-400 text-white' :
                                                    index === 2 ? 'bg-amber-600 text-white' : 'bg-muted'
                                            }`}>
                                            {teacher.rank}
                                        </div>
                                        <Avatar>
                                            <AvatarFallback>{getInitials(teacher.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="font-medium">{teacher.name}</p>
                                            <p className="text-sm text-muted-foreground">{teacher.department} • {teacher.students_count} students</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                                            <span className="font-medium">{teacher.rating}</span>
                                        </div>
                                        <Badge variant={teacher.status === 'active' ? 'success' : 'secondary'}>
                                            {teacher.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    )
}
