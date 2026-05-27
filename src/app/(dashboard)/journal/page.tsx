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

  return (
    <div
        className="flex flex-col lg:flex-row gap-0 rounded-2xl overflow-hidden shadow-2xl p-enter"
        style={{
          minHeight: '78vh',
          border: '1px solid var(--p-shell-border)',
          background: 'var(--p-bg)',
        }}
      >
        {/* ── MOBILE GROUP SELECTOR ───────────────────────── */}
        <div
          className="lg:hidden flex flex-col gap-3 px-4 py-4"
          style={{ background: 'var(--p-sidebar)', borderBottom: '1px solid var(--p-sidebar-border)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="jm text-[9px] tracking-[0.22em] uppercase" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
                BILIM NURU
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
                {t('admin_view')}
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
                <option key={g.id} value={g.id} style={{ background: 'var(--p-sidebar)' }}>
                  {g.name}
                </option>
              ))
            )}
          </select>
          {enrollments.length > 0 && (
            <div className="flex items-center gap-5 pt-1">
              {[
                { label: t('present'), dot: '#4ADE80' },
                { label: t('late'), dot: '#FBBF24' },
                { label: t('absent'), dot: '#F87171' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                  <span className="syne text-[11px] font-medium" style={{ color: 'var(--p-sidebar-fg-mid)' }}>{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SIDEBAR (lg+) ───────────────────────────────── */}
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
                {t('admin_view')}
              </span>
            )}
          </div>

          <div className="flex-1 py-3 overflow-y-auto">
            <p className="jm text-[9px] tracking-[0.18em] uppercase px-5 mb-2" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
              {isTeacher ? tCommon('your_groups') : t('all_groups')}
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

          {enrollments.length > 0 && (
            <div className="px-5 py-5" style={{ borderTop: '1px solid var(--p-sidebar-border)' }}>
              <p className="jm text-[9px] tracking-[0.18em] uppercase mb-4" style={{ color: 'var(--p-sidebar-fg-dim)' }}>
                {t('today')}
              </p>
              <div className="space-y-4">
                {[
                  { label: t('present'), dot: '#4ADE80' },
                  { label: t('late'), dot: '#FBBF24' },
                  { label: t('absent'), dot: '#F87171' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full shrink-0" style={{ background: s.dot }} />
                      <span className="syne font-medium" style={{ fontSize: 12, color: 'var(--p-sidebar-fg-mid)' }}>{s.label}</span>
                    </div>
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
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-8 pt-5 sm:pt-6 pb-4 sm:pb-5 shrink-0"
            style={{ borderBottom: '1px solid var(--p-line)', background: 'var(--p-bg)' }}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate((d) => subDays(d, 1))}
                className="flex items-center justify-center rounded-xl transition-opacity hover:opacity-60"
                style={{
                  width: 34, height: 34,
                  border: '1px solid var(--p-line-strong)',
                  background: 'var(--p-card)',
                  color: 'var(--p-ink-soft)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>

              <div>
                <p
                  className="syne leading-none"
                  style={{ fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, color: 'var(--p-ink)', letterSpacing: '-0.02em' }}
                >
                  {format(currentDate, 'dd MMMM')}
                </p>
                <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-soft)' }}>
                  {format(currentDate, 'EEEE · yyyy')}
                </p>
              </div>

              <button
                onClick={() => setCurrentDate((d) => addDays(d, 1))}
                className="flex items-center justify-center rounded-xl transition-opacity hover:opacity-60"
                style={{
                  width: 34, height: 34,
                  border: '1px solid var(--p-line-strong)',
                  background: 'var(--p-card)',
                  color: 'var(--p-ink-soft)',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
              {selectedGroup && (
                <div className="text-left sm:text-right">
                  <p className="syne font-bold" style={{ fontSize: 16, color: 'var(--p-ink)', lineHeight: 1.2 }}>
                    {selectedGroup.name}
                  </p>
                  {enrollments.length > 0 && (
                    <p className="jm text-[10px] mt-0.5" style={{ color: 'var(--p-ink-soft)' }}>
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
                  borderRadius: 10,
                  border: !selectedGroupId || !enrollments.length ? '1px solid var(--p-line)' : '1px solid var(--p-line-strong)',
                  background: !selectedGroupId || !enrollments.length ? 'var(--p-card)' : 'var(--p-button)',
                  color: !selectedGroupId || !enrollments.length ? 'var(--p-ink-faint)' : 'var(--p-button-fg)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'Syne', system-ui, sans-serif",
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  cursor: !selectedGroupId || !enrollments.length ? 'not-allowed' : 'pointer',
                  boxShadow: !selectedGroupId || !enrollments.length ? 'none' : '0 4px 18px rgba(0,0,0,0.14)',
                  transition: 'all 0.12s ease',
                } as React.CSSProperties}
              >
                <Save style={{ width: 13, height: 13 }} />
                {upsert.isPending ? tCommon('loading') : t('save_attendance')}
              </button>
            </div>
          </div>

          {/* Column headers */}
          {selectedGroupId && !isLoading && enrollments.length > 0 && (
            <div
              className="jm hidden sm:grid px-8 py-2.5 text-[9px] tracking-[0.16em] uppercase shrink-0"
              style={{
                gridTemplateColumns: '1fr 220px 130px',
                borderBottom: '1px solid var(--p-line-strong)',
                color: 'var(--p-ink-faint)',
                background: 'var(--p-card)',
              }}
            >
              <span>{tCommon('student')}</span>
              <span className="text-center">{t('attendance')}</span>
              <span className="text-center">{t('score')}</span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
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
                  <p className="syne font-bold" style={{ fontSize: 16, color: 'var(--p-ink-soft)' }}>
                    {t('group')}
                  </p>
                  <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-faint)' }}>
                    {t('select_group_hint')}
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="px-4 sm:px-8 py-4 space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="py-4 flex flex-col gap-2 sm:grid sm:gap-0"
                    style={{ gridTemplateColumns: '1fr 220px 130px', borderBottom: '1px solid var(--p-line)' }}
                  >
                    <Skeleton className="h-4 w-36 rounded-lg" style={{ background: 'var(--p-skel)' }} />
                    <div className="flex sm:justify-center">
                      <Skeleton className="h-8 w-full sm:w-44 rounded-lg" style={{ background: 'var(--p-skel)' }} />
                    </div>
                    <div className="flex sm:justify-center">
                      <Skeleton className="h-5 w-12 rounded-lg" style={{ background: 'var(--p-skel)' }} />
                    </div>
                  </div>
                ))}
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
                  <p className="syne font-bold" style={{ fontSize: 16, color: 'var(--p-ink-soft)' }}>
                    {t('no_students')}
                  </p>
                  <p className="jm text-[11px] mt-1" style={{ color: 'var(--p-ink-faint)' }}>
                    {t('enroll_first')}
                  </p>
                </div>
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
                      className="p-row p-row-in flex flex-col gap-3 sm:grid sm:gap-0 px-4 sm:px-8 py-3 sm:items-center"
                      style={{
                        gridTemplateColumns: '1fr 220px 130px',
                        animationDelay: `${idx * 22}ms`,
                      }}
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <span
                          className="jm font-bold shrink-0 flex items-center justify-center"
                          style={{
                            width: 28, height: 28,
                            borderRadius: 8,
                            background: 'var(--p-card)',
                            color: 'var(--p-ink-faint)',
                            fontSize: 11,
                            border: '1px solid var(--p-line)',
                          }}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="syne font-semibold" style={{ fontSize: 14, color: 'var(--p-ink)' }}>{name}</span>
                      </div>

                      {/* Status segmented */}
                      <div className="flex sm:justify-center">
                        <div
                          className="flex w-full sm:w-auto"
                          style={{
                            border: '1px solid var(--p-seg-border)',
                            borderRadius: 9,
                            overflow: 'hidden',
                            background: 'var(--p-seg-bg)',
                          }}
                        >
                          <button
                            className={cn('p-seg', entry?.status === 'PRESENT' && 'p-present')}
                            onClick={() => updateStatus(studentId, 'PRESENT')}
                            title={t('present')}
                          >
                            ✓ {t('present')}
                          </button>
                          <button
                            className={cn('p-seg', entry?.status === 'LATE' && 'p-late')}
                            onClick={() => updateStatus(studentId, 'LATE')}
                            title={t('late')}
                            style={{ borderLeft: '1px solid var(--p-seg-border)', borderRight: '1px solid var(--p-seg-border)' }}
                          >
                            ⏱ {t('late')}
                          </button>
                          <button
                            className={cn('p-seg', entry?.status === 'ABSENT' && 'p-absent')}
                            onClick={() => updateStatus(studentId, 'ABSENT')}
                            title={t('absent')}
                          >
                            ✗ {t('absent')}
                          </button>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center justify-between sm:justify-center gap-1.5">
                        <span className="jm text-[10px] sm:hidden" style={{ color: 'var(--p-ink-soft)' }}>
                          {t('score')}
                        </span>
                        <select
                          value={entry?.score ?? ''}
                          onChange={(e) => updateScore(studentId, e.target.value)}
                          className="jm"
                          style={{
                            width: 72,
                            height: 32,
                            borderRadius: 8,
                            border: '1px solid var(--p-score-border)',
                            background: entry?.score ? 'var(--p-score-active)' : 'var(--p-score-bg)',
                            color: entry?.score ? '#fff' : 'var(--p-chip-ink)',
                            fontSize: 13,
                            fontWeight: 600,
                            textAlign: 'center',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'all 0.12s ease',
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

                <div
                  className="mx-4 sm:mx-8 mt-4 mb-6 pt-3"
                  style={{ borderTop: '1px solid var(--p-line-strong)' }}
                >
                  <span className="jm text-[10px]" style={{ color: 'var(--p-ink-faint)' }}>
                    {enrollments.length} {t('n_students')} · {format(currentDate, 'dd.MM.yyyy')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
}
