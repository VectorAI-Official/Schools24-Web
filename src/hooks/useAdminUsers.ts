import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface AdminUser {
    id: string;
    email: string;
    full_name: string;
    role: 'super_admin' | 'admin' | 'teacher' | 'student' | 'non-teaching';
    phone?: string;
    is_active: boolean;
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

interface CreateUserParams {
    email: string;
    full_name: string;
    role: string;
    phone?: string;
    department?: string;
    password?: string; // Optional (auto-generated if empty)
    is_active?: boolean;
}

interface UpdateUserParams {
    id: string;
    email?: string;
    full_name?: string;
    role?: string;
    phone?: string;
    is_active?: boolean; // sending as pointer from frontend? backend accepts boolean ptr
}

export function useUsers(role: string = 'all', search: string = '', page: number = 1, pageSize: number = 20) {
    return useQuery({
        queryKey: ['users', role, search, page, pageSize],
        queryFn: () => {
            const params = new URLSearchParams();
            if (role && role !== 'all') params.append('role', role);
            if (search) params.append('search', search);
            params.append('page', page.toString());
            params.append('page_size', pageSize.toString());
            return api.get<UsersResponse>(`/admin/users?${params.toString()}`);
        }
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
