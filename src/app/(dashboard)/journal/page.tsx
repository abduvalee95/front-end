'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n/index';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  Save,
} from 'lucide-react';
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
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

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

  // Adjust state during render instead of useEffect
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

  // Adjust state during render instead of useEffect when journalData changes
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

  return (
    <>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

        :root {
          --journal-paper: #F4EFE4;
          --journal-sidebar: #1C1917;
          --journal-ink: #1A1410;
          --journal-ink-soft: #8C7B68;
          --journal-ink-faint: #B4A490;
          --journal-line: rgba(110,88,58,0.10);
          --journal-line-strong: rgba(110,88,58,0.15);
          --journal-line-softer: rgba(110,88,58,0.08);
          --journal-line-input: rgba(110,88,58,0.18);
          --journal-row-hover: rgba(110,88,58,0.035);
          --journal-row-tint: rgba(110,88,58,0.03);
          --journal-row-tint-strong: rgba(110,88,58,0.04);
          --journal-chip: rgba(110,88,58,0.08);
          --journal-chip-ink: #6B5A48;
          --journal-gold: #C4A882;
          --journal-gold-soft: #C4B49A;
          --journal-button: #1E2D6E;
          --journal-button-shadow: rgba(30,45,110,0.30);
          --journal-button-disabled-bg: rgba(110,88,58,0.10);
          --journal-button-disabled-fg: #A09080;
          --journal-score-active: #2D3A8C;
          --journal-sidebar-fg: #E8DFD0;
          --journal-sidebar-fg-dim: #5A5045;
          --journal-sidebar-fg-fainter: #3D3530;
          --journal-sidebar-fg-mid: #7A6B5C;
          --journal-sidebar-border: rgba(255,255,255,0.07);
          --journal-sidebar-border-soft: rgba(255,255,255,0.05);
          --journal-sidebar-border-softer: rgba(255,255,255,0.06);
          --journal-sidebar-input-bg: rgba(255,255,255,0.06);
          --journal-sidebar-input-border: rgba(255,255,255,0.08);
          --journal-sidebar-skel: rgba(255,255,255,0.04);
          --journal-sidebar-chip-bg: rgba(255,255,255,0.05);
          --journal-shell-border: rgba(110,88,58,0.12);
          --journal-status-hover-bg: rgba(110,88,58,0.08);
          --journal-status-hover-fg: #4A3E30;
          --journal-status-seg-fg: #8C7B6A;
          --journal-group-hover-fg: #D4C4A8;
          --journal-group-hover-border: rgba(212,196,168,0.4);
          --journal-group-hover-bg: rgba(255,255,255,0.04);
          --journal-group-active-fg: #F4EFE4;
          --journal-group-active-bg: rgba(255,255,255,0.06);
          --journal-teacher-sub: #4A4038;
          --journal-status-seg-border: rgba(110,88,58,0.12);
          --journal-skel: rgba(110,88,58,0.10);
        }
        .dark {
          --journal-paper: #0b0a08;
          --journal-sidebar: #050505;
          --journal-ink: #f4efe4;
          --journal-ink-soft: #8C7B68;
          --journal-ink-faint: #6b5c4a;
          --journal-line: rgba(212,196,168,0.10);
          --journal-line-strong: rgba(212,196,168,0.15);
          --journal-line-softer: rgba(212,196,168,0.08);
          --journal-line-input: rgba(212,196,168,0.18);
          --journal-row-hover: rgba(212,196,168,0.04);
          --journal-row-tint: rgba(212,196,168,0.03);
          --journal-row-tint-strong: rgba(212,196,168,0.04);
          --journal-chip: rgba(212,196,168,0.08);
          --journal-chip-ink: #d4c4a8;
          --journal-gold: #d4b890;
          --journal-gold-soft: #C4B49A;
          --journal-button: #2a3d8f;
          --journal-button-shadow: rgba(42,61,143,0.40);
          --journal-button-disabled-bg: rgba(212,196,168,0.08);
          --journal-button-disabled-fg: #6b5c4a;
          --journal-score-active: #3a4da0;
          --journal-sidebar-fg: #E8DFD0;
          --journal-sidebar-fg-dim: #6b6555;
          --journal-sidebar-fg-fainter: #4a4438;
          --journal-sidebar-fg-mid: #8C7B68;
          --journal-sidebar-border: rgba(255,255,255,0.06);
          --journal-sidebar-border-soft: rgba(255,255,255,0.04);
          --journal-sidebar-border-softer: rgba(255,255,255,0.05);
          --journal-sidebar-input-bg: rgba(255,255,255,0.04);
          --journal-sidebar-input-border: rgba(255,255,255,0.06);
          --journal-sidebar-skel: rgba(255,255,255,0.03);
          --journal-sidebar-chip-bg: rgba(255,255,255,0.04);
          --journal-shell-border: rgba(212,196,168,0.10);
          --journal-status-hover-bg: rgba(212,196,168,0.08);
          --journal-status-hover-fg: #d4c4a8;
          --journal-status-seg-fg: #8C7B68;
          --journal-group-hover-fg: #d4c4a8;
          --journal-group-hover-border: rgba(212,196,168,0.4);
          --journal-group-hover-bg: rgba(255,255,255,0.04);
          --journal-group-active-fg: #f4efe4;
          --journal-group-active-bg: rgba(255,255,255,0.06);
          --journal-teacher-sub: #6b5c4a;
          --journal-status-seg-border: rgba(212,196,168,0.12);
          --journal-skel: rgba(212,196,168,0.08);
        }

        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .dm { font-family: 'DM Mono', 'Courier New', monospace; }

        .ledger-row {
          border-bottom: 1px solid var(--journal-line);
          transition: background 0.15s ease;
        }
        .ledger-row:hover {
          background: var(--journal-row-hover);
        }
        .ledger-row:last-child {
          border-bottom: none;
        }

        .status-seg {
          flex: 1;
          min-width: 0;
          padding: 8px 6px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          color: var(--journal-status-seg-fg);
          background: transparent;
          white-space: nowrap;
        }
        @media (min-width: 640px) {
          .status-seg { font-size: 11px; padding: 6px 0; }
        }
        .status-seg:first-child { border-radius: 6px 0 0 6px; }
        .status-seg:last-child  { border-radius: 0 6px 6px 0; }

        .status-seg.present-active {
          background: #166534;
          color: #fff;
          box-shadow: 0 1px 6px rgba(22,101,52,0.30);
        }
        .status-seg.late-active {
          background: #92400E;
          color: #fff;
          box-shadow: 0 1px 6px rgba(146,64,14,0.30);
        }
        .status-seg.absent-active {
          background: #991B1B;
          color: #fff;
          box-shadow: 0 1px 6px rgba(153,27,27,0.30);
        }
        .status-seg:hover:not(.present-active):not(.late-active):not(.absent-active) {
          background: var(--journal-status-hover-bg);
          color: var(--journal-status-hover-fg);
        }


        .group-item {
          padding: 10px 16px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s ease;
          color: var(--journal-ink-soft);
          font-size: 13px;
        }
        .group-item:hover {
          color: var(--journal-group-hover-fg);
          border-left-color: var(--journal-group-hover-border);
          background: var(--journal-group-hover-bg);
        }
        .group-item.active {
          color: var(--journal-group-active-fg);
          border-left-color: var(--journal-gold);
          background: var(--journal-group-active-bg);
        }

        @keyframes ledger-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ledger-animate { animation: ledger-in 0.35s ease forwards; }
        .ledger-row-delay { opacity: 0; animation: ledger-in 0.3s ease forwards; }
      `}</style>

      <div
        className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-xl ledger-animate"
        style={{
          minHeight: '78vh',
          border: '1px solid var(--journal-shell-border)',
          background: 'var(--journal-paper)',
        }}
      >
        {/* ── MOBILE GROUP SELECTOR (visible <lg) ─────────── */}
        <div
          className="lg:hidden flex flex-col gap-2 px-4 py-3"
          style={{ background: 'var(--journal-sidebar)', borderBottom: '1px solid var(--journal-sidebar-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--journal-sidebar-fg-dim)' }}>
                BILIM NURU
              </p>
              <h2 className="cg leading-none" style={{ fontSize: '18px', fontWeight: 700, color: 'var(--journal-sidebar-fg)' }}>
                {t('title')}
              </h2>
            </div>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 dm text-[9px] tracking-widest uppercase"
                style={{ color: 'var(--journal-sidebar-fg-dim)', background: 'var(--journal-sidebar-chip-bg)', padding: '2px 6px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {t('admin_view')}
              </span>
            )}
          </div>
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            disabled={groupsLoading || visibleGroups.length === 0}
            className="w-full dm text-[12px] rounded-md px-3 py-2 outline-none"
            style={{
              background: 'var(--journal-sidebar-input-bg)',
              color: 'var(--journal-sidebar-fg)',
              border: '1px solid var(--journal-sidebar-input-border)',
            }}
          >
            {visibleGroups.length === 0 ? (
              <option value="">{tCommon('no_data')}</option>
            ) : (
              visibleGroups.map((g) => (
                <option key={g.id} value={g.id} style={{ background: 'var(--journal-sidebar)' }}>
                  {g.name}
                </option>
              ))
            )}
          </select>
          {enrollments.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              {[
                { label: t('present'), value: stats.present, dot: '#4ADE80' },
                { label: t('late'), value: stats.late, dot: '#FB923C' },
                { label: t('absent'), value: stats.absent, dot: '#F87171' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full" style={{ background: s.dot }} />
                  <span className="text-[11px]" style={{ color: 'var(--journal-sidebar-fg-mid)' }}>{s.label}</span>
                  <span className="cg" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--journal-gold-soft)' }}>
                    {String(s.value).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SIDEBAR (lg+) ───────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-64 shrink-0"
          style={{ background: 'var(--journal-sidebar)', borderRight: '1px solid var(--journal-sidebar-border-soft)' }}
        >
          {/* Sidebar header */}
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--journal-sidebar-border)' }}>
            <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--journal-sidebar-fg-dim)' }}>
              BILIM NURU
            </p>
            <h2
              className="cg mt-1 leading-none"
              style={{ fontSize: '22px', fontWeight: 700, color: 'var(--journal-sidebar-fg)', letterSpacing: '-0.01em' }}
            >
              {t('title')}
            </h2>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 mt-2 dm text-[9px] tracking-widest uppercase"
                style={{ color: 'var(--journal-sidebar-fg-dim)', background: 'var(--journal-sidebar-chip-bg)', padding: '2px 6px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {t('admin_view')}
              </span>
            )}
          </div>

          {/* Groups list */}
          <div className="flex-1 py-3 overflow-y-auto">
            <p className="dm text-[9px] tracking-[0.18em] uppercase px-5 mb-2" style={{ color: 'var(--journal-sidebar-fg-fainter)' }}>
              {isTeacher ? tCommon('your_groups') : t('all_groups')}
            </p>
            {groupsLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg" style={{ background: 'var(--journal-sidebar-skel)' }} />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <p className="dm text-[11px] px-5" style={{ color: 'var(--journal-sidebar-fg-fainter)' }}>{tCommon('no_data')}</p>
            ) : (
              visibleGroups.map((group) => (
                <div
                  key={group.id}
                  className={cn('group-item', selectedGroupId === group.id && 'active')}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-center gap-2">
                    <BookOpen style={{ width: 11, height: 11, opacity: 0.6, flexShrink: 0 }} />
                    <span className="truncate font-semibold">{group.name}</span>
                  </div>
                  {group.teacher && selectedGroupId !== group.id && (
                    <p className="dm text-[10px] mt-0.5 ml-5 truncate" style={{ color: 'var(--journal-teacher-sub)', opacity: 0.7 }}>
                      {group.teacher.full_name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Stats block */}
          {enrollments.length > 0 && (
            <div className="px-5 py-5" style={{ borderTop: '1px solid var(--journal-sidebar-border-softer)' }}>
              <p className="dm text-[9px] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--journal-sidebar-fg-fainter)' }}>
                {t('today')}
              </p>
              <div className="space-y-3">
                {[
                  { label: t('present'), value: stats.present, color: '#166534', dot: '#4ADE80' },
                  { label: t('late'), value: stats.late, color: '#92400E', dot: '#FB923C' },
                  { label: t('absent'), value: stats.absent, color: '#991B1B', dot: '#F87171' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                      <span className="text-[12px] font-medium" style={{ color: 'var(--journal-sidebar-fg-mid)' }}>{s.label}</span>
                    </div>
                    <span
                      className="cg"
                      style={{ fontSize: '22px', fontWeight: 700, color: 'var(--journal-gold-soft)', lineHeight: 1 }}
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

          {/* Main header: date nav + group name + save */}
          <div
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 pt-4 sm:pt-6 pb-4 sm:pb-5 shrink-0"
            style={{
              borderBottom: '1px solid var(--journal-line)',
              background: 'var(--journal-paper)',
            }}
          >
            {/* Date navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate((d) => subDays(d, 1))}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32,
                  border: '1px solid var(--journal-line-strong)',
                  background: 'var(--journal-row-tint-strong)',
                  color: 'var(--journal-ink-soft)',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>

              <div>
                <p
                  className="cg leading-none text-[24px] sm:text-[32px]"
                  style={{ fontWeight: 700, color: 'var(--journal-ink)', letterSpacing: '-0.02em' }}
                >
                  {format(currentDate, 'dd MMMM')}
                </p>
                <p className="dm text-[11px] mt-0.5" style={{ color: 'var(--journal-ink-soft)' }}>
                  {format(currentDate, 'EEEE · yyyy')}
                </p>
              </div>

              <button
                onClick={() => setCurrentDate((d) => addDays(d, 1))}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32,
                  border: '1px solid var(--journal-line-strong)',
                  background: 'var(--journal-row-tint-strong)',
                  color: 'var(--journal-ink-soft)',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Group name + save */}
            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {selectedGroup && (
                <div className="text-left sm:text-right">
                  <p className="cg font-bold" style={{ fontSize: '18px', color: 'var(--journal-ink)', lineHeight: 1.1 }}>
                    {selectedGroup.name}
                  </p>
                  {enrollments.length > 0 && (
                    <p className="dm text-[10px] mt-0.5" style={{ color: 'var(--journal-ink-soft)' }}>
                      {enrollments.length} {t('n_students')}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={upsert.isPending || !selectedGroupId || !enrollments.length}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '9px 20px',
                  borderRadius: 8,
                  border: 'none',
                  background: !selectedGroupId || !enrollments.length
                    ? 'var(--journal-button-disabled-bg)'
                    : 'var(--journal-button)',
                  color: !selectedGroupId || !enrollments.length ? 'var(--journal-button-disabled-fg)' : '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: !selectedGroupId || !enrollments.length ? 'not-allowed' : 'pointer',
                  boxShadow: !selectedGroupId || !enrollments.length
                    ? 'none'
                    : '0 4px 16px var(--journal-button-shadow)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Save style={{ width: 13, height: 13 }} />
                {upsert.isPending ? tCommon('loading') : t('save_attendance')}
              </button>
            </div>
          </div>

          {/* Column headers (hidden on mobile) */}
          {selectedGroupId && !isLoading && enrollments.length > 0 && (
            <div
              className="dm hidden sm:grid px-8 py-2.5 text-[10px] tracking-[0.14em] uppercase shrink-0"
              style={{
                gridTemplateColumns: '1fr 220px 130px',
                borderBottom: '1px solid var(--journal-line-strong)',
                color: 'var(--journal-ink-soft)',
                background: 'var(--journal-row-tint)',
              }}
            >
              <span>{tCommon('student')}</span>
              <span className="text-center">{t('attendance')}</span>
              <span className="text-center">{t('score')}</span>
            </div>
          )}

          {/* Content area */}
          <div className="flex-1 overflow-y-auto">
            {!selectedGroupId ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--journal-gold-soft)' }}>
                <BookOpen style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12 }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: 'var(--journal-ink-soft)' }}>
                  {t('group')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: 'var(--journal-ink-faint)' }}>
                  {t('select_group_hint')}
                </p>
              </div>
            ) : isLoading ? (
              <div className="px-4 sm:px-8 py-4 space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="py-4 flex flex-col gap-2 sm:grid sm:gap-0"
                    style={{
                      gridTemplateColumns: '1fr 220px 130px',
                      borderBottom: '1px solid var(--journal-line-softer)',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <Skeleton className="h-4 w-36 rounded" style={{ background: 'var(--journal-skel)' }} />
                    <div className="flex sm:justify-center">
                      <Skeleton className="h-7 w-full sm:w-44 rounded-md" style={{ background: 'var(--journal-skel)' }} />
                    </div>
                    <div className="flex sm:justify-center">
                      <Skeleton className="h-5 w-12 rounded" style={{ background: 'var(--journal-skel)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: 'var(--journal-gold-soft)' }}>
                <AlertCircle style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12 }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: 'var(--journal-ink-soft)' }}>
                  {t('no_students')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: 'var(--journal-ink-faint)' }}>
                  {t('enroll_first')}
                </p>
              </div>
            ) : (
              <div>
                {enrollments.map((enrollment, idx) => {
                  const studentId = enrollment.student_id;
                  const entry = localEntries[studentId];
                  const name = enrollment.student?.name ?? studentId;

                  return (
                    <div
                      key={studentId}
                      className="ledger-row flex flex-col gap-3 sm:grid sm:gap-0 px-4 sm:px-8 py-3 sm:py-3 sm:items-center"
                      style={{
                        gridTemplateColumns: '1fr 220px 130px',
                        animationDelay: `${idx * 25}ms`,
                      }}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-2.5">
                        <span
                          className="cg shrink-0 flex items-center justify-center font-bold"
                          style={{
                            width: 28, height: 28,
                            borderRadius: 6,
                            background: 'var(--journal-chip)',
                            color: 'var(--journal-chip-ink)',
                            fontSize: 13,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--journal-ink)' }}>{name}</span>
                      </div>

                      {/* Status segmented control */}
                      <div className="flex sm:justify-center">
                        <div
                          className="flex w-full sm:w-auto"
                          style={{
                            border: '1px solid var(--journal-line-input)',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'var(--journal-row-tint-strong)',
                          }}
                        >
                          <button
                            className={cn('status-seg', entry?.status === 'PRESENT' && 'present-active')}
                            onClick={() => updateStatus(studentId, 'PRESENT')}
                            title={t('present')}
                          >
                            ✓ {t('present')}
                          </button>
                          <button
                            className={cn('status-seg', entry?.status === 'LATE' && 'late-active')}
                            onClick={() => updateStatus(studentId, 'LATE')}
                            title={t('late')}
                            style={{ borderLeft: '1px solid var(--journal-status-seg-border)', borderRight: '1px solid var(--journal-status-seg-border)' }}
                          >
                            ⏱ {t('late')}
                          </button>
                          <button
                            className={cn('status-seg', entry?.status === 'ABSENT' && 'absent-active')}
                            onClick={() => updateStatus(studentId, 'ABSENT')}
                            title={t('absent')}
                          >
                            ✗ {t('absent')}
                          </button>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between sm:justify-center gap-1.5">
                        <span className="dm text-[10px] sm:hidden" style={{ color: 'var(--journal-ink-soft)' }}>
                          {t('score')}
                        </span>
                        <select
                          value={entry?.score ?? ''}
                          onChange={(e) => updateScore(studentId, e.target.value)}
                          className="dm"
                          style={{
                            width: 72,
                            height: 30,
                            borderRadius: 6,
                            border: '1px solid var(--journal-line-input)',
                            background: entry?.score ? 'var(--journal-score-active)' : 'var(--journal-row-tint-strong)',
                            color: entry?.score ? '#fff' : 'var(--journal-chip-ink)',
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: 'center',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.15s ease',
                          }}
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

                {/* Ledger footer rule */}
                <div
                  className="mx-4 sm:mx-8 mt-4 mb-6 flex items-center gap-3"
                  style={{ borderTop: '1.5px solid var(--journal-line-strong)' }}
                >
                  <span className="dm text-[10px] pt-2" style={{ color: 'var(--journal-ink-faint)' }}>
                    {enrollments.length} {t('n_students')} · {format(currentDate, 'dd.MM.yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
