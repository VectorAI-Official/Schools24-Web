import { api } from '@/lib/api';
import { Event, InventoryItem } from '@/types';

export interface AdminDashboardData {
    total_users: number;
    total_students: number;
    total_teachers: number;
    total_classes: number;
    fee_collection?: {
        total_due: number;
        total_collected: number;
        total_pending: number;
        total_overdue: number;
        collection_rate_percent: number;
    };
    attendance_stats?: {
        today_present: number;
        today_absent: number;
        today_late: number;
        week_average_percent: number;
        month_average_percent: number;
    };
    recent_activity: any[];
    upcoming_events: Event[];
    inventory_alerts: InventoryItem[];
}

export const adminService = {
    getDashboardStats: async () => {
        return api.get<AdminDashboardData>('/admin/dashboard');
    },

    getUsers: async (page = 1, pageSize = 20, role = '', search = '') => {
        return api.get<any>(`/admin/users?page=${page}&page_size=${pageSize}&role=${role}&search=${search}`);
    }
};
