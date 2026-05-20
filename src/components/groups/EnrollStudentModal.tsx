'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, UserPlus, X, Search, CheckSquare, Square } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from '@/i18n/index';
import { enrollmentService } from '@/services/enrollments';
import { useStudents } from '@/hooks/useStudents';
import { GROUPS_KEYS } from '@/hooks/useGroups';
import { useQuery } from '@tanstack/react-query';
import type { Enrollment } from '@/types/student';

interface EnrollStudentModalProps {
  groupId: string;
  groupName: string;
}

export function EnrollStudentModal({ groupId, groupName }: EnrollStudentModalProps) {
  const t = useTranslations('enrollment');
  const tCommon = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const studentsQuery = useStudents({ page: 1, limit: 500 }, open);

  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'group', groupId],
    queryFn: () => enrollmentService.getByGroup(groupId),
    enabled: open && !!groupId,
  });

  const enrolledStudentIds = new Set(
    (enrollmentsQuery.data ?? []).map((e: Enrollment) => e.student_id)
  );

  const availableStudents = useMemo(() => {
    const all = (studentsQuery.data?.items ?? []).filter((s) => !enrolledStudentIds.has(s.id));
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q)
    );
  }, [studentsQuery.data, enrolledStudentIds, search]);

  const toggleStudent = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === availableStudents.length && availableStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(availableStudents.map((s) => s.id)));
    }
  };

  const handleEnroll = async () => {
    if (selectedIds.size === 0) {
      toast.error(t('select_at_least_one'));
      return;
    }
    try {
      setIsEnrolling(true);
      const results = await Promise.allSettled(
        [...selectedIds].map((studentId) =>
          enrollmentService.create({ student_id: studentId, group_id: groupId })
        )
      );
      const succeeded = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.length - succeeded;
      if (succeeded > 0) toast.success(`${succeeded} ${t('success_enrolled')}`);
      if (failed > 0) toast.error(`${failed} ${t('error_failed')}`);
      setSelectedIds(new Set());
      setSearch('');
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all(user?.organization_id) });
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm(t('remove_confirm'))) return;
    try {
      setIsRemoving(enrollmentId);
      await enrollmentService.remove(enrollmentId);
      toast.success(t('success_removed'));
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all(user?.organization_id) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('error_remove'));
    } finally {
      setIsRemoving(null);
    }
  };

  const enrollments = enrollmentsQuery.data ?? [];
  const allSelected = availableStudents.length > 0 && selectedIds.size === availableStudents.length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSelectedIds(new Set()); setSearch(''); } }}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" title={t('manage_enrollment')}>
            <UserPlus className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <UserPlus className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('enroll_button')} — {groupName}</DialogTitle>
              <DialogDescription>
                {t('available_students')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Add students section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">
              {t('available_students')}
              {availableStudents.length > 0 && (
                <span className="ml-1.5 text-muted-foreground">({availableStudents.length})</span>
              )}
            </Label>
            {availableStudents.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {allSelected ? <CheckSquare className="size-3.5 text-emerald-600" /> : <Square className="size-3.5" />}
                {allSelected ? t('deselect_all') : t('select_all')}
              </button>
            )}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t('search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl"
            />
          </div>

          {/* Student list */}
          {studentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">
                {search ? t('no_match') : t('all_enrolled')}
              </p>
            </div>
          ) : (
            <div className="max-h-[180px] space-y-1 overflow-y-auto pr-1">
              {availableStudents.map((s) => {
                const checked = selectedIds.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleStudent(s.id)}
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                      checked
                        ? 'border-emerald-500/40 bg-emerald-500/8 text-foreground'
                        : 'border-border/50 bg-transparent hover:bg-muted/30'
                    }`}
                  >
                    {checked
                      ? <CheckSquare className="size-4 shrink-0 text-emerald-600" />
                      : <Square className="size-4 shrink-0 text-muted-foreground/50" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.phone}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Enroll button */}
          {selectedIds.size > 0 && (
            <Button
              onClick={handleEnroll}
              disabled={isEnrolling}
              className="w-full rounded-xl h-9 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isEnrolling ? (
                <><Loader2 className="mr-2 size-4 animate-spin" />{t('enrolling')}</>
              ) : (
                <>
                  <UserPlus className="mr-2 size-4" />
                  {t('enroll_button')} {selectedIds.size} {selectedIds.size > 1 ? 'Students' : 'Student'}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Current enrollments */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">
            {t('enrolled_students')}
            <span className="ml-1.5 text-muted-foreground">({enrollments.length})</span>
          </Label>
          {enrollmentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-5 text-center">
              <p className="text-sm text-muted-foreground">{t('no_enrolled')}</p>
            </div>
          ) : (
            <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
              {enrollments.map((enrollment: Enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {enrollment.student?.name ?? 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {enrollment.student?.phone ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0.5">
                      {enrollment.student?.status ?? 'N/A'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                      disabled={isRemoving === enrollment.id}
                      onClick={() => handleRemove(enrollment.id)}
                      title={t('remove_from_group')}
                    >
                      {isRemoving === enrollment.id ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto rounded-xl">
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
