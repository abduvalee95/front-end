export const queryKeys = {
  // Global/Auth
  auth: {
    me: ['auth', 'me'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: (orgId: string | undefined) => ['dashboard', orgId] as const,
    summary: (orgId: string | undefined, from: string, to: string) => 
      [...queryKeys.dashboard.all(orgId), 'summary', { from, to }] as const,
    charts: (orgId: string | undefined, from: string, to: string) => 
      [...queryKeys.dashboard.all(orgId), 'charts', { from, to }] as const,
  },
  
  // Leads
  leads: {
    all: (orgId: string | undefined) => ['leads', orgId] as const,
    list: (orgId: string | undefined, page: number, limit: number, filters?: Record<string, any>) => 
      [...queryKeys.leads.all(orgId), 'list', { page, limit, ...filters }] as const,
    detail: (orgId: string | undefined, id: string) => 
      [...queryKeys.leads.all(orgId), 'detail', id] as const,
  },
  
  // Students
  students: {
    all: (orgId: string | undefined) => ['students', orgId] as const,
    list: (orgId: string | undefined, page: number, limit: number) => 
      [...queryKeys.students.all(orgId), 'list', { page, limit }] as const,
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
  
  // Finance
  finance: {
    all: (orgId: string | undefined) => ['finance', orgId] as const,
    payments: (orgId: string | undefined, from: string, to: string) => 
      [...queryKeys.finance.all(orgId), 'payments', { from, to }] as const,
    expenses: (orgId: string | undefined, from: string, to: string) => 
      [...queryKeys.finance.all(orgId), 'expenses', { from, to }] as const,
    invoices: (orgId: string | undefined, status?: string) => 
      [...queryKeys.finance.all(orgId), 'invoices', { status }] as const,
  }
};
