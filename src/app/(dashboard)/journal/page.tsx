'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslations } from '@/i18n/index';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  Save,
  CheckCircle2,
  Check,
  Clock,
  XCircle,
  X,
  CalendarDays,
  Users,
  CalendarCheck,
  CheckCheck,
  Minus,
  Plus,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { TONE_FILL, TONE_INK, TONE_SURFACE, type Tone } from '@/components/ui/tone';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGroups } from '@/hooks/useGroups';
import { useGroupEnrollments } from '@/hooks/useStudents';
import { useJournalByGroup, useUpsertJournal } from '@/hooks/useJournal';
import type { JournalStatus } from '@/types/journal';

interface LocalEntry {
  status: JournalStatus;
  score: string;
  notes: string;
}

export default function JournalPage() {
  const t = useTranslations('journal');
  const tCommon = useTranslations('common');
  const user = useAuthStore((state) => state.user);
  const { isTeacher, isAdmin } = usePermissions();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localEntries, setLocalEntries] = useState<Record<string, LocalEntry>>({});

  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const { data: groups, isLoading: groupsLoading } = useGroups();

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    if (isTeacher) return groups.filter((g) => g.teacher_id === user?.id);
    return groups;
  }, [groups, isTeacher, user?.id]);

  const [prevVisibleGroups, setPrevVisibleGroups] = useState(visibleGroups);
  if (prevVisibleGroups !== visibleGroups) {
    setPrevVisibleGroups(visibleGroups);
    if (visibleGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(visibleGroups[0].id);
    }
  }

  const enrollmentResults = useGroupEnrollments(
    selectedGroupId ? [selectedGroupId] : [],
    !!selectedGroupId,
  );
  const enrollmentsData = enrollmentResults[0]?.data;
  const enrollments = useMemo(() => enrollmentsData ?? [], [enrollmentsData]);
  const enrollmentsLoading = enrollmentResults[0]?.isLoading ?? false;

  const { data: journalData, isLoading: journalLoading } = useJournalByGroup(
    selectedGroupId,
    { date: dateStr },
    !!selectedGroupId,
  );

  const [prevJournalData, setPrevJournalData] = useState(journalData);
  const [prevEnrollments, setPrevEnrollments] = useState(enrollments);
  if (prevJournalData !== journalData || prevEnrollments !== enrollments) {
    setPrevJournalData(journalData);
    setPrevEnrollments(enrollments);
    if (journalData && enrollments.length) {
      const map: Record<string, LocalEntry> = {};
      enrollments.forEach((e) => {
        const existing = journalData.items.find((j) => j.student_id === e.student_id);
        map[e.student_id] = {
          status: existing?.status ?? 'PRESENT',
          score: existing?.score != null ? String(existing.score) : '',
          notes: existing?.notes ?? '',
        };
      });
      setLocalEntries(map);
    }
  }

  const upsert = useUpsertJournal();

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  const hasChanges = useMemo(() => {
    if (!enrollments.length) return false;
    return enrollments.some((e) => {
      const local = localEntries[e.student_id];
      if (!local) return false;
      const saved = journalData?.items.find((j) => j.student_id === e.student_id);
      const savedStatus = saved?.status ?? 'PRESENT';
      const savedScore = saved?.score != null ? String(saved.score) : '';
      return local.status !== savedStatus || local.score !== savedScore;
    });
  }, [localEntries, journalData, enrollments]);

  const markAllPresent = () => {
    setLocalEntries((prev) => {
      const next = { ...prev };
      enrollments.forEach((e) => {
        next[e.student_id] = { ...(next[e.student_id] ?? { score: '', notes: '' }), status: 'PRESENT' };
      });
      return next;
    });
  };

  const updateStatus = (studentId: string, status: JournalStatus) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const updateScore = (studentId: string, score: string) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], score },
    }));
  };

  const handleSave = () => {
    if (!selectedGroupId || !enrollments.length) return;
    upsert.mutate({
      group_id: selectedGroupId,
      date: dateStr,
      entries: enrollments.map((e) => {
        const entry = localEntries[e.student_id];
        return {
          student_id: e.student_id,
          status: entry?.status ?? 'PRESENT',
          score: entry?.score ? Number(entry.score) : undefined,
          notes: entry?.notes || undefined,
        };
      }),
    });
  };

  const isLoading = enrollmentsLoading || journalLoading;
  const selectedGroup = visibleGroups.find((g) => g.id === selectedGroupId);

  const stats = useMemo(() => {
    const values = Object.values(localEntries);
    return {
      present: values.filter((v) => v.status === 'PRESENT').length,
      late: values.filter((v) => v.status === 'LATE').length,
      absent: values.filter((v) => v.status === 'ABSENT').length,
    };
  }, [localEntries]);

  const total = enrollments.length;
  const presentPct = total > 0 ? Math.round((stats.present / total) * 100) : 0;
  const latePct = total > 0 ? Math.round((stats.late / total) * 100) : 0;
  const absentPct = total > 0 ? Math.round((stats.absent / total) * 100) : 0;

  return (
    <div className="space-y-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500">
      <PageHeader
        icon={BookOpen}
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          isAdmin ? (
            <Badge variant="primary" className="gap-1.5">
              <ShieldCheck className="size-3" aria-hidden="true" />
              {t('admin_view')}
            </Badge>
          ) : undefined
        }
      />

      {/* ============ BENTO GRID ============ */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 auto-rows-min">

        {/* (1) Date hero — wide */}
        <Card className="col-span-12 p-5 sm:p-6 lg:col-span-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label={tCommon('previous')}
                className="size-11"
                onClick={() => setCurrentDate((d) => subDays(d, 1))}
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="text-caption text-muted-foreground">{format(currentDate, 'EEEE')}</p>
                </div>
                <p className="mt-1 text-h1 text-foreground">{format(currentDate, 'dd MMMM yyyy')}</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                aria-label={tCommon('next')}
                className="size-11"
                onClick={() => setCurrentDate((d) => addDays(d, 1))}
              >
                <ChevronRight aria-hidden="true" className="size-5" />
              </Button>

              {!isToday && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="h-9 rounded-xl gap-1.5 text-xs font-bold"
                  aria-label={t('today_btn')}
                >
                  <CalendarCheck className="size-3.5" aria-hidden="true" />
                  {t('today_btn')}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {selectedGroup && (
                <div className="text-right">
                  <p className="text-base font-bold leading-tight">{selectedGroup.name}</p>
                  {enrollments.length > 0 && (
                    <p className="text-caption text-muted-foreground mt-0.5">
                      {enrollments.length} {t('n_students')}
                    </p>
                  )}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={upsert.isPending || !selectedGroupId || !enrollments.length}
                className="relative h-11 rounded-xl px-5 gap-2 font-bold tracking-wide uppercase text-xs"
              >
                <Save className="size-4" aria-hidden="true" />
                {upsert.isPending ? tCommon('loading') : t('save_attendance')}
                {hasChanges && !upsert.isPending && (
                  <span
                    aria-label={t('unsaved')}
                    className="absolute -top-1 -right-1 size-3 rounded-full bg-warning ring-2 ring-background"
                  />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* (2) Stats trio — narrow */}
        <Card className="col-span-12 lg:col-span-4 p-5 rounded-2xl border-border/60 shadow-sm">
          <p className="text-caption font-bold uppercase tracking-normal text-muted-foreground mb-3">
            {t('today')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              label={t('present')}
              value={stats.present}
              pct={presentPct}
              tone="success"
            />
            <StatTile
              icon={<Clock className="size-4" aria-hidden="true" />}
              label={t('late')}
              value={stats.late}
              pct={latePct}
              tone="warning"
            />
            <StatTile
              icon={<XCircle className="size-4" aria-hidden="true" />}
              label={t('absent')}
              value={stats.absent}
              pct={absentPct}
              tone="danger"
            />
          </div>
        </Card>

        {/* (3) Group list — tall left */}
        <Card className="col-span-12 lg:col-span-3 lg:row-span-2 p-4 rounded-2xl border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-caption font-bold uppercase tracking-normal text-muted-foreground">
              {isTeacher ? tCommon('your_groups') : t('all_groups')}
            </p>
          </div>

          {groupsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-xl" />
              ))}
            </div>
          ) : visibleGroups.length === 0 ? (
            <p className="text-xs text-muted-foreground px-2">{tCommon('no_data')}</p>
          ) : (
            <div className="space-y-1 max-h-[520px] overflow-y-auto pr-1">
              {visibleGroups.map((group) => {
                const active = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setSelectedGroupId(group.id)}
                    aria-pressed={active}
                    className={cn(
                      'w-full text-left rounded-xl px-3 py-2.5 transition-colors cursor-pointer',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'hover:bg-muted/60 text-foreground',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen
                        className={cn('size-3.5 shrink-0', active ? 'opacity-90' : 'opacity-50')}
                        aria-hidden="true"
                      />
                      <span className="truncate text-sm font-semibold">{group.name}</span>
                    </div>
                    {group.teacher && !active && !isTeacher && (
                      <p className="text-caption text-muted-foreground mt-0.5 ml-[22px] truncate">
                        {group.teacher.full_name}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* (4) Roster — main */}
        <Card className="col-span-12 lg:col-span-9 p-0 overflow-hidden rounded-2xl border-border/60 shadow-sm">
          {!selectedGroupId ? (
            <EmptyBlock
              icon={<BookOpen className="size-6" aria-hidden="true" />}
              title={t('group')}
              hint={t('select_group_hint')}
            />
          ) : isLoading ? (
            <div className="p-5 space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyBlock
              icon={<AlertCircle className="size-6" aria-hidden="true" />}
              title={t('no_students')}
              hint={t('enroll_first')}
            />
          ) : (
            <>
              {/* Column header */}
              <div
                className="px-5 sm:px-6 py-3 bg-muted/30 border-b border-border/60 flex items-center justify-between gap-3"
              >
                <div
                  className="hidden sm:grid flex-1 text-caption tracking-normal uppercase font-bold text-muted-foreground"
                  style={{ gridTemplateColumns: '1fr 220px 120px' }}
                >
                  <span>{tCommon('student')}</span>
                  <span className="text-center">{t('attendance')}</span>
                  <span className="text-center">{t('score')}</span>
                </div>
                <span className="sm:hidden text-caption tracking-normal uppercase font-bold text-muted-foreground">{tCommon('student')}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={markAllPresent}
                  className="shrink-0 h-8 rounded-xl gap-1.5 text-caption font-bold text-success-emphasis border-success/30 hover:bg-success-muted dark:text-success-emphasis dark:border-success/30 dark:hover:bg-success-muted cursor-pointer"
                  aria-label={t('mark_all_present')}
                >
                  <CheckCheck className="size-3.5" aria-hidden="true" />
                  {t('mark_all_present')}
                </Button>
              </div>

              <div className="divide-y divide-border/40">
                {enrollments.map((enrollment, idx) => {
                  const studentId = enrollment.student_id;
                  const entry = localEntries[studentId];
                  const name = enrollment.student?.name ?? studentId;
                  return (
                    <div
                      key={studentId}
                      className="flex flex-col gap-3 sm:grid sm:gap-0 px-4 sm:px-6 py-3 sm:items-center transition-colors hover:bg-muted/30"
                      style={{ gridTemplateColumns: '1fr 220px 120px' }}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          aria-hidden="true"
                          className="shrink-0 inline-flex size-8 items-center justify-center rounded-lg bg-muted text-caption font-bold tabular-nums text-muted-foreground"
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-sm font-semibold">{name}</span>
                      </div>

                      {/* Status — circular pill buttons */}
                      <div
                        role="group"
                        aria-label={t('attendance')}
                        className="flex sm:justify-center items-center gap-2.5"
                      >
                        <SegBtn
                          active={entry?.status === 'PRESENT'}
                          tone="success"
                          label={t('present')}
                          onClick={() => updateStatus(studentId, 'PRESENT')}
                        >
                          <Check aria-hidden="true" strokeWidth={3} />
                        </SegBtn>
                        <SegBtn
                          active={entry?.status === 'LATE'}
                          tone="warning"
                          label={t('late')}
                          onClick={() => updateStatus(studentId, 'LATE')}
                        >
                          <Clock aria-hidden="true" strokeWidth={2.5} />
                        </SegBtn>
                        <SegBtn
                          active={entry?.status === 'ABSENT'}
                          tone="danger"
                          label={t('absent')}
                          onClick={() => updateStatus(studentId, 'ABSENT')}
                        >
                          <X aria-hidden="true" strokeWidth={3} />
                        </SegBtn>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between sm:justify-center gap-1.5">
                        <span className="text-caption sm:hidden text-muted-foreground font-semibold uppercase">
                          {t('score')}
                        </span>
                        <ScoreStepper
                          value={entry?.score ?? ''}
                          onChange={(v) => updateScore(studentId, v)}
                          name={`${t('score')} ${name}`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* (5) Footer summary */}
        {selectedGroupId && enrollments.length > 0 && (
          <Card className="col-span-12 p-4 rounded-2xl border-border/60 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs text-muted-foreground tabular-nums">
                {enrollments.length} {t('n_students')} · {format(currentDate, 'dd.MM.yyyy')}
              </p>
              <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground">
                {presentPct}% {t('present')} · {latePct}% {t('late')} · {absentPct}% {t('absent')}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ────────────── helpers ────────────── */

interface ScoreStepperProps {
  value: string;
  onChange: (v: string) => void;
  name: string;
}
function ScoreStepper({ value, onChange, name }: ScoreStepperProps) {
  const tCommon = useTranslations('common');
  const num = value !== '' ? parseInt(value, 10) : null;
  const hasValue = num !== null && !isNaN(num);

  const decrement = () => {
    if (!hasValue) return;
    if (num <= 0) { onChange(''); return; }
    onChange(String(Math.max(0, num - 10)));
  };
  const increment = () => {
    onChange(String(Math.min(100, hasValue ? num + 10 : 10)));
  };

  return (
    <div
      className={cn(
        'flex items-center overflow-hidden rounded-control border transition-colors',
        hasValue ? 'border-primary' : 'border-border',
      )}
    >
      <Button
        type="button"
        variant="ghost"
        onClick={decrement}
        aria-label={tCommon('decrease')}
        disabled={!hasValue}
        className="h-10 w-8 rounded-none px-0"
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </Button>
      <input
        type="number"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === '') { onChange(''); return; }
          const n = parseInt(v, 10);
          if (!isNaN(n)) onChange(String(Math.min(100, Math.max(0, n))));
        }}
        min={0}
        max={100}
        aria-label={name}
        placeholder="—"
        className={cn(
          'h-10 w-12 border-0 bg-transparent text-center text-h4 tabular-nums outline-none',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          hasValue ? 'text-primary' : 'text-muted-foreground',
        )}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={increment}
        aria-label={tCommon('increase')}
        disabled={hasValue && num >= 100}
        className="h-10 w-8 rounded-none px-0"
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </Button>
    </div>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
  tone: Tone;
}
function StatTile({ icon, label, value, pct, tone }: StatTileProps) {
  return (
    <div className={cn('flex flex-col gap-1.5 rounded-card px-3 py-3', TONE_SURFACE[tone])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="truncate text-caption">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-h1 tabular-nums">{value}</span>
        <span className="text-caption opacity-70">{pct}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-control bg-foreground/10">
        <div
          className={cn('h-full transition-[width] duration-300', TONE_FILL[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface SegBtnProps {
  active: boolean;
  tone: Tone;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}

/**
 * Attendance status toggle. Circular by design — it is a one-tap target in a
 * long roster — but the colour comes from a tone, never a bespoke palette.
 */
function SegBtn({ active, tone, label, onClick, children }: SegBtnProps) {
  const activeMap: Record<Tone, string> = {
    success: 'bg-success text-success-foreground',
    warning: 'bg-warning text-warning-foreground',
    danger: 'bg-danger text-danger-foreground',
    primary: 'bg-primary text-primary-foreground',
    neutral: 'bg-muted-foreground text-background',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'relative inline-flex size-11 cursor-pointer items-center justify-center rounded-full border-2',
        'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
        'motion-safe:active:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        '[&>svg]:size-5',
        active
          ? cn('border-transparent shadow-card motion-safe:scale-110', activeMap[tone])
          : cn('border-border bg-card motion-safe:hover:scale-105', TONE_INK[tone], 'hover:bg-muted'),
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-current opacity-90"
        />
      )}
    </button>
  );
}

interface EmptyBlockProps {
  icon: React.ReactNode;
  title: string;
  hint: string;
}
function EmptyBlock({ icon, title, hint }: EmptyBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
      <div className="inline-flex size-14 items-center justify-center rounded-card border border-border bg-muted text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-base font-bold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  );
}
