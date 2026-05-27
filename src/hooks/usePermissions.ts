'use client';

import { useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import type { Role } from '@/lib/rbac';

export interface Permissions {
  role: Role | undefined;
  isSuperAdmin: boolean;
  isAdmin: boolean;       // ADMIN or MANAGER
  isTeacher: boolean;
  teacherScoped: boolean; // alias for isTeacher, used in scoped queries
  canReadStudents: boolean;
  canManageStudents: boolean;
  canReadGroups: boolean;
  canManageGroups: boolean;
  canViewLeads: boolean;
  canViewFinance: boolean;
  canViewReports: boolean;
  canViewTeachers: boolean;
  canViewAnalytics: boolean;
  canViewSubjects: boolean;
  canManageUsers: boolean;
  canManageSettings: boolean;  // full settings (ADMIN/MANAGER)
  canViewOwnProfile: boolean;  // teachers get profile-only settings
}

export function usePermissions(): Permissions {
  const role = useAuthStore((s) => s.user?.role) as Role | undefined;

  return useMemo(() => {
    const isSuperAdmin = role === 'SUPER_ADMIN';
    const isAdmin = role === 'ADMIN' || role === 'MANAGER';
    const isTeacher = role === 'TEACHER';

    return {
      role,
      isSuperAdmin,
      isAdmin,
      isTeacher,
      teacherScoped: isTeacher,
      canReadStudents: isSuperAdmin || isAdmin || isTeacher,
      canManageStudents: isSuperAdmin || isAdmin,
      canReadGroups: isSuperAdmin || isAdmin || isTeacher,
      canManageGroups: isSuperAdmin || isAdmin,
      canViewLeads: isSuperAdmin || isAdmin,
      canViewFinance: isSuperAdmin || isAdmin,
      canViewReports: isSuperAdmin || isAdmin,
      canViewTeachers: isSuperAdmin || isAdmin,
      canViewAnalytics: isSuperAdmin || isAdmin,
      canViewSubjects: isSuperAdmin || isAdmin,
      canManageUsers: isSuperAdmin || isAdmin,
      canManageSettings: isSuperAdmin || isAdmin,
      canViewOwnProfile: isTeacher,
    };
  }, [role]);
}
