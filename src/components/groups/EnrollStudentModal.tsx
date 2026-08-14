'use client';

import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, UserPlus, X, Search, CheckSquare, Square, Pencil, Check } from 'lucide-react';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFee, setEditFee] = useState<string>('');
  const [editDiscount, setEditDiscount] = useState<string>('');
  const [isSavingFee, setIsSavingFee] = useState(false);
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

  const startEdit = (enrollment: Enrollment) => {
    setEditingId(enrollment.id);
    setEditFee(enrollment.monthly_fee ?? '');
    setEditDiscount(enrollment.discount_amount ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditFee('');
    setEditDiscount('');
  };

  const saveEdit = async (enrollmentId: string) => {
    const fee = Number(editFee);
    const discount = Number(editDiscount);
    if (Number.isNaN(fee) || fee < 0 || Number.isNaN(discount) || discount < 0) {
      toast.error(t('invalid_fee_or_discount'));
      return;
    }
    try {
      setIsSavingFee(true);
      await enrollmentService.update(enrollmentId, { monthly_fee: fee, discount_amount: discount });
      toast.success(t('fee_updated'));
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all(user?.organization_id) });
      cancelEdit();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t('fee_update_failed'));
    } finally {
      setIsSavingFee(false);
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
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success-emphasis">
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
            <Label className="text-caption">
              {t('available_students')}
              {availableStudents.length > 0 && (
                <span className="ml-1.5 text-muted-foreground">({availableStudents.length})</span>
              )}
            </Label>
            {availableStudents.length > 0 && (
              <Button type="button" variant="ghost" size="sm" onClick={toggleAll}>
                {allSelected ? <CheckSquare className="size-3.5 text-success-emphasis" /> : <Square className="size-3.5" />}
                {allSelected ? t('deselect_all') : t('select_all')}
              </Button>
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
              <p className="text-body text-muted-foreground">
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
                    className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${ checked ? 'border-success/40 bg-success/8 text-foreground' : 'border-border/50 bg-transparent hover:bg-muted/30' }`}
                  >
                    {checked
                      ? <CheckSquare className="size-4 shrink-0 text-success-emphasis" />
                      : <Square className="size-4 shrink-0 text-muted-foreground/50" />
                    }
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-h4">{s.name}</p>
                      <p className="truncate text-caption text-muted-foreground">{s.phone}</p>
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
              className="w-full rounded-xl h-9 bg-success hover:bg-success/90 text-success-foreground"
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
          <Label className="text-caption">
            {t('enrolled_students')}
            <span className="ml-1.5 text-muted-foreground">({enrollments.length})</span>
          </Label>
          {enrollmentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 px-4 py-5 text-center">
              <p className="text-body text-muted-foreground">{t('no_enrolled')}</p>
            </div>
          ) : (
            <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1">
              {enrollments.map((enrollment: Enrollment) => {
                const isEditing = editingId === enrollment.id;
                const fee = Number(enrollment.monthly_fee ?? 0);
                const discount = Number(enrollment.discount_amount ?? 0);
                const net = Math.max(0, fee - discount);
                return (
                  <div
                    key={enrollment.id}
                    className="rounded-xl border border-border/50 bg-muted/20 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-h4 text-foreground">
                          {enrollment.student?.name ?? 'Unknown'}
                        </p>
                        <p className="truncate text-caption text-muted-foreground">
                          {enrollment.student?.phone ?? '—'}
                        </p>
                        {(fee > 0 || discount > 0) && !isEditing && (
                          <p className="mt-1 text-caption font-semibold tabular-nums text-muted-foreground/80">
                            {fee > 0 ? `${new Intl.NumberFormat('ru-RU').format(net)} сом` : '—'}
                            {discount > 0 && (
                              <span className="ml-1 text-warning-emphasis">
                                ({t('discount_short')} {new Intl.NumberFormat('ru-RU').format(discount)})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-full text-caption px-2 py-0.5">
                          {enrollment.student?.status ?? 'N/A'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                          onClick={() => (isEditing ? cancelEdit() : startEdit(enrollment))}
                          title={t('edit_fee_discount')}
                        >
                          {isEditing ? <X className="size-3.5" /> : <Pencil className="size-3.5" />}
                        </Button>
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
                    {isEditing && (
                      <div className="border-t border-border/40 px-3 py-2.5 bg-background/50">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex-1 min-w-[110px]">
                            <Label className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
                              {t('monthly_fee')}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={100}
                              value={editFee}
                              onChange={(e) => setEditFee(e.target.value)}
                              className="mt-1 h-8 text-body rounded-lg"
                              placeholder="3000"
                            />
                          </div>
                          <div className="flex-1 min-w-[110px]">
                            <Label className="text-caption font-bold uppercase tracking-wider text-warning-emphasis">
                              {t('discount')}
                            </Label>
                            <Input
                              type="number"
                              min={0}
                              step={100}
                              value={editDiscount}
                              onChange={(e) => setEditDiscount(e.target.value)}
                              className="mt-1 h-8 text-body rounded-lg"
                              placeholder="0"
                            />
                          </div>
                          <Button
                            size="sm"
                            className="h-8 rounded-lg bg-success hover:bg-success/90 text-success-foreground"
                            disabled={isSavingFee}
                            onClick={() => saveEdit(enrollment.id)}
                          >
                            {isSavingFee ? <Loader2 className="size-3.5 animate-spin" /> : <><Check className="mr-1 size-3.5" />{tCommon('save')}</>}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
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
