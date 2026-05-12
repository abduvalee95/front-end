/**
 * Analytics Types — mirror the backend DTOs we actually hit.
 *
 * Shared primitive types are re-exported from their canonical files
 * to keep a single source of truth (DRY).
 */

import { PaymentMethod } from './finance';

// Re-export shared primitives from their canonical files
export type { StudentStatus } from './student';
export type { PaymentMethod } from './finance';
export type { CourseStatus, Course } from './group';

export type LeadStatus = 'NEW' | 'CONTACTED' | 'CONVERTED' | 'LOST';
export type InvoiceStatus = 'OPEN' | 'PAID' | 'OVERDUE' | 'VOID';
export type AttendanceStatus = 'PRESENT' | 'ABSENT';

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

export interface DashboardUpcomingLesson {
  id: string;
  course_id: string;
  course_title: string;
  title: string;
  start_date: string;
  end_date: string;
}

export interface DashboardSummary {
  from: string | null;
  to: string | null;
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
  upcomingLessons: DashboardUpcomingLesson[];
}

export interface LeadStatusCount {
  status: LeadStatus;
  count: number;
}

export interface PaymentsByMethod {
  method: PaymentMethod | null;
  count: number;
  totalAmount: string;
}

export interface PaymentsByDay {
  day: string; // YYYY-MM-DD
  count: number;
  totalAmount: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  paymentCount: number;
  expenseCount: number;
  period: { from: string; to: string };
}

export interface FinanceReport {
  summary: FinanceSummary;
  incomeByMethod: { method: PaymentMethod; total: number; count: number }[];
  expenseByCategory: { category: string; total: number; count: number }[];
}

export interface Lead {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  admin: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedLeads {
  items: Lead[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface CreateLeadDto {
  full_name: string;
  phone: string;
  source: string;
  admin: string;
}

export interface CreateLeadResponse {
  id: string;
  organization_id: string;
  full_name: string;
  phone: string;
  source: string;
  status: LeadStatus;
  admin: string;
  created_at: string;
  updated_at: string;
}

// Course is re-exported from '@/types/group' above

export interface InvoiceItem {
  id: string;
  enrollment_id: string;
  group_id: string;
  group_name: string;
  course_title: string;
  amount: string;
  description: string | null;
}

export interface Invoice {
  id: string;
  organization_id: string;
  student_id: string;
  student_name: string;
  student_phone: string;
  month: string;
  due_date: string;
  status: InvoiceStatus;
  amount_due: string;
  amount_paid: string;
  debt: string;
  created_at: string;
  items: InvoiceItem[];
}

export interface PaginatedInvoices {
  items: Invoice[];
  meta: { total: number; page: number; limit: number; pages: number };
}

// AI insight shapes
export type InsightTone = 'positive' | 'warning' | 'urgent' | 'info' | 'opportunity';

export interface Insight {
  id: string;
  tone: InsightTone;
  title: string;
  body: string;
  metric?: string;
}

export interface PlatformAISummary {
  headline: string;
  body: string;
  insights: Insight[];
  generatedAt: string;
  source: 'rule-based' | 'openai';
}
