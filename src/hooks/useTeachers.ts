import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teacherService } from '@/services/teachers';
import type { CreateTeacherDto, UpdateTeacherDto, TeacherStatus } from '@/types/teacher';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/api/client';

export const TEACHERS_KEYS = {
  all: ['teachers'] as const,
  lists: () => [...TEACHERS_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [...TEACHERS_KEYS.lists(), params] as const,
  details: () => [...TEACHERS_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...TEACHERS_KEYS.details(), id] as const,
};

export function useTeachers(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}, enabled = true) {
  return useQuery({
    queryKey: TEACHERS_KEYS.list(params ?? {}),
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
    enabled,
  });
}

export function useTeacher(id: string) {
  return useQuery({
    queryKey: TEACHERS_KEYS.detail(id),
    queryFn: () => teacherService.getTeacherById(id),
    enabled: !!id,
  });
}

export function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeacherDto) => teacherService.createTeacher(data),
    onSuccess: () => {
      toast.success('Teacher created successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to create teacher');
    },
  });
}

export function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherDto }) =>
      teacherService.updateTeacher(id, data),
    onSuccess: (data) => {
      toast.success('Teacher updated successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.detail(data.id) });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to update teacher');
    },
  });
}

export function useToggleTeacherStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TeacherStatus }) =>
      teacherService.toggleStatus(id, status),
    onSuccess: (_data, variables) => {
      toast.success(`Teacher status updated to ${variables.status.toLowerCase()}`);
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to update status');
    },
  });
}

export function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => {
      toast.success('Teacher deleted successfully');
      queryClient.invalidateQueries({ queryKey: TEACHERS_KEYS.all });
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error) || 'Failed to delete teacher');
    },
  });
}
