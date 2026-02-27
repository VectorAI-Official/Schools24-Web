import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface ClassSubject {
    id: string
    name: string
    code: string
    description?: string | null
    grade_levels?: number[]
    credits?: number
    is_optional?: boolean
    created_at?: string
}

export interface CreateSubjectRequest {
    name: string
    code: string
    description?: string | null
    grade_levels?: number[]
    credits?: number
    is_optional?: boolean
}

export function useClassSubjects(classId: string | null, options: { enabled?: boolean } = {}) {
    const { enabled = true } = options

    return useQuery({
        queryKey: ['class-subjects', classId],
        queryFn: async () => {
            if (!classId) throw new Error('Class ID is required')
            return api.get<{ subjects: ClassSubject[] }>(`/admin/classes/${classId}/subjects`)
        },
        enabled: enabled && !!classId,
        staleTime: 2 * 60_000,
        refetchOnWindowFocus: false,
    })
}

export function useCreateSubject(classId: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateSubjectRequest) => {
            return api.post<{ subject: ClassSubject }>('/admin/subjects', data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] })
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            toast.success('Subject created successfully')
        },
        onError: (error: any) => {
            toast.error('Failed to create subject', {
                description: error.message || 'An error occurred'
            })
        }
    })
}

export function useUpdateSubject(classId: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: CreateSubjectRequest }) => {
            return api.put<{ message: string; subject: ClassSubject }>(`/admin/subjects/${id}`, data)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] })
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            toast.success('Subject updated successfully')
        },
        onError: (error: any) => {
            toast.error('Failed to update subject', {
                description: error.message || 'An error occurred'
            })
        }
    })
}

export function useDeleteSubject(classId: string | null) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (subjectId: string) => {
            return api.delete<{ message: string }>(`/admin/subjects/${subjectId}`)
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['class-subjects', classId] })
            queryClient.invalidateQueries({ queryKey: ['subjects'] })
            toast.success('Subject deleted successfully')
        },
        onError: (error: any) => {
            toast.error('Failed to delete subject', {
                description: error.message || 'An error occurred'
            })
        }
    })
}
