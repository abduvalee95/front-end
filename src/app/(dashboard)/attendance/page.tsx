'use client';

import { useMemo, useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
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
  Clock,
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
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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

  // ── Aggregations ───────────────────────────────────────────────────
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
        present: 0,
        late: 0,
        absent: 0,
        total: 0,
        rate: 0,
        avgScore: null,
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
      { name: tJ('present'), value: totals.present, color: '#166534' },
      { name: tJ('late'), value: totals.late, color: '#92400E' },
      { name: tJ('absent'), value: totals.absent, color: '#991B1B' },
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
      r.present,
      r.late,
      r.absent,
      r.total,
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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

        :root {
          --att-paper: #F4EFE4;
          --att-sidebar: #1C1917;
          --att-ink: #1A1410;
          --att-ink-soft: #8C7B68;
          --att-ink-faint: #B4A490;
          --att-line: rgba(110,88,58,0.10);
          --att-line-strong: rgba(110,88,58,0.15);
          --att-line-softer: rgba(110,88,58,0.08);
          --att-line-input: rgba(110,88,58,0.18);
          --att-row-hover: rgba(110,88,58,0.035);
          --att-row-tint: rgba(110,88,58,0.03);
          --att-row-tint-strong: rgba(110,88,58,0.04);
          --att-chip: rgba(110,88,58,0.08);
          --att-chip-ink: #6B5A48;
          --att-gold: #C4A882;
          --att-gold-soft: #C4B49A;
          --att-button: #1E2D6E;
          --att-button-shadow: rgba(30,45,110,0.30);
          --att-sidebar-fg: #E8DFD0;
          --att-sidebar-fg-dim: #5A5045;
          --att-sidebar-fg-fainter: #3D3530;
          --att-sidebar-fg-mid: #7A6B5C;
          --att-sidebar-border: rgba(255,255,255,0.07);
          --att-sidebar-border-soft: rgba(255,255,255,0.05);
          --att-sidebar-border-softer: rgba(255,255,255,0.06);
          --att-sidebar-input-bg: rgba(255,255,255,0.06);
          --att-sidebar-input-border: rgba(255,255,255,0.08);
          --att-sidebar-skel: rgba(255,255,255,0.04);
          --att-sidebar-chip-bg: rgba(255,255,255,0.05);
          --att-shell-border: rgba(110,88,58,0.12);
          --att-skel: rgba(110,88,58,0.10);
          --att-group-hover-fg: #D4C4A8;
          --att-group-hover-border: rgba(212,196,168,0.4);
          --att-group-hover-bg: rgba(255,255,255,0.04);
          --att-group-active-fg: #F4EFE4;
          --att-group-active-bg: rgba(255,255,255,0.06);
          --att-teacher-sub: #4A4038;
          --att-card: #FAF6EC;
          --att-bar-bg: rgba(110,88,58,0.10);
        }
        .dark {
          --att-paper: #0b0a08;
          --att-sidebar: #050505;
          --att-ink: #f4efe4;
          --att-ink-soft: #8C7B68;
          --att-ink-faint: #6b5c4a;
          --att-line: rgba(212,196,168,0.10);
          --att-line-strong: rgba(212,196,168,0.15);
          --att-line-softer: rgba(212,196,168,0.08);
          --att-line-input: rgba(212,196,168,0.18);
          --att-row-hover: rgba(212,196,168,0.04);
          --att-row-tint: rgba(212,196,168,0.03);
          --att-row-tint-strong: rgba(212,196,168,0.04);
          --att-chip: rgba(212,196,168,0.08);
          --att-chip-ink: #d4c4a8;
          --att-gold: #d4b890;
          --att-gold-soft: #C4B49A;
          --att-button: #2a3d8f;
          --att-button-shadow: rgba(42,61,143,0.40);
          --att-sidebar-fg: #E8DFD0;
          --att-sidebar-fg-dim: #6b6555;
          --att-sidebar-fg-fainter: #4a4438;
          --att-sidebar-fg-mid: #8C7B68;
          --att-sidebar-border: rgba(255,255,255,0.06);
          --att-sidebar-border-soft: rgba(255,255,255,0.04);
          --att-sidebar-border-softer: rgba(255,255,255,0.05);
          --att-sidebar-input-bg: rgba(255,255,255,0.04);
          --att-sidebar-input-border: rgba(255,255,255,0.06);
          --att-sidebar-skel: rgba(255,255,255,0.03);
          --att-sidebar-chip-bg: rgba(255,255,255,0.04);
          --att-shell-border: rgba(212,196,168,0.10);
          --att-skel: rgba(212,196,168,0.08);
          --att-group-hover-fg: #d4c4a8;
          --att-group-hover-border: rgba(212,196,168,0.4);
          --att-group-hover-bg: rgba(255,255,255,0.04);
          --att-group-active-fg: #f4efe4;
          --att-group-active-bg: rgba(255,255,255,0.06);
          --att-teacher-sub: #6b5c4a;
          --att-card: #11100d;
          --att-bar-bg: rgba(212,196,168,0.08);
        }

        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .dm { font-family: 'DM Mono', 'Courier New', monospace; }

        .att-group-item {
          padding: 10px 16px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s ease;
          color: var(--att-ink-soft);
          font-size: 13px;
        }
        .att-group-item:hover {
          color: var(--att-group-hover-fg);
          border-left-color: var(--att-group-hover-border);
          background: var(--att-group-hover-bg);
        }
        .att-group-item.active {
          color: var(--att-group-active-fg);
          border-left-color: var(--att-gold);
          background: var(--att-group-active-bg);
        }

        .att-period-btn {
          padding: 7px 14px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid var(--att-line-input);
          background: transparent;
          color: var(--att-ink-soft);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .att-period-btn:first-child { border-radius: 8px 0 0 8px; }
        .att-period-btn:last-child  { border-radius: 0 8px 8px 0; }
        .att-period-btn:not(:first-child) { border-left: none; }
        .att-period-btn:hover {
          background: var(--att-row-hover);
          color: var(--att-ink);
        }
        .att-period-btn.active {
          background: var(--att-button);
          color: #fff;
          border-color: var(--att-button);
          box-shadow: 0 1px 6px var(--att-button-shadow);
        }

        .att-row {
          border-bottom: 1px solid var(--att-line);
          transition: background 0.15s ease;
        }
        .att-row:hover { background: var(--att-row-hover); }
        .att-row:last-child { border-bottom: none; }

        .att-bar {
          height: 6px;
          background: var(--att-bar-bg);
          border-radius: 3px;
          overflow: hidden;
          position: relative;
        }
        .att-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        @keyframes att-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .att-animate { animation: att-in 0.35s ease forwards; }
        .att-delay { opacity: 0; animation: att-in 0.3s ease forwards; }
      `}</style>

      <div
        className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-xl att-animate"
        style={{
          minHeight: '78vh',
          border: '1px solid var(--att-shell-border)',
          background: 'var(--att-paper)',
        }}
      >
        {/* ── MOBILE GROUP/PERIOD ─────────────────────────── */}
        <div
          className="lg:hidden flex flex-col gap-2 px-4 py-3"
          style={{ background: 'var(--att-sidebar)', borderBottom: '1px solid var(--att-sidebar-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--att-sidebar-fg-dim)' }}>
                BILIM NURU
              </p>
              <h2 className="cg leading-none" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--att-sidebar-fg)' }}>
                {t('title')}
              </h2>
            </div>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 dm text-[9px] tracking-widest uppercase"
                style={{ color: 'var(--att-sidebar-fg-dim)', background: 'var(--att-sidebar-chip-bg)', padding: '2px 6px', borderRadius: 4 }}
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
            className="w-full dm text-[12px] rounded-md px-3 py-2 outline-none"
            style={{
              background: 'var(--att-sidebar-input-bg)',
              color: 'var(--att-sidebar-fg)',
              border: '1px solid var(--att-sidebar-input-border)',
            }}
          >
            {visibleGroups.length === 0 ? (
              <option value="">{tCommon('no_data')}</option>
            ) : (
              visibleGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: 'var(--att-sidebar)' }}>
                  {g.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* ── SIDEBAR (lg+) ───────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0"
          style={{ background: 'var(--att-sidebar)', borderRight: '1px solid var(--att-sidebar-border-soft)' }}
        >
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--att-sidebar-border)' }}>
            <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--att-sidebar-fg-dim)' }}>
              BILIM NURU
            </p>
            <h2
              className="cg mt-1 leading-none"
              style={{ fontSize: '22px', fontWeight: 700, color: 'var(--att-sidebar-fg)', letterSpacing: '-0.01em' }}
            >
              {t('title')}
            </h2>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 mt-2 dm text-[9px] tracking-widest uppercase"
                style={{ color: 'var(--att-sidebar-fg-dim)', background: 'var(--att-sidebar-chip-bg)', padding: '2px 6px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {tJ('admin_view')}
              </span>
            )}
          </div>

          <div className="flex-1 py-3 overflow-y-auto">
            <p className="dm text-[9px] tracking-[0.18em] uppercase px-5 mb-2" style={{ color: 'var(--att-sidebar-fg-fainter)' }}>
              {isTeacher ? tCommon('your_groups') : tJ('all_groups')}
            </p>
            {groupsLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg" style={{ background: 'var(--att-sidebar-skel)' }} />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <p className="dm text-[11px] px-5" style={{ color: 'var(--att-sidebar-fg-fainter)' }}>{tCommon('no_data')}</p>
            ) : (
              visibleGroups.map((group) => (
                <div
                  key={group.id}
                  className={cn('att-group-item', selectedGroupId === group.id && 'active')}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen style={{ width: 11, height: 11, opacity: 0.6, flexShrink: 0 }} />
                    <span className="truncate font-semibold">{group.name}</span>
                  </div>
                  {group.teacher && selectedGroupId !== group.id && (
                    <p className="dm text-[10px] mt-0.5 ml-5 truncate" style={{ color: 'var(--att-teacher-sub)', opacity: 0.7 }}>
                      {group.teacher.full_name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Period summary in sidebar */}
          {!isLoading && totals.total > 0 && (
            <div className="px-5 py-5" style={{ borderTop: '1px solid var(--att-sidebar-border-softer)' }}>
              <p className="dm text-[9px] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--att-sidebar-fg-fainter)' }}>
                {periodLabel[period]}
              </p>
              <div className="space-y-3">
                {[
                  { label: tJ('present'), value: totals.present, dot: '#4ADE80' },
                  { label: tJ('late'), value: totals.late, dot: '#FB923C' },
                  { label: tJ('absent'), value: totals.absent, dot: '#F87171' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--att-sidebar-fg-mid)' }}>{s.label}</span>
                    </div>
                    <span
                      className="cg"
                      style={{ fontSize: '22px', fontWeight: 700, color: 'var(--att-gold-soft)', lineHeight: 1 }}
                    >
                      {String(s.value).padStart(2, '0')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN PANEL ──────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-5 shrink-0"
            style={{ borderBottom: '1px solid var(--att-line)', background: 'var(--att-paper)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 40, height: 40,
                  border: '1px solid var(--att-line-strong)',
                  background: 'var(--att-row-tint-strong)',
                  color: 'var(--att-chip-ink)',
                }}
              >
                <CalendarRange style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <p
                  className="cg leading-none text-[24px] sm:text-[28px]"
                  style={{ fontWeight: 700, color: 'var(--att-ink)', letterSpacing: '-0.02em' }}
                >
                  {selectedGroup?.name ?? t('title')}
                </p>
                <p className="dm text-[11px] mt-0.5" style={{ color: 'var(--att-ink-soft)' }}>
                  {dateFrom ? `${format(parseISO(dateFrom), 'dd MMM')} → ${format(parseISO(dateTo!), 'dd MMM yyyy')}` : t('all_time')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex">
                {(['week', 'month', 'all'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn('att-period-btn dm', period === p && 'active')}
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
                  borderRadius: 8,
                  border: '1px solid var(--att-line-input)',
                  background: 'var(--att-row-tint-strong)',
                  color: 'var(--att-chip-ink)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: filteredRows.length ? 'pointer' : 'not-allowed',
                  opacity: filteredRows.length ? 1 : 0.5,
                  transition: 'all 0.15s ease',
                }}
              >
                <Download style={{ width: 12, height: 12 }} />
                CSV
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-5">
            {!selectedGroupId ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <BookOpen style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12, color: 'var(--att-gold-soft)' }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: 'var(--att-ink-soft)' }}>
                  {tJ('group')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: 'var(--att-ink-faint)' }}>
                  {tJ('select_group_hint')}
                </p>
              </div>
            ) : isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" style={{ background: 'var(--att-skel)' }} />
                  ))}
                </div>
                <Skeleton className="h-64 rounded-xl" style={{ background: 'var(--att-skel)' }} />
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20">
                <AlertCircle style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12, color: 'var(--att-gold-soft)' }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: 'var(--att-ink-soft)' }}>
                  {tJ('no_students')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: 'var(--att-ink-faint)' }}>
                  {tJ('enroll_first')}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* ── STAT CARDS ─────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatCard
                    icon={<TrendingUp style={{ width: 16, height: 16 }} />}
                    label={t('attendance_rate')}
                    value={`${totals.rate}%`}
                    accent="#1E2D6E"
                  />
                  <StatCard
                    icon={<Users style={{ width: 16, height: 16 }} />}
                    label={t('total_lessons')}
                    value={String(totals.lessons)}
                    sub={`${enrollments.length} ${tJ('n_students')}`}
                  />
                  <StatCard
                    icon={<CheckCircle2 style={{ width: 16, height: 16, color: '#166534' }} />}
                    label={tJ('present')}
                    value={String(totals.present)}
                    sub={totals.total ? `${Math.round((totals.present / totals.total) * 100)}%` : '—'}
                  />
                  <StatCard
                    icon={<XCircle style={{ width: 16, height: 16, color: '#991B1B' }} />}
                    label={tJ('absent')}
                    value={String(totals.absent)}
                    sub={totals.total ? `${Math.round((totals.absent / totals.total) * 100)}%` : '—'}
                  />
                </div>

                {/* ── CHARTS ─────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                  <div
                    className="lg:col-span-2 rounded-xl p-4"
                    style={{ background: 'var(--att-card)', border: '1px solid var(--att-line-strong)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="cg font-bold" style={{ fontSize: 16, color: 'var(--att-ink)' }}>
                        {t('attendance_trend')}
                      </h3>
                      <span className="dm text-[10px]" style={{ color: 'var(--att-ink-soft)' }}>
                        {periodLabel[period]}
                      </span>
                    </div>
                    <div style={{ height: 220 }}>
                      {trendData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center dm text-[11px]" style={{ color: 'var(--att-ink-faint)' }}>
                          {tCommon('no_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={trendData}>
                            <defs>
                              <linearGradient id="att-rate" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1E2D6E" stopOpacity={0.4} />
                                <stop offset="100%" stopColor="#1E2D6E" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--att-line-strong)" opacity={0.5} />
                            <XAxis dataKey="x" stroke="var(--att-ink-soft)" fontSize={10} />
                            <YAxis stroke="var(--att-ink-soft)" fontSize={10} width={36} tickFormatter={(v) => `${v}%`} />
                            <Tooltip
                              contentStyle={{
                                background: 'var(--att-card)',
                                border: '1px solid var(--att-line-strong)',
                                borderRadius: 8,
                                fontSize: 12,
                                color: 'var(--att-ink)',
                              }}
                              formatter={(v) => [`${Number(v) || 0}%`, t('attendance_rate')]}
                            />
                            <Area
                              type="monotone"
                              dataKey="rate"
                              stroke="#1E2D6E"
                              strokeWidth={2}
                              fill="url(#att-rate)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>

                  <div
                    className="rounded-xl p-4"
                    style={{ background: 'var(--att-card)', border: '1px solid var(--att-line-strong)' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="cg font-bold" style={{ fontSize: 16, color: 'var(--att-ink)' }}>
                        {t('distribution')}
                      </h3>
                    </div>
                    <div style={{ height: 220 }}>
                      {donutData.length === 0 ? (
                        <div className="h-full w-full flex items-center justify-center dm text-[11px]" style={{ color: 'var(--att-ink-faint)' }}>
                          {tCommon('no_data')}
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={45}
                              outerRadius={75}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {donutData.map((d) => (
                                <Cell key={d.name} fill={d.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: 'var(--att-card)',
                                border: '1px solid var(--att-line-strong)',
                                borderRadius: 8,
                                fontSize: 12,
                                color: 'var(--att-ink)',
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    <div className="space-y-1.5 mt-2">
                      {donutData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="size-2 rounded-sm" style={{ background: d.color }} />
                            <span className="dm" style={{ color: 'var(--att-ink-soft)' }}>{d.name}</span>
                          </div>
                          <span className="dm font-semibold" style={{ color: 'var(--att-ink)' }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── STUDENT TABLE ──────────────────────── */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ background: 'var(--att-card)', border: '1px solid var(--att-line-strong)' }}
                >
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4"
                    style={{ borderBottom: '1px solid var(--att-line-strong)' }}
                  >
                    <h3 className="cg font-bold" style={{ fontSize: 16, color: 'var(--att-ink)' }}>
                      {t('by_student')}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
                        style={{
                          background: 'var(--att-row-tint-strong)',
                          border: '1px solid var(--att-line-input)',
                          minWidth: 180,
                        }}
                      >
                        <Search style={{ width: 12, height: 12, color: 'var(--att-ink-soft)' }} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder={t('search_student')}
                          className="dm bg-transparent outline-none w-full text-[12px]"
                          style={{ color: 'var(--att-ink)' }}
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                        className="dm text-[11px] px-2 py-1.5 rounded-md outline-none"
                        style={{
                          background: 'var(--att-row-tint-strong)',
                          border: '1px solid var(--att-line-input)',
                          color: 'var(--att-ink)',
                        }}
                      >
                        <option value="ALL">{t('all_statuses')}</option>
                        <option value="PRESENT">{tJ('present')}</option>
                        <option value="LATE">{tJ('late')}</option>
                        <option value="ABSENT">{tJ('absent')}</option>
                      </select>
                    </div>
                  </div>

                  {/* Header row */}
                  <div
                    className="dm hidden sm:grid px-4 py-2.5 text-[10px] tracking-[0.14em] uppercase"
                    style={{
                      gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr',
                      borderBottom: '1px solid var(--att-line-strong)',
                      color: 'var(--att-ink-soft)',
                      background: 'var(--att-row-tint)',
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
                    <div className="flex flex-col items-center justify-center py-12">
                      <AlertCircle style={{ width: 32, height: 32, opacity: 0.25, marginBottom: 8, color: 'var(--att-gold-soft)' }} />
                      <p className="dm text-[12px]" style={{ color: 'var(--att-ink-faint)' }}>
                        {tCommon('no_data')}
                      </p>
                    </div>
                  ) : (
                    filteredRows.map((row, idx) => (
                      <div
                        key={row.student_id}
                        className="att-row att-delay px-4 py-3 flex flex-col gap-2 sm:grid sm:items-center sm:gap-0"
                        style={{
                          gridTemplateColumns: '1.4fr 0.6fr 0.6fr 0.6fr 1.4fr 0.6fr',
                          animationDelay: `${idx * 20}ms`,
                        }}
                      >
                        {/* Name */}
                        <div className="flex items-center gap-2.5">
                          <span
                            className="cg shrink-0 flex items-center justify-center font-bold"
                            style={{
                              width: 26, height: 26,
                              borderRadius: 6,
                              background: 'var(--att-chip)',
                              color: 'var(--att-chip-ink)',
                              fontSize: 12,
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--att-ink)' }}>{row.name}</span>
                        </div>

                        {/* Counts */}
                        <Pill value={row.present} hint={tJ('present')} dot="#4ADE80" />
                        <Pill value={row.late} hint={tJ('late')} dot="#FB923C" />
                        <Pill value={row.absent} hint={tJ('absent')} dot="#F87171" />

                        {/* Rate bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 att-bar">
                            <div
                              className="att-bar-fill"
                              style={{
                                width: `${row.rate}%`,
                                background: row.rate >= 80 ? '#166534' : row.rate >= 50 ? '#92400E' : '#991B1B',
                              }}
                            />
                          </div>
                          <span className="dm text-[12px] font-bold tabular-nums" style={{ color: 'var(--att-ink)' }}>
                            {row.rate}%
                          </span>
                        </div>

                        {/* Avg score */}
                        <div className="flex items-center justify-between sm:justify-center gap-2">
                          <span className="dm text-[10px] sm:hidden" style={{ color: 'var(--att-ink-soft)' }}>
                            {t('avg_score')}
                          </span>
                          {row.avgScore == null ? (
                            <span className="dm text-[12px]" style={{ color: 'var(--att-ink-faint)' }}>—</span>
                          ) : (
                            <span
                              className="dm text-[12px] font-bold"
                              style={{
                                color: '#fff',
                                background: row.avgScore >= 70 ? '#166534' : row.avgScore >= 50 ? '#92400E' : '#991B1B',
                                padding: '3px 8px',
                                borderRadius: 4,
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
                      className="dm text-[10px] px-4 py-2.5"
                      style={{
                        borderTop: '1.5px solid var(--att-line-strong)',
                        color: 'var(--att-ink-faint)',
                        background: 'var(--att-row-tint)',
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

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-xl p-3 sm:p-4 flex flex-col gap-1.5"
      style={{
        background: 'var(--att-card)',
        border: '1px solid var(--att-line-strong)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center rounded-md"
          style={{
            width: 26, height: 26,
            background: 'var(--att-chip)',
            color: accent ?? 'var(--att-chip-ink)',
          }}
        >
          {icon}
        </span>
        <span className="dm text-[10px] tracking-[0.1em] uppercase" style={{ color: 'var(--att-ink-soft)' }}>
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-2">
        <span
          className="cg leading-none"
          style={{ fontSize: 28, fontWeight: 700, color: accent ?? 'var(--att-ink)', letterSpacing: '-0.02em' }}
        >
          {value}
        </span>
        {sub && (
          <span className="dm text-[11px]" style={{ color: 'var(--att-ink-soft)' }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

function Pill({ value, hint, dot }: { value: number; hint: string; dot: string }) {
  return (
    <div className="flex items-center justify-between sm:justify-center gap-1.5">
      <div className="flex items-center gap-1.5 sm:hidden">
        <span className="size-1.5 rounded-full" style={{ background: dot }} />
        <span className="dm text-[10px]" style={{ color: 'var(--att-ink-soft)' }}>{hint}</span>
      </div>
      <span
        className="dm font-bold tabular-nums"
        style={{
          fontSize: 13,
          color: value > 0 ? 'var(--att-ink)' : 'var(--att-ink-faint)',
        }}
      >
        {String(value).padStart(2, '0')}
      </span>
    </div>
  );
}
