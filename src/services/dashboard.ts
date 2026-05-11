import { api } from '@/lib/api/client';

export interface DashboardSummary {
  from?: Date;
  to?: Date;
  studentsTotal: number;
  studentsActive: number;
  studentsInactive: number;
  leadsTotal: number;
  leadsNew: number;
  leadsContacted: number;
  leadsConverted: number;
  leadsLost: number;
  coursesTotal: number;
  coursesActive: number;
  coursesInactive: number;
  groupsTotal: number;
  enrollmentsTotal: number;
  paymentsCount: number;
  paymentsTotalAmount: string;
  attendancePresent: number;
  attendanceAbsent: number;
  attendanceRate: number;
  progressTotal: number;
  progressCompleted: number;
  progressCompletionRate: number;
  upcomingLessons: UpcomingLesson[];
}

export interface UpcomingLesson {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  start_date: string;
  end_date: string;
}

export interface StatusCount {
  status: string;
  count: number;
}

export interface PaymentByMethod {
  method: string | null;
  count: number;
  totalAmount: string;
}

export interface PaymentByDay {
  day: string;
  count: number;
  totalAmount: string;
}

export interface DashboardQuery {
  from?: string;
  to?: string;
}

export const dashboardService = {
  async getSummary(query?: DashboardQuery): Promise<DashboardSummary> {
    const response = await api.get<DashboardSummary>('/proxy/dashboard/summary', { params: query });
    return response.data;
  },

  async getLeadsByStatus(query?: DashboardQuery): Promise<StatusCount[]> {
    const response = await api.get<StatusCount[]>('/proxy/dashboard/analytics/leads-by-status', { params: query });
    return response.data;
  },

  async getPaymentsByMethod(query?: DashboardQuery): Promise<PaymentByMethod[]> {
    const response = await api.get<PaymentByMethod[]>('/proxy/dashboard/analytics/payments-by-method', { params: query });
    return response.data;
  },

  async getPaymentsByDay(query?: DashboardQuery): Promise<PaymentByDay[]> {
    const response = await api.get<PaymentByDay[]>('/proxy/dashboard/analytics/payments-by-day', { params: query });
    return response.data;
  },
};
