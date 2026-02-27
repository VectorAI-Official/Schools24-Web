import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'admin' | 'teacher' | 'student' | 'staff';
    phone?: string;
    created_at: string;
    last_login?: string;
    avatar?: string;
    department?: string;
}

interface UsersResponse {
    users: AdminUser[];
    total: number;
    page: number;
    page_size: number;
}

export interface UserStats {
    total: number;
    admins: number;
    teachers: number;
    students: number;
}

interface CreateUserParams {
    email: string;
    full_name: string;
    role: string;
    phone?: string;
    department?: string;
    password?: string; // Optional (auto-generated if empty)
}

interface UpdateUserParams {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    phone?: string;
    department?: string;
    password?: string;
}

export function useUsers(role: string = 'all', search: string = '', pageSize: number = 20) {
    return useInfiniteQuery({
        queryKey: ['users', role, search, pageSize],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams();
            if (role && role !== 'all') params.append('role', role);
            if (search) params.append('search', search);
            params.append('page', pageParam.toString());
            params.append('page_size', pageSize.toString());
            return api.get<UsersResponse>(`/admin/users?${params.toString()}`);
        },
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.page_size);
            const nextPage = allPages.length + 1;
            return nextPage <= totalPages ? nextPage : undefined;
        },
        staleTime: 30_000,
        refetchInterval: 30_000,
    });
}

export function useUserStats() {
    return useQuery({
        queryKey: ['user-stats'],
        queryFn: () => api.get<UserStats>('/admin/stats/users'),
        staleTime: 30_000,
        refetchInterval: 30_000,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserParams) => api.post('/admin/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to create user', { description: error.message });
        }
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: UpdateUserParams) => api.put(`/admin/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User updated successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to update user', { description: error.message });
        }
    });
}

export function useDeleteUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => api.delete(`/admin/users/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            if (error.message === 'user_not_found') {
                // Already deleted, treat as success
                queryClient.invalidateQueries({ queryKey: ['users'] });
                return;
            }
            toast.error('Failed to delete user', { description: error.message });
        }
    });
}
