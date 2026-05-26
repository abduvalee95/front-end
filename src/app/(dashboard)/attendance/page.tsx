'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslations } from '@/i18n/index';
import { Skeleton } from '@/components/ui/skeleton';
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
      { name: tJ('present'), value: totals.present, color: '#15803D' },
      { name: tJ('late'),    value: totals.late,    color: '#D97706' },
      { name: tJ('absent'),  value: totals.absent,  color: '#DC2626' },
    ].filter((d) => d.value > 0);
  }, [totals, tJ]);

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');

        :root {
          --p-bg: #FAFAF8;
          --p-sidebar: #1C1C1C;
          --p-ink: #1A1A1A;
          --p-ink-soft: #6B6B6B;
          --p-ink-faint: #AAAAAA;
          --p-accent: #D97706;
          --p-card: #F4F4F2;
          --p-line: rgba(26,26,26,0.07);
          --p-line-strong: rgba(26,26,26,0.11);
          --p-row-hover: rgba(26,26,26,0.025);
          --p-sidebar-fg: #F0EDEA;
          --p-sidebar-fg-dim: rgba(240,237,234,0.38);
          --p-sidebar-fg-mid: rgba(240,237,234,0.65);
          --p-sidebar-border: rgba(255,255,255,0.07);
          --p-sidebar-hover: rgba(255,255,255,0.04);
          --p-sidebar-active-bg: rgba(217,119,6,0.12);
          --p-sidebar-active-border: #D97706;
          --p-sidebar-skel: rgba(255,255,255,0.05);
          --p-chip: rgba(26,26,26,0.06);
          --p-chip-ink: #737373;
          --p-shell-border: rgba(26,26,26,0.09);
          --p-button: #1A1A1A;
          --p-button-fg: #FAFAF8;
          --p-skel: rgba(26,26,26,0.07);
          --p-bar-bg: rgba(26,26,26,0.07);
        }
        .dark {
          --p-bg: #111111;
          --p-sidebar: #090909;
          --p-ink: #EFEFEC;
          --p-ink-soft: #909090;
          --p-ink-faint: #555555;
          --p-accent: #F59E0B;
          --p-card: #1A1A1A;
          --p-line: rgba(239,239,236,0.07);
          --p-line-strong: rgba(239,239,236,0.11);
          --p-row-hover: rgba(239,239,236,0.025);
          --p-sidebar-fg: #F0EDEA;
          --p-sidebar-fg-dim: rgba(240,237,234,0.33);
          --p-sidebar-fg-mid: rgba(240,237,234,0.62);
          --p-sidebar-border: rgba(255,255,255,0.05);
          --p-sidebar-hover: rgba(255,255,255,0.04);
          --p-sidebar-active-bg: rgba(245,158,11,0.10);
          --p-sidebar-active-border: #F59E0B;
          --p-sidebar-skel: rgba(255,255,255,0.04);
          --p-chip: rgba(239,239,236,0.07);
          --p-chip-ink: #909090;
          --p-shell-border: rgba(239,239,236,0.08);
          --p-button: #EFEFEC;
          --p-button-fg: #111111;
          --p-skel: rgba(239,239,236,0.07);
          --p-bar-bg: rgba(239,239,236,0.07);
        }

        .syne { font-family: 'Syne', system-ui, sans-serif; }
        .jm   { font-family: 'JetBrains Mono', 'Courier New', monospace; }

        .p-group {
          padding: 9px 16px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.12s ease;
          font-size: 13px;
          font-weight: 600;
          color: var(--p-sidebar-fg-mid);
          font-family: 'Syne', system-ui, sans-serif;
        }
        .p-group:hover {
          color: var(--p-sidebar-fg);
          background: var(--p-sidebar-hover);
        }
        .p-group.active {
          color: var(--p-accent);
          border-left-color: var(--p-accent);
          background: var(--p-sidebar-active-bg);
        }

        .p-period-btn {
          padding: 7px 14px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          border: 1px solid var(--p-line-strong);
          background: transparent;
          color: var(--p-ink-soft);
          cursor: pointer;
          transition: all 0.12s ease;
          font-family: 'Syne', system-ui, sans-serif;
        }
        .p-period-btn:first-child { border-radius: 9px 0 0 9px; }
        .p-period-btn:last-child  { border-radius: 0 9px 9px 0; }
        .p-period-btn:not(:first-child) { border-left: none; }
        .p-period-btn:hover {
          background: var(--p-row-hover);
          color: var(--p-ink);
        }
        .p-period-btn.active {
          background: var(--p-button);
          color: var(--p-button-fg);
          border-color: var(--p-button);
        }

        .p-att-row {
          border-bottom: 1px solid var(--p-line);
          transition: background 0.12s ease;
        }
        .p-att-row:hover { background: var(--p-row-hover); }
        .p-att-row:last-child { border-bottom: none; }

        .p-bar {
          height: 5px;
          background: var(--p-bar-bg);
          border-radius: 3px;
          overflow: hidden;
        }
        .p-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s cubic-bezier(0.22,1,0.36,1);
        }

        @keyframes p-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .p-enter { animation: p-in 0.45s cubic-bezier(0.22,1,0.36,1) forwards; }
        .p-delay  { opacity: 0; animation: p-in 0.35s cubic-bezier(0.22,1,0.36,1) forwards; }
      `}</style>

      <div
        className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-2xl p-enter"
        style={{
          minHeight: '78vh',
          border: '1px solid var(--p-shell-border)',
          background: 'var(--p-bg)',
        }}
      >
        {/* ── MOBILE GROUP SELECTOR ──────────────────── */}
        <div
          className="lg:hidden flex flex-col gap-3 px-4 py-4"
          style={{ background: 'var(--p-sidebar)', borderBottom: '1px solid var(--p-sidebar-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="jm text-[9px] tracking-[0.22em] uppercase" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
                {t('name')}
              </p>
              <h2 className="syne font-extrabold mt-0.5" style={{ fontSize: 18, color: 'var(--p-sidebar-fg)', letterSpacing: '-0.01em' }}>
                {t('title')}
              </h2>
            </div>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 jm text-[9px] tracking-wider uppercase"
                style={{ color: 'var(--p-accent)', background: 'var(--p-sidebar-active-bg)', padding: '2px 8px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {tJ('admin_view')}
              </span>
            )}
          </div>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={groupsLoading || visibleGroups.length === 0}
            className="w-full jm text-[12px] rounded-lg px-3 py-2.5 outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--p-sidebar-fg)',
              border: '1px solid var(--p-sidebar-border)',
            }}
          >
            {visibleGroups.length === 0 ? (
              <option value="">{tCommon('no_data')}</option>
            ) : (
              visibleGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: 'var(--p-sidebar)' }}>{g.name}</option>
              ))
            )}
          </select>
        </div>

        {/* ── SIDEBAR (lg+) ──────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0"
          style={{ background: 'var(--p-sidebar)', borderRight: '1px solid var(--p-sidebar-border)' }}
        >
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--p-sidebar-border)' }}>
            <p className="jm text-[9px] tracking-[0.22em] uppercase" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
              BILIM NURU
            </p>
            <h2
              className="syne mt-1.5 leading-none"
              style={{ fontSize: 21, fontWeight: 800, color: 'var(--p-sidebar-fg)', letterSpacing: '-0.02em' }}
            >
              {t('title')}
            </h2>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 mt-2.5 jm text-[9px] tracking-wider uppercase"
                style={{ color: 'var(--p-accent)', background: 'var(--p-sidebar-active-bg)', padding: '2px 8px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {tJ('admin_view')}
              </span>
            )}
          </div>

          <div className="flex-1 py-3 overflow-y-auto">
            <p className="jm text-[9px] tracking-[0.18em] uppercase px-5 mb-2" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
              {isTeacher ? tCommon('your_groups') : tJ('all_groups')}
            </p>
            {groupsLoading ? (
              <div className="px-4 space-y-1.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg" style={{ background: 'var(--p-sidebar-skel)' }} />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <p className="jm text-[11px] px-5" style={{ color: 'var(--p-sidebar-fg-dim)' }}>{tCommon('no_data')}</p>
            ) : (
              visibleGroups.map((group) => (
                <div
                  key={group.id}
                  className={cn('p-group', selectedGroupId === group.id && 'active')}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen style={{ width: 11, height: 11, opacity: 0.45, flexShrink: 0 }} />
                    <span className="truncate">{group.name}</span>
                  </div>
                  {group.teacher && selectedGroupId !== group.id && (
                    <p className="jm text-[10px] mt-0.5 ml-[22px] truncate" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
                      {group.teacher.full_name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {!isLoading && totals.total > 0 && (
            <div className="px-5 py-5" style={{ borderTop: '1px solid var(--p-sidebar-border)' }}>
              <p className="jm text-[9px] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
                {periodLabel[period]}
              </p>
              <div className="space-y-4">
                {[
                  { label: tJ('present'), value: totals.present, dot: '#4ADE80' },
                  { label: tJ('late'),    value: totals.late,    dot: '#FBBF24' },
                  { label: tJ('absent'),  value: totals.absent,  dot: '#F87171' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                      <span className="syne font-medium" style={{ fontSize: 12, color: 'var(--p-sidebar-fg-mid)' }}>{s.label}</span>
                    </div>
                    <span className="jm font-bold" style={{ fontSize: 22, color: 'var(--p-accent)', lineHeight: 1 }}>
                      {String(s.value).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN PANEL ─────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 shrink-0"
            style={{ borderBottom: '1px solid var(--p-line)', background: 'var(--p-bg)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-xl shrink-0"
                style={{
                  width: 40, height: 40,
                  border: '1px solid var(--p-line-strong)',
                  background: 'var(--p-card)',
                  color: 'var(--p-ink-soft)',
                }}
              >
                <CalendarRange style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p
                  className="syne leading-none"
                  style={{ fontSize: 'clamp(18px,3vw,26px)', fontWeight: 800, color: 'var(--p-ink)', letterSpacing: '-0.02em' }}
                >
                  {selectedGroup?.name ?? t('title')}
                </p>
                <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-soft)' }}>
                  {dateFrom
                    ? `${format(parseISO(dateFrom), 'dd MMM')} → ${format(parseISO(dateTo!), 'dd MMM yyyy')}`
                    : t('all_time')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex">
                {(['week', 'month', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn('p-period-btn', period === p && 'active')}
                  >
                    {periodLabel[p]}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExportCsv}
                disabled={!filteredRows.length}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 9,
                  border: '1px solid var(--p-line-strong)',
                  background: 'var(--p-card)',
                  color: 'var(--p-ink-soft)',
                  fontSize: 10,
                  fontWeight: 700,
                  fontFamily: "'Syne', system-ui, sans-serif",
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  cursor: filteredRows.length ? 'pointer' : 'not-allowed',
                  opacity: filteredRows.length ? 1 : 0.45,
                  transition: 'all 0.12s ease',
                } as React.CSSProperties}
              >
                <Download style={{ width: 12, height: 12 }} />
                CSV
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
            {!selectedGroupId ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--p-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--p-line)',
                }}>
                  <BookOpen style={{ width: 22, height: 22, color: 'var(--p-ink-faint)' }} />
                </div>
                <div className="text-center">
                  <p className="syne font-bold" style={{ fontSize: 16, color: 'var(--p-ink-soft)' }}>{tJ('group')}</p>
                  <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-faint)' }}>{tJ('select_group_hint')}</p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: 'var(--p-skel)' }} />
                  ))}
                </div>
                <Skeleton className="h-72 rounded-2xl" style={{ background: 'var(--p-skel)' }} />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3">
                <div style={{
                  width: 56, height: 56, borderRadius: 16,
                  background: 'var(--p-card)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: '1px solid var(--p-line)',
                }}>
                  <AlertCircle style={{ width: 22, height: 22, color: 'var(--p-ink-faint)' }} />
                </div>
                <div className="text-center">
                  <p className="syne font-bold" style={{ fontSize: 16, color: 'var(--p-ink-soft)' }}>{tJ('no_students')}</p>
                  <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-faint)' }}>{tJ('enroll_first')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">

                {/* ── STAT CARDS ─────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <AttStatCard
                    icon={<TrendingUp style={{ width: 15, height: 15 }} />}
                    label={t('attendance_rate')}
                    value={`${totals.rate}%`}
                    accentColor="var(--p-accent)"
                  />
                  <AttStatCard
                    icon={<Users style={{ width: 15, height: 15 }} />}
                    label={t('total_lessons')}
                    value={String(totals.lessons)}
                    sub={`${enrollments.length} ${tJ('n_students')}`}
                  />
                  <AttStatCard
                    icon={<CheckCircle2 style={{ width: 15, height: 15, color: '#15803D' }} />}
                    label={tJ('present')}
                    value={String(totals.present)}
                    sub={totals.total ? `${Math.round((totals.present / totals.total) * 100)}%` : '—'}
                    accentColor="#15803D"
                  />
                  <AttStatCard
                    icon={<XCircle style={{ width: 15, height: 15, color: '#DC2626' }} />}
                    label={tJ('absent')}
                    value={String(totals.absent)}
                    sub={totals.total ? `${Math.round((totals.absent / totals.total) * 100)}%` : '—'}
                    accentColor="#DC2626"
                  />
                </div>

                {/* ── CHARTS ─────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  {/* Area chart */}
                  <div
                    className="lg:col-span-2 rounded-2xl p-4"
                    style={{ background: 'var(--p-card)', border: '1px solid var(--p-line-strong)' }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <p className="syne font-bold" style={{ fontSize: 14, color: 'var(--p-ink)' }}>
                        {t('attendance_trend')}
                      </p>
                      <span className="jm text-[10px]" style={{ color: 'var(--p-ink-faint)' }}>
                        {periodLabel[period]}
                      </span>
                    </div>
                    <div style={{ height: 220 }}>
                      {trendData.length === 0 ? (
                        <div className="h-full flex items-center justify-center jm text-[11px]" style={{ color: 'var(--p-ink-faint)' }}>
                          {tCommon('no_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="att-grad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#D97706" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#D97706" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--p-line-strong)" opacity={0.6} />
                            <XAxis dataKey="x" stroke="var(--p-ink-faint)" fontSize={10} fontFamily="'JetBrains Mono', monospace" />
                            <YAxis stroke="var(--p-ink-faint)" fontSize={10} width={34} tickFormatter={(v) => `${v}%`} fontFamily="'JetBrains Mono', monospace" />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--p-bg)',
                                border: '1px solid var(--p-line-strong)',
                                borderRadius: 10,
                                fontSize: 12,
                                color: 'var(--p-ink)',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                              formatter={(v) => [`${Number(v) || 0}%`, t('attendance_rate')]}
                            />
                            <Area
                              type="monotone"
                              dataKey="rate"
                              stroke="#D97706"
                              strokeWidth={2}
                              fill="url(#att-grad)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  {/* Donut chart */}
                  <div
                    className="rounded-2xl p-4"
                    style={{ background: 'var(--p-card)', border: '1px solid var(--p-line-strong)' }}
                  >
                    <p className="syne font-bold mb-4" style={{ fontSize: 14, color: 'var(--p-ink)' }}>
                      {t('distribution')}
                    </p>
                    <div style={{ height: 180 }}>
                      {donutData.length === 0 ? (
                        <div className="h-full flex items-center justify-center jm text-[11px]" style={{ color: 'var(--p-ink-faint)' }}>
                          {tCommon('no_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%" cy="50%"
                              innerRadius={42} outerRadius={70}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {donutData.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--p-bg)',
                                border: '1px solid var(--p-line-strong)',
                                borderRadius: 10,
                                fontSize: 12,
                                color: 'var(--p-ink)',
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="space-y-2 mt-3">
                      {donutData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-sm shrink-0" style={{ background: d.color }} />
                            <span className="syne font-medium text-[12px]" style={{ color: 'var(--p-ink-soft)' }}>{d.name}</span>
                          </div>
                          <span className="jm font-bold text-[12px]" style={{ color: 'var(--p-ink)' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── STUDENT TABLE ───────────────────── */}
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{ background: 'var(--p-card)', border: '1px solid var(--p-line-strong)' }}
                >
                  {/* Table header controls */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4"
                    style={{ borderBottom: '1px solid var(--p-line-strong)' }}
                  >
                    <p className="syne font-bold" style={{ fontSize: 14, color: 'var(--p-ink)' }}>
                      {t('by_student')}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl"
                        style={{
                          background: 'var(--p-bg)',
                          border: '1px solid var(--p-line-strong)',
                          minWidth: 180,
                        }}
                      >
                        <Search style={{ width: 12, height: 12, color: 'var(--p-ink-soft)', flexShrink: 0 }} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t('search_student')}
                          className="jm bg-transparent outline-none w-full text-[12px]"
                          style={{ color: 'var(--p-ink)' }}
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="jm text-[11px] px-2.5 py-1.5 rounded-xl outline-none"
                        style={{
                          background: 'var(--p-bg)',
                          border: '1px solid var(--p-line-strong)',
                          color: 'var(--p-ink)',
                        }}
                      >
                        <option value="ALL">{t('all_statuses')}</option>
                        <option value="PRESENT">{tJ('present')}</option>
                        <option value="LATE">{tJ('late')}</option>
                        <option value="ABSENT">{tJ('absent')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Column headers */}
                  <div
                    className="jm hidden sm:grid px-4 py-2.5 text-[9px] tracking-[0.16em] uppercase"
                    style={{
                      gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr',
                      borderBottom: '1px solid var(--p-line-strong)',
                      color: 'var(--p-ink-faint)',
                      background: 'var(--p-bg)',
                    }}
                  >
                    <span>{tCommon('student')}</span>
                    <span className="text-center">{tJ('present')}</span>
                    <span className="text-center">{tJ('late')}</span>
                    <span className="text-center">{tJ('absent')}</span>
                    <span>{t('attendance_rate')}</span>
                    <span className="text-center">{t('avg_score')}</span>
                  </div>

                  {filteredRows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <AlertCircle style={{ width: 28, height: 28, opacity: 0.2, color: 'var(--p-ink-soft)' }} />
                      <p className="jm text-[12px]" style={{ color: 'var(--p-ink-faint)' }}>{tCommon('no_data')}</p>
                    </div>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <div
                        key={row.student_id}
                        className="p-att-row p-delay px-4 py-3 flex flex-col gap-2 sm:grid sm:items-center sm:gap-0"
                        style={{
                          gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr',
                          animationDelay: `${idx * 18}ms`,
                        }}
                      >
                        {/* Name */}
                        <div className="flex items-center gap-3">
                          <span
                            className="jm font-bold shrink-0 flex items-center justify-center"
                            style={{
                              width: 28, height: 28, borderRadius: 8,
                              background: 'var(--p-bg)',
                              color: 'var(--p-ink-faint)',
                              fontSize: 11,
                              border: '1px solid var(--p-line)',
                            }}
                          >
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span className="syne font-semibold" style={{ fontSize: 13, color: 'var(--p-ink)' }}>{row.name}</span>
                        </div>

                        {/* Counts */}
                        <AttPill value={row.present} hint={tJ('present')} dot="#4ADE80" />
                        <AttPill value={row.late}    hint={tJ('late')}    dot="#FBBF24" />
                        <AttPill value={row.absent}  hint={tJ('absent')}  dot="#F87171" />

                        {/* Rate bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 p-bar">
                            <div
                              className="p-bar-fill"
                              style={{
                                width: `${row.rate}%`,
                                background: row.rate >= 80 ? '#15803D' : row.rate >= 50 ? '#D97706' : '#DC2626',
                              }}
                            />
                          </div>
                          <span className="jm text-[12px] font-bold tabular-nums" style={{ color: 'var(--p-ink)', minWidth: 36 }}>
                            {row.rate}%
                          </span>
                        </div>

                        {/* Avg score */}
                        <div className="flex items-center justify-between sm:justify-center gap-2">
                          <span className="jm text-[10px] sm:hidden" style={{ color: 'var(--p-ink-soft)' }}>
                            {t('avg_score')}
                          </span>
                          {row.avgScore == null ? (
                            <span className="jm text-[12px]" style={{ color: 'var(--p-ink-faint)' }}>—</span>
                          ) : (
                            <span
                              className="jm text-[12px] font-bold"
                              style={{
                                color: '#fff',
                                background: row.avgScore >= 70 ? '#15803D' : row.avgScore >= 50 ? '#D97706' : '#DC2626',
                                padding: '3px 9px',
                                borderRadius: 6,
                              }}
                            >
                              {row.avgScore}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {filteredRows.length > 0 && (
                    <div
                      className="jm text-[10px] px-4 py-2.5"
                      style={{
                        borderTop: '1px solid var(--p-line-strong)',
                        color: 'var(--p-ink-faint)',
                        background: 'var(--p-bg)',
                      }}
                    >
                      {filteredRows.length} {tJ('n_students')} · {totals.lessons} {t('lessons')}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function AttStatCard({
  icon,
  label,
  value,
  sub,
  accentColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accentColor?: string;
}) {
  return (
    <div
      className="rounded-2xl p-3 sm:p-4 flex flex-col gap-2"
      style={{ background: 'var(--p-card)', border: '1px solid var(--p-line-strong)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-lg"
          style={{ width: 26, height: 26, background: 'var(--p-bg)', border: '1px solid var(--p-line)' }}
        >
          {icon}
        </span>
        <span className="jm text-[9px] tracking-[0.1em] uppercase" style={{ color: 'var(--p-ink-faint)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="syne leading-none"
          style={{ fontSize: 30, fontWeight: 800, color: accentColor ?? 'var(--p-ink)', letterSpacing: '-0.02em' }}
        >
          {value}
        </span>
        {sub && (
          <span className="jm text-[11px]" style={{ color: 'var(--p-ink-soft)' }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function AttPill({ value, hint, dot }: { value: number; hint: string; dot: string }) {
  return (
    <div className="flex items-center justify-between sm:justify-center gap-1.5">
      <div className="flex items-center gap-1.5 sm:hidden">
        <span className="size-1.5 rounded-full shrink-0" style={{ background: dot }} />
        <span className="jm text-[10px]" style={{ color: 'var(--p-ink-soft)' }}>{hint}</span>
      </div>
      <span
        className="jm font-bold tabular-nums"
        style={{ fontSize: 13, color: value > 0 ? 'var(--p-ink)' : 'var(--p-ink-faint)' }}
      >
        {String(value).padStart(2, '0')}
      </span>
    </div>
  );
}
