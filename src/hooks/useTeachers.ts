import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '@/services/teachers';
import type { CreateTeacherDto, UpdateTeacherDto, TeacherStatus } from '@/types/teacher';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';

export const TEACHERS_KEYS = {
  all: (orgId: string | undefined) => ['teachers', orgId] as const,
  lists: (orgId: string | undefined) => [...TEACHERS_KEYS.all(orgId), 'list'] as const,
  list: (orgId: string | undefined, params: Record<string, unknown>) => [...TEACHERS_KEYS.lists(orgId), params] as const,
  deleted: (orgId: string | undefined) => [...TEACHERS_KEYS.all(orgId), 'deleted'] as const,
  deletedList: (orgId: string | undefined, params: Record<string, unknown>) => [...TEACHERS_KEYS.deleted(orgId), params] as const,
  details: (orgId: string | undefined) => [...TEACHERS_KEYS.all(orgId), 'detail'] as const,
  detail: (orgId: string | undefined, id: string) => [...TEACHERS_KEYS.details(orgId), id] as const,
};

export function useTeachers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: TEACHERS_KEYS.list(orgId, params ?? {}),
    queryFn: async () => {
      const response = await teacherService.getTeachers({
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
        status: params?.status,
      });

      return {
        items: response.teachers,
        meta: response.pagination,
      };
    },
    enabled: enabled && !!orgId,
  });
}

export function useDeletedTeachers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}, enabled = true) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: TEACHERS_KEYS.deletedList(orgId, params ?? {}),
    queryFn: async () => {
      const response = await teacherService.getDeletedTeachers({
        page: params?.page,
        limit: params?.limit,
        search: params?.search,
      });
      return {
        items: response.teachers,
        meta: response.pagination,
      };
    },
    enabled: enabled && !!orgId,
  });
}

export function useTeacher(id: string) {
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useQuery({
    queryKey: TEACHERS_KEYS.detail(orgId, id),
    queryFn: () => teacherService.getTeacherById(id),
    enabled: !!id && !!orgId,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (data: CreateTeacherDto) => teacherService.createTeacher(data),
    onSuccess: () => {
      toast.success('Teacher created successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all(orgId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to create teacher');
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherDto }) =>
      teacherService.updateTeacher(id, data),
    onSuccess: (data) => {
      toast.success('Teacher updated successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.lists(orgId) });
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.detail(orgId, data.id) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to update teacher');
    },
  });
}

export function useToggleTeacherStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeacherStatus }) =>
      teacherService.toggleStatus(id, status),
    onSuccess: (_data, variables) => {
      toast.success(`Teacher status updated to ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all(orgId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to update status');
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  return useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      toast.success('Teacher deleted successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all(orgId) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to delete teacher');
    },
  });
}

export function useTeacherSalary(teacherId: string, month: string) {
  return useQuery({
    queryKey: ['teacher-salary', teacherId, month],
    queryFn: () => teacherService.getSalaryPreview(teacherId, month),
    enabled: !!teacherId,
  });
}

export function useTeacherSalaryHistory(teacherId: string) {
  return useQuery({
    queryKey: ['teacher-salary-history', teacherId],
    queryFn: () => teacherService.getSalaryHistory(teacherId),
    enabled: !!teacherId,
  });
}

export function usePayTeacherSalary() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ teacherId, month }: { teacherId: string; month: string }) =>
      teacherService.paySalary(teacherId, month),
    onSuccess: (_, { teacherId }) => {
      queryClient.invalidateQueries({ queryKey: ['teacher-salary', teacherId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-salary-history', teacherId] });
    },
  });
}
