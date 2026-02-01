import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export interface School {
    id: string;
    name: string;
    slug?: string;
    address?: string;
    contact_email?: string;
    is_active: boolean;
    created_at: string;
    admin_count?: number; // Optional, if backend provides it
}

interface SchoolsResponse {
    schools: School[];
}

export interface AdminParams {
    name: string;
    email: string;
    password: string;
}

export interface CreateSchoolParams {
    name: string;
    address?: string;
    contact_email?: string;
    admins: AdminParams[];
}

export function useSchools() {
    return useQuery({
        queryKey: ['schools'],
        queryFn: async () => {
            const response = await api.get<SchoolsResponse>('/super-admin/schools');
            return response.schools;
        }
    });
}



export function useSchool(idOrSlug: string) {
    return useQuery({
        queryKey: ['school', idOrSlug],
        queryFn: async () => {
            return api.get<School>(`/super-admin/schools/${idOrSlug}`);
        },
        enabled: !!idOrSlug,
    });
}

export interface User {
    id: string;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
    created_at: string;
    department?: string;
    phone?: string;
}

interface UsersResponse {
    users: User[];
    total: number;
    page: number;
    page_size: number;
}

export function useSchoolUsers(schoolId: string, role?: string) {
    return useQuery({
        queryKey: ['school-users', schoolId, role],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (role) params.append('role', role);
            params.append('school_id', schoolId); // Backend expects school_id for Super Admin

            return api.get<UsersResponse>(`/admin/users?${params.toString()}`);
        },
        enabled: !!schoolId,
    });
}

export interface CreateUserParams {
    email: string;
    full_name: string;
    password?: string;
    role: string;
    school_id?: string;
    phone?: string;
}

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserParams) => api.post('/admin/users', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-users'] });
            toast.success('User created successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to create user', { description: error.message });
        }
    });
}

export interface UpdateUserParams {
    id: string;
    email?: string;
    full_name?: string;
    password?: string;
    phone?: string;
    is_active?: boolean;
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, ...data }: UpdateUserParams) => api.put(`/admin/users/${id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-users'] });
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
        mutationFn: (userId: string) => api.delete(`/admin/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['school-users'] });
            toast.success('User deleted successfully');
        },
        onError: (error: any) => {
            if (error.message === 'user_not_found') {
                queryClient.invalidateQueries({ queryKey: ['school-users'] });
                return;
            }
            toast.error('Failed to delete user', { description: error.message });
        }
    });
}

export function useCreateSchool() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateSchoolParams) => api.post('/super-admin/schools', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['schools'] });
            toast.success('School created successfully');
        },
        onError: (error: any) => {
            toast.error('Failed to create school', { description: error.message });
        }
    });
}
