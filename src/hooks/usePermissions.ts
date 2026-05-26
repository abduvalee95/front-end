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
      canReadStudents: isAdmin || isTeacher,
      canManageStudents: isAdmin,
      canReadGroups: isAdmin || isTeacher,
      canManageGroups: isAdmin,
      canViewLeads: isAdmin,
      canViewFinance: isAdmin,
      canViewReports: isAdmin,
      canViewTeachers: isAdmin,
      canViewAnalytics: isAdmin,
      canViewSubjects: isAdmin,
      canManageUsers: isSuperAdmin || isAdmin,
      canManageSettings: isAdmin,
      canViewOwnProfile: isTeacher,
    };
  }, [role]);
}
