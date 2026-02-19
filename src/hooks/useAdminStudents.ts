import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Define Student type based on backend response
export interface Student {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    admission_number: string;
    roll_number?: string;
    class_id?: string;
    class_name?: string;
    section?: string;
    parent_name?: string;
    parent_phone?: string;
    parent_email?: string;
    admission_date?: string;
    academic_year?: string;
    bus_route_id?: string | null;
    transport_mode?: string;
    gender: string;
    date_of_birth: string;
    blood_group?: string;
    address?: string;
    emergency_contact?: string;
    current_grade?: string;  // Academic performance grade: A+, A, B+, B, C, D, F, or X
    attendance_stats?: {
        attendance_percent: number;
        total_days?: number;
        present_days?: number;
    };
    fees?: {
        status: 'paid' | 'partial' | 'pending';
        paid: number;
        total: number;
    };
}

interface StudentsResponse {
    students: Student[];
    total: number;
    page: number;
    page_size: number;
}

export function useStudents(
    search: string = '',
    pageSize: number = 20,
    schoolId?: string,
    options: { enabled?: boolean } = {}
) {
    const { user, isLoading } = useAuth();
    const isSuperAdmin = user?.role === 'super_admin';

    // For super admin: use provided schoolId or their school_id
    // For regular admin: backend will automatically scope to their school via JWT
    const resolvedSchoolId = isSuperAdmin ? (schoolId || user?.school_id) : undefined;

    // Regular admins can always load, super admins need a school specified
    const canLoad = !isLoading && (user?.role === 'admin' || user?.role === 'super_admin');

    return useInfiniteQuery({
        queryKey: ['students', search, pageSize, resolvedSchoolId],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            params.append('page', pageParam.toString());
            params.append('page_size', pageSize.toString());
            // Only super admins need to pass school_id explicitly
            if (isSuperAdmin && resolvedSchoolId) params.append('school_id', resolvedSchoolId);
            return api.get<StudentsResponse>(`/admin/students-list?${params.toString()}`);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
            return lastPage.page < totalPages ? lastPage.page + 1 : undefined;
        },
        enabled: options.enabled ?? canLoad,
    });
}

export function useStudentMutations() {
    const queryClient = useQueryClient();

    const updateStudentMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Student> }) => {
            // Map frontend naming to backend snake_case if necessary, 
            // but our Student interface is consistently snake_case now.
            return api.put(`/admin/students/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            toast.success('Student updated successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to update student', { description: error.message });
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.delete(`/admin/students/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            toast.success('Student deleted successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to delete student', { description: error.message });
        }
    });

    return {
        updateStudent: updateStudentMutation.mutateAsync,
        deleteStudent: deleteStudentMutation.mutateAsync,
        isUpdating: updateStudentMutation.isPending,
        isDeleting: deleteStudentMutation.isPending
    };
}
