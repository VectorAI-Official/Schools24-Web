"use client"

import { StaffManagement } from '@/components/school/StaffManagement'
import { useAuth } from '@/contexts/AuthContext'

export default function StaffPage() {
    const { user } = useAuth()
    const schoolId = user?.role === 'super_admin' ? undefined : user?.school_id

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Staff Management</h1>
                <p className="text-muted-foreground">Manage non-teaching staff</p>
            </div>

            <StaffManagement schoolId={schoolId} />
        </div>
    )
}
