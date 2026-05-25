export interface LeadFilters {
  status?: string;
  source?: string;
  search?: string;
  from?: string;
  to?: string;
}

export const queryKeys = {
  // Global/Auth
  auth: {
    me: ['auth', 'me'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: (orgId: string | undefined) => ['dashboard', orgId] as const,
    summary: (orgId: string | undefined, query?: Record<string, unknown>) =>
      [...queryKeys.dashboard.all(orgId), 'summary', query] as const,
    leadsByStatus: (orgId: string | undefined, query?: Record<string, unknown>) =>
      [...queryKeys.dashboard.all(orgId), 'leads-by-status', query] as const,
    paymentsByMethod: (orgId: string | undefined, query?: Record<string, unknown>) =>
      [...queryKeys.dashboard.all(orgId), 'payments-by-method', query] as const,
    paymentsByDay: (orgId: string | undefined, query?: Record<string, unknown>) =>
      [...queryKeys.dashboard.all(orgId), 'payments-by-day', query] as const,
  },
  
  // Leads
  leads: {
    all: (orgId: string | undefined) => ['leads', orgId] as const,
    list: (orgId: string | undefined, page: number, limit: number, filters?: LeadFilters) => 
      [...queryKeys.leads.all(orgId), 'list', { page, limit, ...filters }] as const,
    detail: (orgId: string | undefined, id: string) => 
      [...queryKeys.leads.all(orgId), 'detail', id] as const,
  },
  
  // Students
  students: {
    all: (orgId: string | undefined) => ['students', orgId] as const,
    list: (orgId: string | undefined, page: number, limit: number, search?: string, status?: string) => 
      [...queryKeys.students.all(orgId), 'list', { page, limit, search, status }] as const,
    detail: (orgId: string | undefined, id: string) => 
      [...queryKeys.students.all(orgId), 'detail', id] as const,
  },
  
  // Courses
  courses: {
    all: (orgId: string | undefined) => ['courses', orgId] as const,
    list: (orgId: string | undefined) => 
      [...queryKeys.courses.all(orgId), 'list'] as const,
  },
  
  // Groups
  groups: {
    all: (orgId: string | undefined) => ['groups', orgId] as const,
    list: (orgId: string | undefined) => 
      [...queryKeys.groups.all(orgId), 'list'] as const,
  },
  
  // Journal
  journal: {
    all: (orgId: string | undefined) => ['journal', orgId] as const,
    list: (orgId: string | undefined, params: Record<string, unknown>) =>
      [...queryKeys.journal.all(orgId), 'list', params] as const,
    byGroup: (orgId: string | undefined, groupId: string, params: Record<string, unknown>) =>
      [...queryKeys.journal.all(orgId), 'group', groupId, params] as const,
    byTeacher: (orgId: string | undefined, teacherId: string, params: Record<string, unknown>) =>
      [...queryKeys.journal.all(orgId), 'teacher', teacherId, params] as const,
  },

  // Subjects
  subjects: {
    all: (orgId: string | undefined) => ['subjects', orgId] as const,
    list: (orgId: string | undefined) =>
      [...queryKeys.subjects.all(orgId), 'list'] as const,
  },

  // Finance
  finance: {
    all: (orgId: string | undefined) => ['finance', orgId] as const,
    payments: (orgId: string | undefined, filters?: Record<string, unknown>) =>
      [...queryKeys.finance.all(orgId), 'payments', filters] as const,
    expenses: (orgId: string | undefined, filters?: Record<string, unknown>) =>
      [...queryKeys.finance.all(orgId), 'expenses', filters] as const,
    summary: (orgId: string | undefined, from?: string, to?: string) =>
      [...queryKeys.finance.all(orgId), 'summary', { from, to }] as const,
    invoices: (orgId: string | undefined, status?: string) =>
      [...queryKeys.finance.all(orgId), 'invoices', { status }] as const,
  }
};
