'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n/index';
import { Input } from '@/components/ui/input';
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

  useEffect(() => {
    if (visibleGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(visibleGroups[0].id);
    }
  }, [visibleGroups, selectedGroupId]);

  const enrollmentResults = useGroupEnrollments(
    selectedGroupId ? [selectedGroupId] : [],
    !!selectedGroupId,
  );
  const enrollments = enrollmentResults[0]?.data ?? [];
  const enrollmentsLoading = enrollmentResults[0]?.isLoading ?? false;

  const { data: journalData, isLoading: journalLoading } = useJournalByGroup(
    selectedGroupId,
    { date: dateStr },
    !!selectedGroupId,
  );

  useEffect(() => {
    if (!journalData || !enrollments.length) return;
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
  }, [journalData, enrollments]);

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

        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .dm { font-family: 'DM Mono', 'Courier New', monospace; }

        .ledger-row {
          border-bottom: 1px solid rgba(110, 88, 58, 0.10);
          transition: background 0.15s ease;
        }
        .ledger-row:hover {
          background: rgba(110, 88, 58, 0.035);
        }
        .ledger-row:last-child {
          border-bottom: none;
        }

        .status-seg {
          flex: 1;
          padding: 6px 0;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          border: none;
          cursor: pointer;
          transition: all 0.15s ease;
          color: #8C7B6A;
          background: transparent;
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
          background: rgba(110, 88, 58, 0.08);
          color: #4A3E30;
        }

        .score-input {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          border: none;
          border-bottom: 1.5px solid rgba(110, 88, 58, 0.25);
          border-radius: 0;
          background: transparent;
          padding: 4px 4px 2px;
          width: 48px;
          color: #1A1410;
          outline: none;
          transition: border-color 0.15s;
        }
        .score-input:focus {
          border-bottom-color: #2D3A8C;
          box-shadow: none;
        }
        .score-input::placeholder { color: #C4B49A; }

        .group-item {
          padding: 10px 16px;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: all 0.15s ease;
          color: #8C7B68;
          font-size: 13px;
        }
        .group-item:hover {
          color: #D4C4A8;
          border-left-color: rgba(212,196,168,0.4);
          background: rgba(255,255,255,0.04);
        }
        .group-item.active {
          color: #F4EFE4;
          border-left-color: #C4A882;
          background: rgba(255,255,255,0.06);
        }

        @keyframes ledger-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ledger-animate { animation: ledger-in 0.35s ease forwards; }
        .ledger-row-delay { opacity: 0; animation: ledger-in 0.3s ease forwards; }
      `}</style>

      <div
        className="flex gap-0 rounded-2xl overflow-hidden shadow-xl ledger-animate"
        style={{
          minHeight: '78vh',
          border: '1px solid rgba(110,88,58,0.12)',
          background: '#F4EFE4',
        }}
      >
        {/* ── SIDEBAR ─────────────────────────────────────── */}
        <aside
          className="flex flex-col w-64 shrink-0"
          style={{ background: '#1C1917', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
          {/* Sidebar header */}
          <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: '#5A5045' }}>
              BILIM NURU
            </p>
            <h2
              className="cg mt-1 leading-none"
              style={{ fontSize: '22px', fontWeight: 700, color: '#E8DFD0', letterSpacing: '-0.01em' }}
            >
              {t('title')}
            </h2>
            {isAdmin && (
              <span
                className="inline-flex items-center gap-1 mt-2 dm text-[9px] tracking-widest uppercase"
                style={{ color: '#6B6050', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {t('admin_view')}
              </span>
            )}
          </div>

          {/* Groups list */}
          <div className="flex-1 py-3 overflow-y-auto">
            <p className="dm text-[9px] tracking-[0.18em] uppercase px-5 mb-2" style={{ color: '#3D3530' }}>
              {isTeacher ? tCommon('your_groups') : t('all_groups')}
            </p>
            {groupsLoading ? (
              <div className="px-4 space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-8 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <p className="dm text-[11px] px-5" style={{ color: '#3D3530' }}>{tCommon('no_data')}</p>
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
                    <p className="dm text-[10px] mt-0.5 ml-5 truncate" style={{ color: '#4A4038', opacity: 0.7 }}>
                      {group.teacher.full_name}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Stats block */}
          {enrollments.length > 0 && (
            <div className="px-5 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="dm text-[9px] tracking-[0.18em] uppercase mb-4" style={{ color: '#3D3530' }}>
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
                      <span className="text-[12px] font-medium" style={{ color: '#7A6B5C' }}>{s.label}</span>
                    </div>
                    <span
                      className="cg"
                      style={{ fontSize: '22px', fontWeight: 700, color: '#C4B49A', lineHeight: 1 }}
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
            className="flex items-center justify-between px-8 pt-6 pb-5 shrink-0"
            style={{
              borderBottom: '1px solid rgba(110,88,58,0.10)',
              background: '#F4EFE4',
            }}
          >
            {/* Date navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate((d) => subDays(d, 1))}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32,
                  border: '1px solid rgba(110,88,58,0.15)',
                  background: 'rgba(110,88,58,0.04)',
                  color: '#8C7B68',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft style={{ width: 15, height: 15 }} />
              </button>

              <div>
                <p
                  className="cg leading-none"
                  style={{ fontSize: '32px', fontWeight: 700, color: '#1A1410', letterSpacing: '-0.02em' }}
                >
                  {format(currentDate, 'dd MMMM')}
                </p>
                <p className="dm text-[11px] mt-0.5" style={{ color: '#8C7B68' }}>
                  {format(currentDate, 'EEEE · yyyy')}
                </p>
              </div>

              <button
                onClick={() => setCurrentDate((d) => addDays(d, 1))}
                className="flex items-center justify-center rounded-lg transition-all"
                style={{
                  width: 32, height: 32,
                  border: '1px solid rgba(110,88,58,0.15)',
                  background: 'rgba(110,88,58,0.04)',
                  color: '#8C7B68',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Group name + save */}
            <div className="flex items-center gap-4">
              {selectedGroup && (
                <div className="text-right">
                  <p className="cg font-bold" style={{ fontSize: '18px', color: '#1A1410', lineHeight: 1.1 }}>
                    {selectedGroup.name}
                  </p>
                  {enrollments.length > 0 && (
                    <p className="dm text-[10px] mt-0.5" style={{ color: '#8C7B68' }}>
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
                    ? 'rgba(110,88,58,0.10)'
                    : '#1E2D6E',
                  color: !selectedGroupId || !enrollments.length ? '#A09080' : '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'inherit',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: !selectedGroupId || !enrollments.length ? 'not-allowed' : 'pointer',
                  boxShadow: !selectedGroupId || !enrollments.length
                    ? 'none'
                    : '0 4px 16px rgba(30,45,110,0.30)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Save style={{ width: 13, height: 13 }} />
                {upsert.isPending ? tCommon('loading') : t('save_attendance')}
              </button>
            </div>
          </div>

          {/* Column headers */}
          {selectedGroupId && !isLoading && enrollments.length > 0 && (
            <div
              className="dm grid px-8 py-2.5 text-[10px] tracking-[0.14em] uppercase shrink-0"
              style={{
                gridTemplateColumns: '1fr 220px 120px',
                borderBottom: '1px solid rgba(110,88,58,0.15)',
                color: '#8C7B68',
                background: 'rgba(110,88,58,0.03)',
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
              <div className="flex flex-col items-center justify-center h-full" style={{ color: '#C4B49A' }}>
                <BookOpen style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12 }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: '#8C7B68' }}>
                  {t('group')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: '#B4A490' }}>
                  {t('select_group_hint')}
                </p>
              </div>
            ) : isLoading ? (
              <div className="px-8 py-4 space-y-0">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="py-4 grid"
                    style={{
                      gridTemplateColumns: '1fr 220px 120px',
                      borderBottom: '1px solid rgba(110,88,58,0.08)',
                      animationDelay: `${i * 60}ms`,
                    }}
                  >
                    <Skeleton className="h-4 w-36 rounded" style={{ background: 'rgba(110,88,58,0.10)' }} />
                    <div className="flex justify-center">
                      <Skeleton className="h-7 w-44 rounded-md" style={{ background: 'rgba(110,88,58,0.10)' }} />
                    </div>
                    <div className="flex justify-center">
                      <Skeleton className="h-5 w-12 rounded" style={{ background: 'rgba(110,88,58,0.10)' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: '#C4B49A' }}>
                <AlertCircle style={{ width: 44, height: 44, opacity: 0.25, marginBottom: 12 }} />
                <p className="cg font-semibold" style={{ fontSize: 20, color: '#8C7B68' }}>
                  {t('no_students')}
                </p>
                <p className="dm text-[11px] mt-1" style={{ color: '#B4A490' }}>
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
                      className="ledger-row grid px-8"
                      style={{
                        gridTemplateColumns: '1fr 220px 120px',
                        alignItems: 'center',
                        paddingTop: 12,
                        paddingBottom: 12,
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
                            background: 'rgba(110,88,58,0.08)',
                            color: '#6B5A48',
                            fontSize: 13,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#1A1410' }}>{name}</span>
                      </div>

                      {/* Status segmented control */}
                      <div className="flex justify-center">
                        <div
                          style={{
                            display: 'flex',
                            border: '1px solid rgba(110,88,58,0.18)',
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'rgba(110,88,58,0.04)',
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
                            style={{ borderLeft: '1px solid rgba(110,88,58,0.12)', borderRight: '1px solid rgba(110,88,58,0.12)' }}
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
                      <div className="flex items-center justify-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={entry?.score ?? ''}
                          onChange={(e) => updateScore(studentId, e.target.value)}
                          placeholder="—"
                          className="score-input"
                        />
                        <span className="dm text-[10px]" style={{ color: '#B4A490' }}>/ 100</span>
                      </div>
                    </div>
                  );
                })}

                {/* Ledger footer rule */}
                <div
                  className="mx-8 mt-4 mb-6 flex items-center gap-3"
                  style={{ borderTop: '1.5px solid rgba(110,88,58,0.15)' }}
                >
                  <span className="dm text-[10px] pt-2" style={{ color: '#B4A490' }}>
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
