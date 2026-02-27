"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Trophy, Loader2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useStudentsLeaderboard } from '@/hooks/useAdminLeaderboards'
import { LeaderboardPodium } from '@/components/admin/leaderboard/LeaderboardPodium'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { formatSchoolClassLabel } from '@/lib/classOrdering'

export default function StudentsLeaderboardPage() {
    const searchParams = useSearchParams()
    const schoolId = searchParams.get('school_id') || undefined
    const { user, isLoading } = useAuth()
    const canLoad = !!user && !isLoading && (user.role !== 'super_admin' || !!schoolId)

    const { data, isLoading: isLeaderboardLoading, isError } = useStudentsLeaderboard({
        enabled: canLoad,
        schoolId,
        limit: 100,
    })

    const topThree = data?.top_3 || []
    const fullItems = data?.items || []

    const BATCH_SIZE = 20
    const [displayedCount, setDisplayedCount] = useState(BATCH_SIZE)
    const visibleItems = fullItems.slice(0, displayedCount)
    const hasMore = displayedCount < fullItems.length

    const { ref: sentinelRef, inView } = useIntersectionObserver({ threshold: 0.1 })
    useEffect(() => {
        if (inView && hasMore) {
            setDisplayedCount(c => Math.min(c + BATCH_SIZE, fullItems.length))
        }
    }, [inView, hasMore, fullItems.length])

    useEffect(() => {
        setDisplayedCount(BATCH_SIZE)
    }, [data])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-3xl font-bold">Students Leaderboard</h1>
                    <p className="text-muted-foreground">Top performing students based on academic scores</p>
                </div>
            </div>

            {/* Top 3 Students */}
            <div className="mb-12">
                <LeaderboardPodium
                    type="student"
                    items={topThree.map(s => ({
                        id: s.student_id,
                        rank: s.rank,
                        name: s.name,
                        subtitle: `Class ${s.class_name}`,
                        score: s.avg_assessment_pct ?? 0,
                        scoreLabel: "Assessment Avg.",
                        trend: 'stable' as const,
                        secondaryMetric: {
                            value: s.assessments_with_scores,
                            label: "Scored"
                        },
                        avatarUrl: undefined
                    }))}
                />
            </div>

            {/* Full Leaderboard */}
            <Card>
                <CardHeader>
                    <CardTitle>Full Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLeaderboardLoading && (
                            <div className="text-sm text-muted-foreground">Loading leaderboard...</div>
                        )}
                        {isError && (
                            <div className="text-sm text-destructive">Failed to load student leaderboard.</div>
                        )}
                        {!isLeaderboardLoading && !isError && visibleItems.map((student, index) => (
                            <div key={student.student_id} className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-full font-bold ${index === 0 ? 'bg-yellow-500 text-white' :
                                    index === 1 ? 'bg-gray-400 text-white' :
                                        index === 2 ? 'bg-amber-600 text-white' : 'bg-muted text-muted-foreground'
                                    }`}>
                                    {student.rank}
                                </div>
                                <Avatar>
                                    <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{student.name}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatSchoolClassLabel({ name: student.class_name, section: student.section })} • Roll No: {student.roll_number || 'N/A'}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold text-primary">{(student.avg_assessment_pct ?? 0).toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">Assess. Avg.</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-lg font-bold">{student.assessments_with_scores}</p>
                                    <p className="text-xs text-muted-foreground">Scored</p>
                                </div>
                                <Badge variant={index < 3 ? 'default' : 'secondary'}>
                                    {index < 3 ? <><Trophy className="h-3 w-3 mr-1" />Top {index + 1}</> : `Rank #${student.rank}`}
                                </Badge>
                            </div>
                        ))}
                        {hasMore && (
                            <div ref={sentinelRef} className="flex justify-center py-3">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card >
        </div >
    )
}
