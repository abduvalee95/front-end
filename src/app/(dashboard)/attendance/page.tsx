'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslations } from '@/i18n/index';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { TONE_FILL, TONE_SURFACE, type Tone } from '@/components/ui/tone';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';
import {
  BookOpen,
  ShieldCheck,
  AlertCircle,
  Download,
  Search,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  CalendarRange,
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGroups } from '@/hooks/useGroups';
import { useGroupEnrollments } from '@/hooks/useStudents';
import { useJournalByGroup } from '@/hooks/useJournal';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type { LucideIcon } from 'lucide-react';
import type { JournalEntryResponse } from '@/types/journal';

type Period = 'week' | 'month' | 'all';

interface StudentRow {
  student_id: string;
  name: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  rate: number;
  avgScore: number | null;
}

export default function AttendancePage() {
  const t = useTranslations('attendance_page');
  const tJ = useTranslations('journal');
  const tCommon = useTranslations('common');
  const user = useAuthStore((s) => s.user);
  const { isTeacher, isAdmin } = usePermissions();

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [period, setPeriod] = useState<Period>('week');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PRESENT' | 'LATE' | 'ABSENT'>('ALL');

  const chart = useChartTheme();

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

  const { dateFrom, dateTo } = useMemo(() => {
    const now = endOfDay(new Date());
    if (period === 'week') {
      return {
        dateFrom: format(startOfDay(subDays(now, 6)), 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
    }
    if (period === 'month') {
      return {
        dateFrom: format(startOfDay(subDays(now, 29)), 'yyyy-MM-dd'),
        dateTo: format(now, 'yyyy-MM-dd'),
      };
    }
    return { dateFrom: undefined, dateTo: format(now, 'yyyy-MM-dd') };
  }, [period]);

  const enrollmentResults = useGroupEnrollments(
    selectedGroupId ? [selectedGroupId] : [],
    !!selectedGroupId,
  );
  const enrollmentsData = enrollmentResults[0]?.data;
  const enrollments = useMemo(() => enrollmentsData ?? [], [enrollmentsData]);
  const enrollmentsLoading = enrollmentResults[0]?.isLoading ?? false;

  const { data: journalData, isLoading: journalLoading } = useJournalByGroup(
    selectedGroupId,
    { date_from: dateFrom, date_to: dateTo, limit: 1000 },
    !!selectedGroupId,
  );

  const entries: JournalEntryResponse[] = useMemo(
    () => journalData?.items ?? [],
    [journalData],
  );

  const selectedGroup = visibleGroups.find((g) => g.id === selectedGroupId);
  const isLoading = enrollmentsLoading || journalLoading;

  const totals = useMemo(() => {
    let present = 0, late = 0, absent = 0;
    const scoreVals: number[] = [];
    const dateSet = new Set<string>();
    entries.forEach((e) => {
      if (e.status === 'PRESENT') present++;
      else if (e.status === 'LATE') late++;
      else if (e.status === 'ABSENT') absent++;
      if (e.score != null) scoreVals.push(e.score);
      dateSet.add(e.date);
    });
    const total = present + late + absent;
    const rate = total === 0 ? 0 : Math.round(((present + late) / total) * 100);
    const avg = scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : null;
    return { present, late, absent, total, rate, avg, lessons: dateSet.size };
  }, [entries]);

  const studentRows: StudentRow[] = useMemo(() => {
    const map = new Map<string, StudentRow>();
    enrollments.forEach((e) => {
      map.set(e.student_id, {
        student_id: e.student_id,
        name: e.student?.name ?? e.student_id,
        present: 0, late: 0, absent: 0, total: 0, rate: 0, avgScore: null,
      });
    });
    const scoreBuckets = new Map<string, number[]>();
    entries.forEach((j) => {
      const row = map.get(j.student_id);
      if (!row) return;
      if (j.status === 'PRESENT') row.present++;
      else if (j.status === 'LATE') row.late++;
      else if (j.status === 'ABSENT') row.absent++;
      row.total++;
      if (j.score != null) {
        if (!scoreBuckets.has(j.student_id)) scoreBuckets.set(j.student_id, []);
        scoreBuckets.get(j.student_id)!.push(j.score);
      }
    });
    map.forEach((row, id) => {
      row.rate = row.total === 0 ? 0 : Math.round(((row.present + row.late) / row.total) * 100);
      const scores = scoreBuckets.get(id);
      row.avgScore = scores && scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    });
    return Array.from(map.values()).sort((a, b) => b.rate - a.rate);
  }, [enrollments, entries]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return studentRows.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q)) return false;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PRESENT' && r.present === 0) return false;
        if (statusFilter === 'LATE' && r.late === 0) return false;
        if (statusFilter === 'ABSENT' && r.absent === 0) return false;
      }
      return true;
    });
  }, [studentRows, search, statusFilter]);

  const trendData = useMemo(() => {
    const byDate = new Map<string, { p: number; l: number; a: number }>();
    entries.forEach((e) => {
      const cur = byDate.get(e.date) ?? { p: 0, l: 0, a: 0 };
      if (e.status === 'PRESENT') cur.p++;
      else if (e.status === 'LATE') cur.l++;
      else if (e.status === 'ABSENT') cur.a++;
      byDate.set(e.date, cur);
    });
    return Array.from(byDate.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, v]) => {
        const total = v.p + v.l + v.a;
        return {
          x: format(parseISO(date), 'dd MMM'),
          rate: total === 0 ? 0 : Math.round(((v.p + v.l) / total) * 100),
        };
      });
  }, [entries]);

  const donutData = useMemo(() => {
    return [
      { name: tJ('present'), value: totals.present, color: seriesColor(chart, 1), tone: 'success' as Tone },
      { name: tJ('late'),    value: totals.late,    color: seriesColor(chart, 2), tone: 'warning' as Tone },
      { name: tJ('absent'),  value: totals.absent,  color: seriesColor(chart, 3), tone: 'danger' as Tone },
    ].filter((d) => d.value > 0);
  }, [totals, tJ, chart]);

  const handleExportCsv = () => {
    if (!filteredRows.length) return;
    const header = [
      tCommon('student'),
      tJ('present'),
      tJ('late'),
      tJ('absent'),
      t('total_lessons'),
      t('attendance_rate'),
      t('avg_score'),
    ];
    const rows = filteredRows.map((r) => [
      `"${r.name.replace(/"/g, '""')}"`,
      r.present, r.late, r.absent, r.total,
      `${r.rate}%`,
      r.avgScore == null ? '—' : r.avgScore,
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const groupSlug = (selectedGroup?.name ?? 'group').replace(/\s+/g, '_');
    a.download = `attendance_${groupSlug}_${period}_${format(new Date(), 'yyyyMMdd')}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const periodLabel: Record<Period, string> = {
    week: t('period_week'),
    month: t('period_month'),
    all: t('period_all'),
  };

  /** Attendance rate maps onto the semantic tones, not bespoke colours. */
  const rateTone = (rate: number): Tone => (rate >= 80 ? 'success' : rate >= 50 ? 'warning' : 'danger');
  const scoreTone = (score: number): Tone => (score >= 70 ? 'success' : score >= 50 ? 'warning' : 'danger');

  return (
    <div className="space-y-5 ds-enter">
      <PageHeader
        icon={CalendarRange}
        eyebrow={selectedGroup?.name}
        title={t('title')}
        subtitle={
          dateFrom
            ? `${format(parseISO(dateFrom), 'dd MMM')} — ${format(parseISO(dateTo!), 'dd MMM yyyy')}`
            : t('all_time')
        }
        actions={
          <>
            {isAdmin && (
              <Badge variant="primary" className="gap-1.5">
                <ShieldCheck className="size-3" aria-hidden="true" />
                {tJ('admin_view')}
              </Badge>
            )}
            <div className="flex items-center rounded-control border border-border bg-muted p-0.5">
              {(['week', 'month', 'all'] as Period[]).map((p) => (
                <Button
                  key={p}
                  size="sm"
                  variant={period === p ? 'primary' : 'ghost'}
                  aria-pressed={period === p}
                  onClick={() => setPeriod(p)}
                >
                  {periodLabel[p]}
                </Button>
              ))}
            </div>
            <Button variant="secondary" size="sm" disabled={!filteredRows.length} onClick={handleExportCsv}>
              <Download className="size-4" />
              CSV
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        {/* ── Group picker ─────────────────────────────────────────────── */}
        <aside className="shrink-0 lg:w-64">
          <Card className="lg:sticky lg:top-6">
            <div className="px-4">
              <p className="text-caption text-muted-foreground">
                {isTeacher ? tCommon('your_groups') : tJ('all_groups')}
              </p>
            </div>

            {/* Mobile: a plain select is the right control on a small screen. */}
            <div className="px-4 lg:hidden">
              <select
                value={selectedGroupId}
                onChange={(e) => setSelectedGroupId(e.target.value)}
                aria-label={tJ('group')}
                className="h-9 w-full rounded-control border border-border bg-card px-3 text-body-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                {visibleGroups.length === 0 ? (
                  <option value="">{tCommon('no_data')}</option>
                ) : (
                  visibleGroups.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))
                )}
              </select>
            </div>

            {/* Desktop: a list, so the roster stays visible while reading. */}
            <nav className="hidden max-h-[24rem] flex-col overflow-y-auto px-2 lg:flex">
              {groupsLoading ? (
                <div className="space-y-1.5 px-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 rounded-control" />
                  ))}
                </div>
              ) : visibleGroups.length === 0 ? (
                <p className="px-2 text-body-sm text-muted-foreground">{tCommon('no_data')}</p>
              ) : (
                visibleGroups.map((group) => {
                  const isActive = selectedGroupId === group.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      aria-current={isActive ? 'true' : undefined}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cn(
                        'flex w-full flex-col rounded-control px-3 py-2 text-left transition-colors duration-150',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate text-h4">{group.name}</span>
                      </span>
                      {group.teacher && !isActive && (
                        <span className="ml-5.5 truncate text-caption font-normal text-muted-foreground">
                          {group.teacher.full_name}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </nav>

            {!isLoading && totals.total > 0 && (
              <div className="mt-1 border-t border-border px-4 pt-4">
                <p className="text-caption text-muted-foreground">{periodLabel[period]}</p>
                <dl className="mt-3 space-y-2">
                  {([
                    { label: tJ('present'), value: totals.present, tone: 'success' as Tone },
                    { label: tJ('late'),    value: totals.late,    tone: 'warning' as Tone },
                    { label: tJ('absent'),  value: totals.absent,  tone: 'danger'  as Tone },
                  ]).map((s) => (
                    <div key={s.label} className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-body-sm text-muted-foreground">
                        <span className={cn('size-2 shrink-0 rounded-full', TONE_FILL[s.tone])} aria-hidden />
                        {s.label}
                      </dt>
                      <dd className="text-h3 tabular-nums text-foreground">{s.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </Card>
        </aside>

        {/* ── Report ───────────────────────────────────────────────────── */}
        <div className="min-w-0 flex-1 space-y-4">
          {!selectedGroupId ? (
            <EmptyPanel icon={BookOpen} title={tJ('group')} hint={tJ('select_group_hint')} />
          ) : isLoading ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <StatCard key={i} isLoading label="" value="" />
                ))}
              </div>
              <Skeleton className="h-72 rounded-card" />
            </div>
          ) : enrollments.length === 0 ? (
            <EmptyPanel icon={AlertCircle} title={tJ('no_students')} hint={tJ('enroll_first')} />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <StatCard
                  icon={TrendingUp}
                  tone={rateTone(totals.rate)}
                  label={t('attendance_rate')}
                  value={totals.rate}
                  unit="%"
                  progress={totals.rate}
                />
                <StatCard
                  icon={Users}
                  tone="primary"
                  label={t('total_lessons')}
                  value={totals.lessons}
                  hint={`${enrollments.length} ${tJ('n_students')}`}
                />
                <StatCard
                  icon={CheckCircle2}
                  tone="success"
                  label={tJ('present')}
                  value={totals.present}
                  hint={totals.total ? `${Math.round((totals.present / totals.total) * 100)}%` : '—'}
                />
                <StatCard
                  icon={XCircle}
                  tone="danger"
                  label={tJ('absent')}
                  value={totals.absent}
                  hint={totals.total ? `${Math.round((totals.absent / totals.total) * 100)}%` : '—'}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-h3 text-foreground">{t('attendance_trend')}</h2>
                    <span className="text-caption text-muted-foreground">{periodLabel[period]}</span>
                  </div>
                  <div className="h-[220px] px-2">
                    {trendData.length === 0 ? (
                      <p className="flex h-full items-center justify-center text-body-sm text-muted-foreground">
                        {tCommon('no_data')}
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id="att-grad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={seriesColor(chart, 0)} stopOpacity={0.32} />
                              <stop offset="100%" stopColor={seriesColor(chart, 0)} stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chart.grid} />
                          <XAxis dataKey="x" stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 11 }} tickLine={false} axisLine={false} />
                          <YAxis stroke={chart.axis} tick={{ fill: chart.axis, fontSize: 11 }} width={38} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            contentStyle={chart.tooltip}
                            formatter={(v) => [`${Number(v) || 0}%`, t('attendance_rate')]}
                          />
                          <Area type="monotone" dataKey="rate" stroke={seriesColor(chart, 0)} strokeWidth={2} fill="url(#att-grad)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </Card>

                <Card>
                  <h2 className="px-4 text-h3 text-foreground">{t('distribution')}</h2>
                  <div className="h-[180px]">
                    {donutData.length === 0 ? (
                      <p className="flex h-full items-center justify-center text-body-sm text-muted-foreground">
                        {tCommon('no_data')}
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius={42} outerRadius={70} paddingAngle={3} dataKey="value" stroke="none">
                            {donutData.map((d) => (
                              <Cell key={d.name} fill={d.color} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={chart.tooltip} />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                  <dl className="space-y-2 px-4">
                    {donutData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <dt className="flex items-center gap-2 text-body-sm text-muted-foreground">
                          <span className={cn('size-2 shrink-0 rounded-full', TONE_FILL[d.tone])} aria-hidden />
                          {d.name}
                        </dt>
                        <dd className="text-h4 tabular-nums text-foreground">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              </div>

              {/* ── Per-student table ──────────────────────────────────── */}
              <Card className="gap-0 py-0">
                <div className="flex flex-col justify-between gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
                  <h2 className="text-h3 text-foreground">{t('by_student')}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative sm:w-56">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder={t('search_student')}
                        aria-label={t('search_student')}
                        className="pl-9"
                      />
                    </div>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                      aria-label={t('all_statuses')}
                      className="h-9 rounded-control border border-border bg-card px-3 text-body-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <option value="ALL">{t('all_statuses')}</option>
                      <option value="PRESENT">{tJ('present')}</option>
                      <option value="LATE">{tJ('late')}</option>
                      <option value="ABSENT">{tJ('absent')}</option>
                    </select>
                  </div>
                </div>

                <div
                  className="hidden border-b border-border bg-muted/50 px-4 py-2 text-caption text-muted-foreground sm:grid"
                  style={{ gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr' }}
                >
                  <span>{tCommon('student')}</span>
                  <span className="text-center">{tJ('present')}</span>
                  <span className="text-center">{tJ('late')}</span>
                  <span className="text-center">{tJ('absent')}</span>
                  <span>{t('attendance_rate')}</span>
                  <span className="text-center">{t('avg_score')}</span>
                </div>

                {filteredRows.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-12">
                    <AlertCircle className="size-7 text-muted-foreground" aria-hidden="true" />
                    <p className="text-body-sm text-muted-foreground">{tCommon('no_data')}</p>
                  </div>
                ) : (
                  filteredRows.map((row, idx) => (
                    <div
                      key={row.student_id}
                      className="flex flex-col gap-2 border-b border-border px-4 py-3 last:border-b-0 transition-colors hover:bg-muted/50 sm:grid sm:items-center sm:gap-0"
                      style={{ gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr' }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-control bg-muted text-caption tabular-nums text-muted-foreground">
                          {idx + 1}
                        </span>
                        <span className="truncate text-h4 text-foreground">{row.name}</span>
                      </div>

                      <CountCell value={row.present} hint={tJ('present')} tone="success" />
                      <CountCell value={row.late}    hint={tJ('late')}    tone="warning" />
                      <CountCell value={row.absent}  hint={tJ('absent')}  tone="danger" />

                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-control bg-muted">
                          <div
                            className={cn('h-full rounded-control transition-[width] duration-700', TONE_FILL[rateTone(row.rate)])}
                            style={{ width: `${row.rate}%` }}
                          />
                        </div>
                        <span className="min-w-9 text-h4 tabular-nums text-foreground">{row.rate}%</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 sm:justify-center">
                        <span className="text-caption text-muted-foreground sm:hidden">{t('avg_score')}</span>
                        {row.avgScore == null ? (
                          <span className="text-body-sm text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={scoreTone(row.avgScore)} className="tabular-nums">
                            {row.avgScore}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {filteredRows.length > 0 && (
                  <div className="border-t border-border bg-muted/50 px-4 py-2.5 text-caption font-normal text-muted-foreground">
                    {filteredRows.length} {tJ('n_students')} · {totals.lessons} {t('lessons')}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Shared empty/placeholder panel for the report column. */
function EmptyPanel({
  icon: Icon,
  title,
  hint,
}: {
  icon: LucideIcon;
  title: string;
  hint: string;
}) {
  return (
    <Card className="items-center gap-3 py-16">
      <span className={cn('flex size-14 items-center justify-center rounded-card', TONE_SURFACE.neutral)}>
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div className="text-center">
        <p className="text-h3 text-foreground">{title}</p>
        <p className="mt-1 text-body-sm text-muted-foreground">{hint}</p>
      </div>
    </Card>
  );
}

/** One present/late/absent count, with a tone dot on narrow screens. */
function CountCell({ value, hint, tone }: { value: number; hint: string; tone: Tone }) {
  return (
    <div className="flex items-center justify-between gap-1.5 sm:justify-center">
      <span className="flex items-center gap-1.5 text-caption text-muted-foreground sm:hidden">
        <span className={cn('size-1.5 shrink-0 rounded-full', TONE_FILL[tone])} aria-hidden />
        {hint}
      </span>
      <span className={cn('text-h4 tabular-nums', value > 0 ? 'text-foreground' : 'text-muted-foreground')}>
        {value}
      </span>
    </div>
  );
}
