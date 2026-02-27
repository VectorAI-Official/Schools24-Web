import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Crown, Medal, Star, TrendingDown, TrendingUp, Minus, Trophy } from "lucide-react"

export interface PodiumItem {
    id: string
    rank: number
    name: string
    subtitle: string
    score: number
    scoreLabel: string
    trend: 'up' | 'down' | 'stable'
    secondaryMetric?: {
        value: number
        label: string
    }
    avatarUrl?: string
}

interface LeaderboardPodiumProps {
    items: PodiumItem[]
    type: 'student' | 'teacher'
}

export function LeaderboardPodium({ items, type }: LeaderboardPodiumProps) {
    const rank1 = items.find(i => i.rank === 1)
    const rank2 = items.find(i => i.rank === 2)
    const rank3 = items.find(i => i.rank === 3)

    const renderWinnerCard = (item: PodiumItem | undefined, position: 'first' | 'second' | 'third') => {
        if (!item) return null

        const isFirst = position === 'first'
        const isSecond = position === 'second'
        const isThird = position === 'third'

        // Platform heights for podium effect
        const platformHeight = isFirst ? 'h-32' : isSecond ? 'h-24' : 'h-20'
        const platformColor = isFirst
            ? 'bg-gradient-to-t from-yellow-600 via-yellow-500 to-yellow-400'
            : isSecond
                ? 'bg-gradient-to-t from-slate-500 via-slate-400 to-slate-300'
                : 'bg-gradient-to-t from-orange-700 via-orange-600 to-orange-500'

        const rankLabel = isFirst ? '1st' : isSecond ? '2nd' : '3rd'
        const accentColor = isFirst ? 'text-yellow-500' : isSecond ? 'text-slate-400' : 'text-orange-500'
        const borderColor = isFirst ? 'border-yellow-400/50' : isSecond ? 'border-slate-400/50' : 'border-orange-400/50'
        const glowColor = isFirst ? 'shadow-yellow-500/20' : isSecond ? 'shadow-slate-400/10' : 'shadow-orange-500/15'

        return (
            <div className={`flex flex-col items-center ${isFirst ? 'order-2 z-10' : isSecond ? 'order-1' : 'order-3'}`}>
                {/* Winner Card - Glassmorphism */}
                <div className={`
                    relative w-56 p-5 rounded-2xl
                    backdrop-blur-xl bg-white/80 dark:bg-slate-900/80
                    border ${borderColor}
                    shadow-2xl ${glowColor}
                    ${isFirst ? 'scale-105' : ''}
                `}>
                    {/* Crown/Medal Icon */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        {isFirst ? (
                            <div className="relative">
                                <Crown className="w-10 h-10 text-yellow-500 drop-shadow-lg" fill="currentColor" />
                                <div className="absolute inset-0 bg-yellow-400/50 blur-xl rounded-full -z-10" />
                            </div>
                        ) : (
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${isSecond ? 'bg-slate-500' : 'bg-orange-600'}`}>
                                {isSecond ? '2' : '3'}
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    <div className="flex justify-center mt-4 mb-3">
                        <div className={`relative p-1 rounded-full ${isFirst ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' : isSecond ? 'bg-gradient-to-br from-slate-300 to-slate-500' : 'bg-gradient-to-br from-orange-400 to-orange-600'}`}>
                            <Avatar className="w-20 h-20 border-4 border-white dark:border-slate-800">
                                <AvatarFallback className="text-xl font-bold bg-white dark:bg-slate-800">
                                    {getInitials(item.name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-1 shadow-md">
                                {isFirst ? (
                                    <Trophy className="w-4 h-4 text-yellow-500" fill="currentColor" />
                                ) : (
                                    <Medal className={`w-4 h-4 ${accentColor}`} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Name & Subtitle */}
                    <div className="text-center mb-3">
                        <h3 className="font-bold text-base truncate">{item.name}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">{item.subtitle}</p>
                    </div>

                    {/* Score */}
                    <div className="text-center mb-3">
                        <div className="flex items-center justify-center gap-1">
                            {type === 'teacher' && <Star className={`w-4 h-4 ${accentColor}`} fill="currentColor" />}
                            <span className={`text-2xl font-black ${accentColor}`}>
                                {item.score}
                                {type === 'student' && <span className="text-sm">%</span>}
                            </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase">{item.scoreLabel}</p>
                    </div>

                    {/* Metrics Row */}
                    <div className="flex justify-center gap-3 text-xs">
                        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50">
                            {item.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-500" />}
                            {item.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
                            {item.trend === 'stable' && <Minus className="w-3 h-3 text-muted-foreground" />}
                            <span className={item.trend === 'up' ? 'text-green-600' : item.trend === 'down' ? 'text-red-600' : 'text-muted-foreground'}>
                                {item.trend === 'up' ? 'Up' : item.trend === 'down' ? 'Down' : 'Stable'}
                            </span>
                        </div>
                        {item.secondaryMetric && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50">
                                <span className="font-semibold">{item.secondaryMetric.value}{item.secondaryMetric.label === 'Attendance' ? '%' : ''}</span>
                                <span className="text-muted-foreground">{item.secondaryMetric.label}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Podium Platform */}
                <div className={`
                    w-48 ${platformHeight} mt-4 rounded-t-lg
                    ${platformColor}
                    flex items-center justify-center
                    shadow-xl
                    border-t-4 ${isFirst ? 'border-yellow-300' : isSecond ? 'border-slate-200' : 'border-orange-400'}
                `}>
                    <span className={`text-2xl font-black text-white drop-shadow-lg`}>
                        {rankLabel}
                    </span>
                </div>
            </div>
        )
    }

    return (
        <div className="relative w-full overflow-hidden rounded-2xl">
            {/* Award Ceremony Stage Background - Rich Purple/Gold */}
            <div className="absolute inset-0 bg-gradient-to-b from-purple-950 via-indigo-950 to-slate-950" />

            {/* Radial Light Burst from Center */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(ellipse_at_top_center,_rgba(251,191,36,0.15)_0%,_transparent_60%)]" />

            {/* Colorful Spotlight Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-48 bg-gradient-to-b from-yellow-400/30 to-transparent blur-3xl" />
            <div className="absolute top-0 left-10 w-32 h-40 bg-gradient-to-b from-pink-500/20 to-transparent blur-2xl" />
            <div className="absolute top-0 right-10 w-32 h-40 bg-gradient-to-b from-cyan-500/20 to-transparent blur-2xl" />
            <div className="absolute top-20 left-1/3 w-24 h-24 bg-purple-500/15 blur-2xl rounded-full" />
            <div className="absolute top-20 right-1/3 w-24 h-24 bg-pink-500/15 blur-2xl rounded-full" />

            {/* Confetti Particles */}
            <div className="absolute top-8 left-[10%] w-2 h-2 bg-yellow-400 rotate-45" />
            <div className="absolute top-12 left-[15%] w-1.5 h-3 bg-pink-400 rotate-12" />
            <div className="absolute top-6 left-[25%] w-2 h-2 bg-cyan-400 rotate-[60deg]" />
            <div className="absolute top-16 left-[30%] w-1 h-2.5 bg-yellow-300 -rotate-12" />
            <div className="absolute top-10 right-[10%] w-2 h-2 bg-pink-300 rotate-45" />
            <div className="absolute top-14 right-[18%] w-1.5 h-3 bg-yellow-400 rotate-[30deg]" />
            <div className="absolute top-8 right-[28%] w-2 h-2 bg-cyan-300 -rotate-45" />
            <div className="absolute top-20 right-[22%] w-1 h-2.5 bg-purple-300 rotate-12" />
            <div className="absolute top-24 left-[8%] w-1.5 h-1.5 bg-green-400 rotate-45" />
            <div className="absolute top-28 right-[8%] w-1.5 h-1.5 bg-orange-400 rotate-12" />

            {/* Decorative Stars/Sparkles - More visible */}
            <div className="absolute top-4 left-6 text-yellow-400/60">
                <Star className="w-5 h-5" fill="currentColor" />
            </div>
            <div className="absolute top-6 right-8 text-yellow-400/50">
                <Star className="w-6 h-6" fill="currentColor" />
            </div>
            <div className="absolute top-10 left-[20%] text-pink-400/40">
                <Star className="w-4 h-4" fill="currentColor" />
            </div>
            <div className="absolute top-8 right-[25%] text-cyan-400/40">
                <Star className="w-3 h-3" fill="currentColor" />
            </div>
            <div className="absolute top-20 left-4 text-yellow-300/30">
                <Star className="w-3 h-3" fill="currentColor" />
            </div>
            <div className="absolute top-16 right-6 text-pink-300/30">
                <Star className="w-4 h-4" fill="currentColor" />
            </div>

            {/* Main Content */}
            <div className="relative z-10 pt-12 pb-0 px-6">
                {/* Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30 mb-3">
                        <Trophy className="w-5 h-5 text-yellow-400" fill="currentColor" />
                        <span className="text-yellow-400 font-semibold text-sm uppercase tracking-wider">Top Performers</span>
                        <Trophy className="w-5 h-5 text-yellow-400" fill="currentColor" />
                    </div>
                </div>

                {/* Winners */}
                <div className="flex items-end justify-center gap-4 md:gap-6">
                    {renderWinnerCard(rank2, 'second')}
                    {renderWinnerCard(rank1, 'first')}
                    {renderWinnerCard(rank3, 'third')}
                </div>

                {/* Stage Base */}
                <div className="relative mt-0">
                    <div className="h-4 bg-gradient-to-b from-slate-700 to-slate-800 rounded-b-2xl shadow-inner" />
                    <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-transparent via-yellow-500/30 to-transparent" />
                </div>
            </div>
        </div>
    )
}
