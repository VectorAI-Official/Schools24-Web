"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  AlertCircle, 
  Clock,
  ArrowLeft,
  School as SchoolIcon,
  MapPin,
  Mail,
  User
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useDeletedSchools, useRestoreSchool } from '@/hooks/useSchools'
import { ProfileDropdown } from '@/components/super-admin/ProfileDropdown'
import { PasswordPromptDialog } from '@/components/super-admin/PasswordPromptDialog'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDistanceToNow, parseISO, differenceInHours } from 'date-fns'

export function SuperAdminTrashPanel({ embedded = false }: { embedded?: boolean }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearch = useDebounce(searchQuery, 300)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<{ id: string; name: string } | null>(null)
  
  const isSuperAdmin = user?.role === 'super_admin'
  const canLoad = isSuperAdmin && !authLoading
  
  const { data: deletedSchools = [], isLoading: isLoadingDeleted } = useDeletedSchools(canLoad)
  const restoreSchool = useRestoreSchool()

  // Redirect if not super admin
  useEffect(() => {
    if (authLoading || !user) return
    if (!isSuperAdmin) {
      router.push('/super-admin')
    }
  }, [authLoading, isSuperAdmin, router, user])

  // Filter deleted schools by search query
  const filteredSchools = useMemo(() => {
    if (!deletedSchools || !Array.isArray(deletedSchools)) return []
    return deletedSchools.filter(s =>
      s.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.contact_email?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      s.deleted_by_name?.toLowerCase().includes(debouncedSearch.toLowerCase())
    )
  }, [deletedSchools, debouncedSearch])

  // Calculate hours remaining for a school
  const getHoursRemaining = (deletedAt: string) => {
    const deletedDate = parseISO(deletedAt)
    const hoursElapsed = differenceInHours(new Date(), deletedDate)
    return Math.max(0, 24 - hoursElapsed)
  }

  // Get urgency level for visual indicators
  const getUrgencyLevel = (hoursRemaining: number): 'critical' | 'warning' | 'normal' => {
    if (hoursRemaining <= 2) return 'critical'
    if (hoursRemaining <= 6) return 'warning'
    return 'normal'
  }

  const handleRestoreClick = (schoolId: string, schoolName: string) => {
    setSelectedSchool({ id: schoolId, name: schoolName })
    setRestoreDialogOpen(true)
  }

  const handleRestoreConfirm = async (password: string) => {
    if (!selectedSchool) return
    
    try {
      await restoreSchool.mutateAsync({
        schoolId: selectedSchool.id,
        password
      })
      toast.success('School Restored', {
        description: `${selectedSchool.name} has been successfully restored.`
      })
      setRestoreDialogOpen(false)
      setSelectedSchool(null)
    } catch (error: unknown) {
      // Error is handled by the hook, but we can show additional context
      if (error instanceof Error && error.message?.includes('24 hours')) {
        toast.error('Cannot Restore', {
          description: 'This school has passed the 24-hour recovery window and has been permanently deleted.'
        })
      }
      throw error // Re-throw to let PasswordPromptDialog handle it
    }
  }

  if (authLoading || !isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? "space-y-8" : "min-h-screen bg-slate-50 dark:bg-slate-900"}>
      {!embedded && (
        <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
          <div className="container mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Trash2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Trash Bin</h1>
                <p className="text-xs text-slate-400">Deleted Schools - 24 Hour Recovery Window</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-orange-800/50 rounded-full border border-orange-700/50 shadow-inner">
                <Trash2 className="h-4 w-4 text-orange-300" />
                <span className="text-sm font-medium text-orange-100">
                  {deletedSchools?.length || 0} {(deletedSchools?.length || 0) === 1 ? 'School' : 'Schools'}
                </span>
              </div>
              <ProfileDropdown />
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? "space-y-8" : "container mx-auto px-6 py-8 space-y-8"}>
        {/* Back Button and Info Alert */}
        <div className="flex flex-col gap-4">
          {!embedded && (
            <Button
              variant="ghost"
              onClick={() => router.push('/super-admin')}
              className="self-start"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          )}

          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-900">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Recovery Window Information
                  </p>
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Deleted schools can be restored within 24 hours. After this period, 
                    they will be permanently deleted along with all associated data including 
                    tenant schemas. This action cannot be undone.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        {(deletedSchools?.length || 0) > 0 && (
          <div className="flex justify-between items-center gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deleted schools..."
                className="pl-10 bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoadingDeleted && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoadingDeleted && (deletedSchools?.length || 0) === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-slate-100 dark:bg-slate-800 p-4 md:p-6 mb-4">
                <Trash2 className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Trash bin is empty
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 text-center max-w-sm">
                No deleted schools found. Deleted schools will appear here and can be restored within 24 hours.
              </p>
              {!embedded && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/super-admin')}
                  className="mt-6"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Deleted Schools Grid */}
        {!isLoadingDeleted && filteredSchools.length > 0 && (
          <div className="grid grid-cols-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredSchools.map((school) => {
              const hoursRemaining = getHoursRemaining(school.deleted_at!)
              const urgency = getUrgencyLevel(hoursRemaining)
              const urgencyColors = {
                critical: {
                  border: 'border-red-300 dark:border-red-800',
                  bg: 'bg-red-50 dark:bg-red-950/20',
                  badge: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                  icon: 'text-red-600 dark:text-red-400'
                },
                warning: {
                  border: 'border-orange-300 dark:border-orange-800',
                  bg: 'bg-orange-50 dark:bg-orange-950/20',
                  badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
                  icon: 'text-orange-600 dark:text-orange-400'
                },
                normal: {
                  border: 'border-slate-200 dark:border-slate-700',
                  bg: 'bg-white dark:bg-slate-800',
                  badge: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200',
                  icon: 'text-slate-600 dark:text-slate-400'
                }
              }

              return (
                <Card 
                  key={school.id} 
                  className={`${urgencyColors[urgency].border} ${urgencyColors[urgency].bg} hover:shadow-lg transition-shadow`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${urgency === 'critical' ? 'bg-red-100 dark:bg-red-900' : urgency === 'warning' ? 'bg-orange-100 dark:bg-orange-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
                          <SchoolIcon className={`h-5 w-5 ${urgencyColors[urgency].icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {school.name}
                          </CardTitle>
                          <CardDescription className="text-xs mt-1">
                            ID: {school.id.slice(0, 8)}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* School Details */}
                    <div className="space-y-2 text-sm">
                      {school.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4 shrink-0" />
                          <span className="truncate">{school.address}</span>
                        </div>
                      )}
                      {school.contact_email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4 shrink-0" />
                          <span className="truncate">{school.contact_email}</span>
                        </div>
                      )}
                    </div>

                    {/* Deletion Info */}
                    <div className="pt-3 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Deleted by:</span>
                        <span className="font-medium">{school.deleted_by_name || 'Unknown'}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatDistanceToNow(parseISO(school.deleted_at!), { addSuffix: true })}
                        </span>
                      </div>

                      {/* Time Remaining Badge */}
                      <Badge className={`${urgencyColors[urgency].badge} font-mono text-xs`}>
                        {hoursRemaining}h {Math.floor((hoursRemaining % 1) * 60)}m remaining
                      </Badge>
                    </div>

                    {/* Restore Button */}
                    <Button
                      onClick={() => handleRestoreClick(school.id, school.name)}
                      disabled={restoreSchool.isPending}
                      className="w-full"
                      variant={urgency === 'critical' ? 'default' : 'outline'}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore School
                    </Button>

                    {urgency === 'critical' && (
                      <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium">
                        ⚠️ Critical: Less than 2 hours remaining!
                      </p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* No Search Results */}
        {!isLoadingDeleted && (deletedSchools?.length || 0) > 0 && filteredSchools.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No schools found
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Try adjusting your search query
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Password Prompt Dialog for Restore */}
      <PasswordPromptDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        onConfirm={handleRestoreConfirm}
        title="Restore School"
        description={`Enter your password to restore "${selectedSchool?.name}". All associated data will be restored.`}
        actionLabel="Restore School"
        actionVariant="default"
        warningMessage="This will restore the school and make it active again. All admins and data will be accessible."
      />
    </div>
  )
}

export default function TrashBinPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/super-admin?tab=trash')
  }, [router])
  return null
}
