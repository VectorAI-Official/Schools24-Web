import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export interface FeeDemandApi {
    id: string
    student_id: string
    student_name: string
    admission_number: string
    class_name: string
    purpose: string
    amount: number
    paid_amount: number
    due_date?: string
    last_payment_date?: string
    status: 'paid' | 'partial' | 'pending' | 'overdue'
    created_at: string
    updated_at: string
}

export interface FeeDemand {
    id: string
    studentId: string
    studentName: string
    admissionNumber: string
    className: string
    purpose: string
    amount: number
    paidAmount: number
    dueDate?: string
    lastPaymentDate?: string
    status: 'paid' | 'partial' | 'pending' | 'overdue'
}

export interface FeeDemandResponse {
    items: FeeDemandApi[]
    total: number
    page: number
    page_size: number
}

export interface CreateFeeDemandInput {
    studentId: string
    purpose: string
    amount: number
    dueDate?: string
    academicYear?: string
}

export interface RecordFeePaymentInput {
    studentId: string
    studentFeeId: string
    amount: number
    paymentMethod: string
    transactionId?: string
    purpose?: string
    notes?: string
}

const formatDate = (value?: string) => {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toISOString().split('T')[0]
}

const mapFeeDemand = (item: FeeDemandApi): FeeDemand => ({
    id: item.id,
    studentId: item.student_id,
    studentName: item.student_name,
    admissionNumber: item.admission_number,
    className: item.class_name,
    purpose: item.purpose,
    amount: item.amount,
    paidAmount: item.paid_amount,
    dueDate: formatDate(item.due_date),
    lastPaymentDate: formatDate(item.last_payment_date),
    status: item.status,
})

export function useFeeDemands(
    schoolId: string | undefined,
    params: { search?: string; status?: string; page?: number; pageSize?: number; enabled?: boolean } = {}
) {
    const { search = '', status = 'all', page = 1, pageSize = 20, enabled = true } = params

    return useQuery({
        queryKey: ['fee-demands', schoolId, search, status, page, pageSize],
        queryFn: async () => {
            const qs = new URLSearchParams()
            if (schoolId) qs.append('school_id', schoolId)
            if (search) qs.append('search', search)
            if (status) qs.append('status', status)
            qs.append('page', page.toString())
            qs.append('page_size', pageSize.toString())
            const url = `/admin/fees/demands?${qs.toString()}`
            const res = await api.get<FeeDemandResponse>(url)
            return {
                ...res,
                items: res.items.map(mapFeeDemand),
            }
        },
        enabled,
    })
}

export function useCreateFeeDemand(schoolId?: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: CreateFeeDemandInput) => {
            const params = new URLSearchParams()
            if (schoolId) params.append('school_id', schoolId)
            const url = `/admin/fees/demands${params.toString() ? `?${params.toString()}` : ''}`
            return api.post(url, {
                student_id: data.studentId,
                purpose: data.purpose,
                amount: data.amount,
                due_date: data.dueDate || null,
                academic_year: data.academicYear || null,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-demands', schoolId] })
            toast.success('Fee demand created')
        },
        onError: (error: any) => {
            toast.error('Failed to create fee demand', {
                description: error.message || 'An error occurred',
            })
        },
    })
}

export function useRecordFeePayment(schoolId?: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: async (data: RecordFeePaymentInput) => {
            const params = new URLSearchParams()
            if (schoolId) params.append('school_id', schoolId)
            const url = `/admin/fees/payments${params.toString() ? `?${params.toString()}` : ''}`
            return api.post(url, {
                student_id: data.studentId,
                student_fee_id: data.studentFeeId,
                amount: data.amount,
                payment_method: data.paymentMethod,
                transaction_id: data.transactionId || null,
                notes: data.notes || null,
                purpose: data.purpose || null,
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['fee-demands', schoolId] })
            toast.success('Payment recorded')
        },
        onError: (error: any) => {
            toast.error('Failed to record payment', {
                description: error.message || 'An error occurred',
            })
        },
    })
}
