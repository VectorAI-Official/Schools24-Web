"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ArrowLeft, Loader2, Eye, EyeOff, Plus, Trash2 } from 'lucide-react'
import { getInitials } from '@/lib/utils'
import { useUpdateProfile, useChangePassword } from '@/hooks/useProfile'
import { useSuperAdmins, useCreateSuperAdmin, useDeleteSuperAdmin } from '@/hooks/useSuperAdmins'
import { PasswordPromptDialog } from '@/components/super-admin/PasswordPromptDialog'
import { toast } from 'sonner'

export function SuperAdminSettingsPanel({ embedded = false }: { embedded?: boolean }) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawTab = searchParams.get('tab') || 'profile'
  const initialTab = rawTab === 'profile' || rawTab === 'security' || rawTab === 'super-admins' ? rawTab : 'profile'
  const [activeTab, setActiveTab] = useState(initialTab)
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const { data: superAdmins = [], isLoading: isSuperAdminsLoading } = useSuperAdmins(true)
  const createSuperAdmin = useCreateSuperAdmin()
  const deleteSuperAdmin = useDeleteSuperAdmin()

  // Profile form state
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const [newSuperAdmin, setNewSuperAdmin] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: '',
  })
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false)
  const [showCreatePasswordPrompt, setShowCreatePasswordPrompt] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string; name: string } | null>(null)

  // Load user data into form
  useEffect(() => {
    if (user) {
      setProfileData({
        full_name: user.full_name || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  // Redirect if not super admin
  useEffect(() => {
    if (!authLoading && user?.role !== 'super_admin') {
      router.push('/login')
    }
  }, [authLoading, user, router])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only send changed fields
    const updates: { full_name?: string; phone?: string } = {}
    if (profileData.full_name !== user?.full_name) updates.full_name = profileData.full_name
    if (profileData.phone !== user?.phone) updates.phone = profileData.phone

    if (Object.keys(updates).length === 0) {
      return // No changes
    }

    updateProfile.mutate(updates)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate passwords match
    if (passwordData.new_password !== passwordData.confirm_password) {
      return
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(passwordData.new_password)) {
      return
    }

    changePassword.mutate(
      {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      },
      {
        onSuccess: () => {
          // Clear form on success
          setPasswordData({
            current_password: '',
            new_password: '',
            confirm_password: '',
          })
        },
      }
    )
  }

  const handleCreateSuperAdmin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required fields
    if (!newSuperAdmin.full_name || !newSuperAdmin.email || !newSuperAdmin.password) {
      toast.error('All required fields must be filled')
      return
    }

    // Check if email already exists
    if (emailAlreadyExists) {
      toast.error('Email already exists')
      return
    }

    // Show password prompt for verification
    setShowCreatePasswordPrompt(true)
  }

  const handleCreateSuperAdminWithPassword = async (currentPassword: string) => {
    try {
      await createSuperAdmin.mutateAsync({
        full_name: newSuperAdmin.full_name,
        email: newSuperAdmin.email,
        password: newSuperAdmin.password,
        phone: newSuperAdmin.phone || undefined,
        current_password: currentPassword
      })
      
      toast.success('Super Admin Created', {
        description: `${newSuperAdmin.full_name} has been added as a super admin.`
      })
      
      setNewSuperAdmin({
        full_name: '',
        email: '',
        password: '',
        phone: '',
      })
      setShowNewAdminPassword(false)
      setShowCreatePasswordPrompt(false)
    } catch (error) {
      // Error handled by hook and PasswordPromptDialog
      throw error
    }
  }

  const handleDeleteSuperAdmin = (id: string, name: string) => {
    setDeleteConfirmation({ id, name })
  }

  const confirmDeleteSuperAdmin = async (password: string) => {
    if (!deleteConfirmation) return
    
    try {
      await deleteSuperAdmin.mutateAsync({
        id: deleteConfirmation.id,
        password
      })
      
      toast.success('Super Admin Deleted', {
        description: `${deleteConfirmation.name} has been removed from super admins.`
      })
      
      setDeleteConfirmation(null)
    } catch (error) {
      // Error handled by hook and PasswordPromptDialog
      throw error
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const passwordsMatch = passwordData.new_password === passwordData.confirm_password
  const isPasswordStrong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
    passwordData.new_password
  )

  // Check if email already exists in super admins list
  const emailAlreadyExists = newSuperAdmin.email.trim() !== '' && 
    superAdmins.some(sa => sa.email.toLowerCase() === newSuperAdmin.email.toLowerCase())

  return (
    <div className={embedded ? "space-y-6" : "min-h-screen bg-slate-50 dark:bg-slate-900 p-6"}>
      <div className={embedded ? "space-y-6" : "max-w-4xl mx-auto space-y-6"}>
        {/* Header */}
        {!embedded && (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/super-admin')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Manage your profile and security settings
              </p>
            </div>
          </div>
        )}

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full max-w-xl grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="super-admins">Super Admins</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your personal information and avatar</CardDescription>
              </CardHeader>
              <form onSubmit={handleProfileUpdate}>
                <CardContent className="space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      type="text"
                      required
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={updateProfile.isPending}>
                    {updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <form onSubmit={handlePasswordChange}>
                <CardContent className="space-y-4">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Current Password *</Label>
                    <div className="relative">
                      <Input
                        id="current_password"
                        type={showPasswords.current ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordData.current_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, current_password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                        aria-label={showPasswords.current ? "Hide password" : "Show password"}
                      >
                        {showPasswords.current ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New Password *</Label>
                    <div className="relative">
                      <Input
                        id="new_password"
                        type={showPasswords.new ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordData.new_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, new_password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                        aria-label={showPasswords.new ? "Hide password" : "Show password"}
                      >
                        {showPasswords.new ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {passwordData.new_password && !isPasswordStrong && (
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Password must be 8+ chars with uppercase, lowercase, number & special char
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirm New Password *</Label>
                    <div className="relative">
                      <Input
                        id="confirm_password"
                        type={showPasswords.confirm ? 'text' : 'password'}
                        required
                        minLength={8}
                        value={passwordData.confirm_password}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirm_password: e.target.value })
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                        aria-label={showPasswords.confirm ? "Hide password" : "Show password"}
                      >
                        {showPasswords.confirm ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                    {passwordData.confirm_password && !passwordsMatch && (
                      <p className="text-xs text-red-600 dark:text-red-400">Passwords do not match</p>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    disabled={
                      changePassword.isPending ||
                      !passwordsMatch ||
                      !isPasswordStrong ||
                      !passwordData.current_password
                    }
                  >
                    {changePassword.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Change Password
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          {/* Super Admins Tab */}
          <TabsContent value="super-admins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Super Admin Management</CardTitle>
                <CardDescription>Create and remove global super admins</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sa_full_name">Full Name *</Label>
                      <Input
                        id="sa_full_name"
                        type="text"
                        required
                        value={newSuperAdmin.full_name}
                        onChange={(e) => setNewSuperAdmin({ ...newSuperAdmin, full_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sa_email">Email *</Label>
                      <Input
                        id="sa_email"
                        type="email"
                        required
                        value={newSuperAdmin.email}
                        onChange={(e) => setNewSuperAdmin({ ...newSuperAdmin, email: e.target.value })}
                        className={emailAlreadyExists ? 'border-red-500 focus-visible:ring-red-500' : ''}
                      />
                      {emailAlreadyExists && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                          ⚠️ This email is already registered as a super admin
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sa_password">Password *</Label>
                      <div className="relative">
                        <Input
                          id="sa_password"
                          type={showNewAdminPassword ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={newSuperAdmin.password}
                          onChange={(e) => setNewSuperAdmin({ ...newSuperAdmin, password: e.target.value })}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewAdminPassword(!showNewAdminPassword)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-accent rounded-sm transition-colors"
                          aria-label={showNewAdminPassword ? "Hide password" : "Show password"}
                        >
                          {showNewAdminPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sa_phone">Phone</Label>
                      <Input
                        id="sa_phone"
                        type="tel"
                        value={newSuperAdmin.phone}
                        onChange={(e) => setNewSuperAdmin({ ...newSuperAdmin, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={createSuperAdmin.isPending || emailAlreadyExists}
                  >
                    {createSuperAdmin.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add Super Admin
                  </Button>
                </form>

                <div className="border-t pt-6 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Existing Super Admins</h3>
                  {isSuperAdminsLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading super admins...
                    </div>
                  ) : superAdmins.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No super admins found.</p>
                  ) : (
                    <div className="space-y-3">
                      {superAdmins.map((sa) => (
                        <div key={sa.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarImage src={sa.profile_picture_url || undefined} alt={sa.full_name} />
                              <AvatarFallback className="bg-indigo-700 text-white text-sm">
                                {getInitials(sa.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{sa.full_name}</p>
                              <p className="text-xs text-muted-foreground">{sa.email}</p>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={sa.id === user.id || deleteSuperAdmin.isPending}
                            onClick={() => handleDeleteSuperAdmin(sa.id, sa.full_name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Password Prompt for Create Super Admin */}
      <PasswordPromptDialog
        open={showCreatePasswordPrompt}
        onOpenChange={setShowCreatePasswordPrompt}
        onConfirm={handleCreateSuperAdminWithPassword}
        title="Verify Your Password"
        description={`Enter your password to create a new super admin account for "${newSuperAdmin.full_name}".`}
        actionLabel="Create Super Admin"
        actionVariant="default"
      />

      {/* Password Prompt for Delete Super Admin */}
      <PasswordPromptDialog
        open={!!deleteConfirmation}
        onOpenChange={(open) => !open && setDeleteConfirmation(null)}
        onConfirm={confirmDeleteSuperAdmin}
        title={`Delete Super Admin: ${deleteConfirmation?.name}`}
        description="Enter your password to remove this super admin account."
        actionLabel="Delete Super Admin"
        actionVariant="destructive"
        warningMessage="⚠️ This will permanently remove the super admin's access. They will no longer be able to manage schools or other super admins."
      />
    </div>
  )
}

export default function SuperAdminSettingsPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/super-admin?tab=settings')
  }, [router])
  return null
}
