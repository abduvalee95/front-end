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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
      {/* Brand row */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-muted-foreground">
            BILIM NURU
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {t('title')}
          </h1>
        </div>
        {isAdmin && (
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="size-3" aria-hidden="true" />
            <span className="text-[10px] uppercase tracking-wider font-bold">{t('admin_view')}</span>
          </Badge>
        )}
      </div>

      {/* ============ BENTO GRID ============ */}
      <div className="grid grid-cols-12 gap-3 sm:gap-4 auto-rows-min">

        {/* (1) Date hero — wide */}
        <Card className="col-span-12 lg:col-span-8 p-5 sm:p-6 rounded-2xl border-border/60 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                aria-label={tCommon('previous')}
                className="size-11 rounded-xl"
                onClick={() => setCurrentDate((d) => subDays(d, 1))}
              >
                <ChevronLeft aria-hidden="true" className="size-5" />
              </Button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" aria-hidden="true" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    {format(currentDate, 'EEEE')}
                  </p>
                </div>
                <p className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-none mt-1">
                  {format(currentDate, 'dd MMMM yyyy')}
                </p>
              </div>

              <Button
                variant="outline"
                size="icon"
                aria-label={tCommon('next')}
                className="size-11 rounded-xl"
                onClick={() => setCurrentDate((d) => addDays(d, 1))}
              >
                <ChevronRight aria-hidden="true" className="size-5" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              {selectedGroup && (
                <div className="text-right">
                  <p className="text-base font-bold leading-tight">{selectedGroup.name}</p>
                  {enrollments.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {enrollments.length} {t('n_students')}
                    </p>
                  )}
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={upsert.isPending || !selectedGroupId || !enrollments.length}
                className="h-11 rounded-xl px-5 gap-2 font-bold tracking-wide uppercase text-xs"
              >
                <Save className="size-4" aria-hidden="true" />
                {upsert.isPending ? tCommon('loading') : t('save_attendance')}
              </Button>
            </div>
          </div>
        </Card>

        {/* (2) Stats trio — narrow */}
        <Card className="col-span-12 lg:col-span-4 p-5 rounded-2xl border-border/60 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
            {t('today')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <StatTile
              icon={<CheckCircle2 className="size-4" aria-hidden="true" />}
              label={t('present')}
              value={stats.present}
              pct={presentPct}
              tone="emerald"
            />
            <StatTile
              icon={<Clock className="size-4" aria-hidden="true" />}
              label={t('late')}
              value={stats.late}
              pct={latePct}
              tone="amber"
            />
            <StatTile
              icon={<XCircle className="size-4" aria-hidden="true" />}
              label={t('absent')}
              value={stats.absent}
              pct={absentPct}
              tone="rose"
            />
          </div>
        </Card>

        {/* (3) Group list — tall left */}
        <Card className="col-span-12 lg:col-span-3 lg:row-span-2 p-4 rounded-2xl border-border/60 shadow-sm">
          <div className="flex items-center gap-2 mb-3 px-1">
            <Users className="size-4 text-muted-foreground" aria-hidden="true" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
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
                    {group.teacher && !active && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-[22px] truncate">
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
                className="hidden sm:grid px-5 sm:px-6 py-3 text-[10px] tracking-[0.18em] uppercase font-bold text-muted-foreground bg-muted/30 border-b border-border/60"
                style={{ gridTemplateColumns: '1fr 220px 120px' }}
              >
                <span>{tCommon('student')}</span>
                <span className="text-center">{t('attendance')}</span>
                <span className="text-center">{t('score')}</span>
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
                          className="shrink-0 inline-flex size-8 items-center justify-center rounded-lg bg-muted text-[11px] font-bold font-mono text-muted-foreground"
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
                          tone="emerald"
                          label={t('present')}
                          onClick={() => updateStatus(studentId, 'PRESENT')}
                        >
                          <Check aria-hidden="true" strokeWidth={3} />
                        </SegBtn>
                        <SegBtn
                          active={entry?.status === 'LATE'}
                          tone="amber"
                          label={t('late')}
                          onClick={() => updateStatus(studentId, 'LATE')}
                        >
                          <Clock aria-hidden="true" strokeWidth={2.5} />
                        </SegBtn>
                        <SegBtn
                          active={entry?.status === 'ABSENT'}
                          tone="rose"
                          label={t('absent')}
                          onClick={() => updateStatus(studentId, 'ABSENT')}
                        >
                          <X aria-hidden="true" strokeWidth={3} />
                        </SegBtn>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between sm:justify-center gap-1.5">
                        <span className="text-[10px] sm:hidden text-muted-foreground font-semibold uppercase">
                          {t('score')}
                        </span>
                        <select
                          value={entry?.score ?? ''}
                          onChange={(e) => updateScore(studentId, e.target.value)}
                          aria-label={`${t('score')} ${name}`}
                          className={cn(
                            'h-10 w-20 rounded-lg border text-center text-sm font-bold cursor-pointer transition-colors',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                            entry?.score
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          <option value="">—</option>
                          {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((val) => (
                            <option key={val} value={String(val)}>{val}</option>
                          ))}
                        </select>
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
              <p className="text-xs text-muted-foreground font-mono">
                {enrollments.length} {t('n_students')} · {format(currentDate, 'dd.MM.yyyy')}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  pct: number;
  tone: 'emerald' | 'amber' | 'rose';
}
function StatTile({ icon, label, value, pct, tone }: StatTileProps) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  } as const;
  const barMap = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
  } as const;
  return (
    <div className={cn('rounded-xl px-3 py-3 flex flex-col gap-1.5', toneMap[tone])}>
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-wider truncate">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-extrabold tabular-nums leading-none">{value}</span>
        <span className="text-[10px] font-semibold opacity-70">{pct}%</span>
      </div>
      <div className="h-1 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div className={cn('h-full transition-all duration-300', barMap[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface SegBtnProps {
  active: boolean;
  tone: 'emerald' | 'amber' | 'rose';
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}
function SegBtn({ active, tone, label, onClick, children }: SegBtnProps) {
  const activeMap = {
    emerald:
      'bg-emerald-500 text-white shadow-[0_6px_20px_-4px_rgba(16,185,129,0.55)] ring-4 ring-emerald-500/15 dark:ring-emerald-400/20',
    amber:
      'bg-amber-500 text-white shadow-[0_6px_20px_-4px_rgba(245,158,11,0.55)] ring-4 ring-amber-500/15 dark:ring-amber-400/20',
    rose:
      'bg-rose-500 text-white shadow-[0_6px_20px_-4px_rgba(244,63,94,0.55)] ring-4 ring-rose-500/15 dark:ring-rose-400/20',
  } as const;
  const idleMap = {
    emerald:
      'border-emerald-200/70 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 dark:border-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/10',
    amber:
      'border-amber-200/70 text-amber-600 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-500/20 dark:text-amber-400 dark:hover:bg-amber-500/10',
    rose:
      'border-rose-200/70 text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10',
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'group/seg relative inline-flex size-11 items-center justify-center rounded-full border-2 cursor-pointer',
        'transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out',
        'motion-safe:active:scale-95',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/40',
        '[&>svg]:size-5 [&>svg]:transition-transform [&>svg]:duration-200',
        active
          ? cn('border-transparent motion-safe:scale-110', activeMap[tone])
          : cn('bg-background motion-safe:hover:scale-105', idleMap[tone]),
      )}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 size-1.5 rounded-full bg-current opacity-90"
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
      <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground border border-border/60">
        {icon}
      </div>
      <div>
        <p className="text-base font-bold">{title}</p>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
    </div>
  );
}
