'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { usePermissions } from '@/hooks/usePermissions';
import { useTranslations } from '@/i18n/index';
import {
  CalendarDays,
  ListTodo,
  ShieldCheck,
  Plus,
  Trash2,
  Check,
  Clock,
  Flag,
  X,
  CalendarRange,
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGroups, GROUPS_KEYS } from '@/hooks/useGroups';
import { groupService } from '@/services/groups';
import { Skeleton } from '@/components/ui/skeleton';
import type { Group, GroupSchedule } from '@/types/group';

type Tab = 'schedule' | 'todo';
type Priority = 'low' | 'med' | 'high';
type TodoFilter = 'all' | 'active' | 'done';

interface TodoItem {
  id: string;
  text: string;
  priority: Priority;
  done: boolean;
  due?: string;
  created_at: number;
}

const GROUP_COLORS = [
  '#1E2D6E', '#166534', '#92400E', '#7C3AED',
  '#0891B2', '#BE185D', '#15803D', '#B45309',
  '#1D4ED8', '#9333EA', '#0E7490', '#A21CAF',
];

const TODO_KEY = 'bilim_nuru_todos_v1';

export default function SchedulePage() {
  const t = useTranslations('schedule_page');
  const tCommon = useTranslations('common');
  const tGroups = useTranslations('groups');
  const user = useAuthStore((s) => s.user);
  const { isTeacher, isAdmin } = usePermissions();
  const orgId = user?.organization_id;

  const [tab, setTab] = useState<Tab>('schedule');

  const { data: groups, isLoading: groupsLoading } = useGroups();

  const visibleGroups = useMemo<Group[]>(() => {
    if (!groups) return [];
    if (isTeacher) return groups.filter((g) => g.teacher_id === user?.id);
    return groups;
  }, [groups, isTeacher, user?.id]);

  // Fetch schedules for all visible groups
  const scheduleResults = useQueries({
    queries: visibleGroups.map((g) => ({
      queryKey: GROUPS_KEYS.schedule(orgId, g.id),
      queryFn: () => groupService.getSchedule(g.id),
      enabled: !!orgId && !!g.id,
    })),
  });

  const schedulesLoading = scheduleResults.some((r) => r.isLoading);

  type CellEvent = {
    groupId: string;
    groupName: string;
    teacher?: string;
    startTime: string;
    endTime: string;
    minutes: number;
    color: string;
  };

  const eventsByDay = useMemo<Record<number, CellEvent[]>>(() => {
    const map: Record<number, CellEvent[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    visibleGroups.forEach((g, idx) => {
      const slots: GroupSchedule[] | undefined = scheduleResults[idx]?.data;
      if (!slots) return;
      slots.forEach((s) => {
        const [h, m] = s.start_time.split(':').map(Number);
        const endMins = h * 60 + m + s.duration_minutes;
        const endH = Math.floor(endMins / 60);
        const endM = endMins % 60;
        map[s.day_of_week].push({
          groupId: g.id,
          groupName: g.name,
          teacher: g.teacher?.full_name,
          startTime: s.start_time.slice(0, 5),
          endTime: `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`,
          minutes: s.duration_minutes,
          color: GROUP_COLORS[idx % GROUP_COLORS.length],
        });
      });
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.startTime < b.startTime ? -1 : 1)));
    return map;
  }, [visibleGroups, scheduleResults]);

  // Week strip (current week, Monday start)
  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const weekDays = useMemo(() => Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i)), [weekStart]);
  const todayIdx = useMemo(() => {
    const idx = weekDays.findIndex((d) => isSameDay(d, new Date()));
    return idx === -1 ? 0 : idx;
  }, [weekDays]);

  // Stats
  const totalLessons = useMemo(
    () => Object.values(eventsByDay).reduce((a, arr) => a + arr.length, 0),
    [eventsByDay],
  );
  const totalMinutes = useMemo(
    () => Object.values(eventsByDay).reduce((a, arr) => a + arr.reduce((b, e) => b + e.minutes, 0), 0),
    [eventsByDay],
  );

  // ─── Todo state (localStorage) ────────────────────────
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [newText, setNewText] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('med');
  const [newDue, setNewDue] = useState('');
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('all');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TODO_KEY);
      if (raw) setTodos(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(TODO_KEY, JSON.stringify(todos));
  }, [todos, hydrated]);

  const addTodo = () => {
    const text = newText.trim();
    if (!text) return;
    setTodos((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        priority: newPriority,
        done: false,
        due: newDue || undefined,
        created_at: Date.now(),
      },
      ...prev,
    ]);
    setNewText('');
    setNewDue('');
    setNewPriority('med');
  };

  const toggleTodo = (id: string) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeTodo = (id: string) => setTodos((prev) => prev.filter((t) => t.id !== id));

  const filteredTodos = useMemo(() => {
    const sorted = [...todos].sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const order: Record<Priority, number> = { high: 0, med: 1, low: 2 };
      if (order[a.priority] !== order[b.priority]) return order[a.priority] - order[b.priority];
      return b.created_at - a.created_at;
    });
    if (todoFilter === 'all') return sorted;
    if (todoFilter === 'active') return sorted.filter((x) => !x.done);
    return sorted.filter((x) => x.done);
  }, [todos, todoFilter]);

  const todoStats = useMemo(
    () => ({
      total: todos.length,
      done: todos.filter((t) => t.done).length,
      active: todos.filter((t) => !t.done).length,
    }),
    [todos],
  );

  const dayLabels = [t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Mono:ital,wght@0,400;0,500;1,400&display=swap');

        :root {
          --sch-paper: #F4EFE4;
          --sch-sidebar: #1C1917;
          --sch-ink: #1A1410;
          --sch-ink-soft: #8C7B68;
          --sch-ink-faint: #B4A490;
          --sch-line: rgba(110,88,58,0.10);
          --sch-line-strong: rgba(110,88,58,0.15);
          --sch-line-input: rgba(110,88,58,0.18);
          --sch-row-hover: rgba(110,88,58,0.035);
          --sch-row-tint: rgba(110,88,58,0.04);
          --sch-chip: rgba(110,88,58,0.08);
          --sch-chip-ink: #6B5A48;
          --sch-gold: #C4A882;
          --sch-gold-soft: #C4B49A;
          --sch-button: #1E2D6E;
          --sch-button-shadow: rgba(30,45,110,0.30);
          --sch-card: #FAF6EC;
          --sch-shell-border: rgba(110,88,58,0.12);
          --sch-skel: rgba(110,88,58,0.10);
          --sch-today-bg: rgba(196,168,130,0.18);
          --sch-today-ring: rgba(196,168,130,0.55);
        }
        .dark {
          --sch-paper: #0b0a08;
          --sch-sidebar: #050505;
          --sch-ink: #f4efe4;
          --sch-ink-soft: #8C7B68;
          --sch-ink-faint: #6b5c4a;
          --sch-line: rgba(212,196,168,0.10);
          --sch-line-strong: rgba(212,196,168,0.15);
          --sch-line-input: rgba(212,196,168,0.18);
          --sch-row-hover: rgba(212,196,168,0.04);
          --sch-row-tint: rgba(212,196,168,0.04);
          --sch-chip: rgba(212,196,168,0.08);
          --sch-chip-ink: #d4c4a8;
          --sch-gold: #d4b890;
          --sch-gold-soft: #C4B49A;
          --sch-button: #2a3d8f;
          --sch-button-shadow: rgba(42,61,143,0.40);
          --sch-card: #11100d;
          --sch-shell-border: rgba(212,196,168,0.10);
          --sch-skel: rgba(212,196,168,0.08);
          --sch-today-bg: rgba(212,184,144,0.10);
          --sch-today-ring: rgba(212,184,144,0.45);
        }

        .cg { font-family: 'Cormorant Garamond', Georgia, serif; }
        .dm { font-family: 'DM Mono', 'Courier New', monospace; }

        .sch-tab {
          padding: 10px 18px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          border: none;
          background: transparent;
          color: var(--sch-ink-soft);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .sch-tab:hover { color: var(--sch-ink); }
        .sch-tab.active {
          color: var(--sch-ink);
          border-bottom-color: var(--sch-gold);
        }

        .day-card {
          background: var(--sch-card);
          border: 1px solid var(--sch-line-strong);
          border-radius: 14px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          min-height: 240px;
          transition: all 0.2s ease;
        }
        .day-card.today {
          background: var(--sch-today-bg);
          border-color: var(--sch-today-ring);
          box-shadow: 0 4px 18px rgba(196,168,130,0.10);
        }

        .lesson-pill {
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--sch-card);
          border-left: 3px solid;
          margin-bottom: 6px;
          transition: all 0.15s ease;
          cursor: default;
        }
        .lesson-pill:hover { transform: translateX(2px); }

        .todo-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-bottom: 1px solid var(--sch-line);
          transition: background 0.15s ease;
        }
        .todo-item:hover { background: var(--sch-row-hover); }
        .todo-item:last-child { border-bottom: none; }

        .pri-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        @keyframes sch-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sch-animate { animation: sch-in 0.35s ease forwards; }
        .sch-delay { opacity: 0; animation: sch-in 0.3s ease forwards; }
      `}</style>

      <div
        className="rounded-2xl overflow-hidden shadow-xl sch-animate"
        style={{
          minHeight: '78vh',
          border: '1px solid var(--sch-shell-border)',
          background: 'var(--sch-paper)',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────── */}
        <div
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 px-4 sm:px-8 pt-5 pb-0"
          style={{ background: 'var(--sch-paper)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded-lg"
              style={{
                width: 44, height: 44,
                border: '1px solid var(--sch-line-strong)',
                background: 'var(--sch-row-tint)',
                color: 'var(--sch-chip-ink)',
              }}
            >
              {tab === 'schedule' ? (
                <CalendarRange style={{ width: 20, height: 20 }} />
              ) : (
                <ListTodo style={{ width: 20, height: 20 }} />
              )}
            </div>
            <div>
              <p className="dm text-[10px] tracking-[0.18em] uppercase" style={{ color: 'var(--sch-ink-soft)' }}>
                BILIM NURU
              </p>
              <h1
                className="cg leading-none mt-0.5"
                style={{ fontSize: 28, fontWeight: 700, color: 'var(--sch-ink)', letterSpacing: '-0.02em' }}
              >
                {tab === 'schedule' ? t('title') : t('todo_title')}
              </h1>
            </div>
            {isAdmin && (
              <span
                className="hidden sm:inline-flex items-center gap-1 dm text-[9px] tracking-widest uppercase ml-2"
                style={{
                  color: 'var(--sch-ink-soft)',
                  background: 'var(--sch-chip)',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                <ShieldCheck style={{ width: 9, height: 9 }} />
                {t('admin_view')}
              </span>
            )}
          </div>

          {tab === 'schedule' && !schedulesLoading && (
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="dm text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--sch-ink-soft)' }}>
                  {t('total_lessons')}
                </p>
                <p className="cg" style={{ fontSize: 22, fontWeight: 700, color: 'var(--sch-ink)', lineHeight: 1 }}>
                  {totalLessons}
                </p>
              </div>
              <div>
                <p className="dm text-[10px] uppercase tracking-[0.1em]" style={{ color: 'var(--sch-ink-soft)' }}>
                  {t('total_hours')}
                </p>
                <p className="cg" style={{ fontSize: 22, fontWeight: 700, color: 'var(--sch-ink)', lineHeight: 1 }}>
                  {(totalMinutes / 60).toFixed(1)}h
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── TABS ────────────────────────────────────────── */}
        <div
          className="flex items-center gap-1 px-4 sm:px-8 mt-4"
          style={{ borderBottom: '1px solid var(--sch-line-strong)' }}
        >
          <button
            className={cn('sch-tab dm', tab === 'schedule' && 'active')}
            onClick={() => setTab('schedule')}
          >
            <CalendarDays style={{ width: 14, height: 14 }} />
            {t('tab_schedule')}
          </button>
          <button
            className={cn('sch-tab dm', tab === 'todo' && 'active')}
            onClick={() => setTab('todo')}
          >
            <ListTodo style={{ width: 14, height: 14 }} />
            {t('tab_todo')}
            {todoStats.active > 0 && (
              <span
                className="dm text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--sch-button)', color: '#fff' }}
              >
                {todoStats.active}
              </span>
            )}
          </button>
        </div>

        {/* ── BODY ────────────────────────────────────────── */}
        <div className="p-4 sm:p-6">
          {tab === 'schedule' ? (
            groupsLoading || schedulesLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={i} className="h-60 rounded-2xl" style={{ background: 'var(--sch-skel)' }} />
                ))}
              </div>
            ) : visibleGroups.length === 0 ? (
              <EmptyState
                title={tCommon('no_data')}
                hint={isTeacher ? t('teacher_no_groups') : t('no_groups')}
              />
            ) : (
              <>
                {/* Group legend */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {visibleGroups.map((g, i) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center gap-1.5 dm text-[10px] px-2 py-1 rounded-md"
                      style={{
                        background: 'var(--sch-card)',
                        border: '1px solid var(--sch-line-strong)',
                        color: 'var(--sch-ink)',
                      }}
                    >
                      <span
                        className="size-2 rounded-sm"
                        style={{ background: GROUP_COLORS[i % GROUP_COLORS.length] }}
                      />
                      {g.name}
                    </span>
                  ))}
                </div>

                {/* Weekly grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
                  {weekDays.map((d, dayIdx) => {
                    const dow = d.getDay(); // 0 Sun .. 6 Sat
                    const events = eventsByDay[dow] ?? [];
                    const isToday = dayIdx === todayIdx;
                    return (
                      <div
                        key={dayIdx}
                        className={cn('day-card sch-delay', isToday && 'today')}
                        style={{ animationDelay: `${dayIdx * 40}ms` }}
                      >
                        <div className="flex items-baseline justify-between mb-3">
                          <div>
                            <p
                              className="dm text-[10px] tracking-[0.1em] uppercase"
                              style={{ color: 'var(--sch-ink-soft)' }}
                            >
                              {dayLabels[(dow + 6) % 7]}
                            </p>
                            <p
                              className="cg leading-none mt-1"
                              style={{ fontSize: 22, fontWeight: 700, color: 'var(--sch-ink)' }}
                            >
                              {format(d, 'dd')}
                              <span
                                className="dm text-[10px] ml-1"
                                style={{ color: 'var(--sch-ink-soft)' }}
                              >
                                {format(d, 'MMM')}
                              </span>
                            </p>
                          </div>
                          {isToday && (
                            <span
                              className="dm text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded"
                              style={{
                                background: 'var(--sch-gold)',
                                color: '#1A1410',
                              }}
                            >
                              {t('today')}
                            </span>
                          )}
                        </div>

                        {events.length === 0 ? (
                          <div
                            className="flex-1 flex items-center justify-center dm text-[10px]"
                            style={{ color: 'var(--sch-ink-faint)' }}
                          >
                            —
                          </div>
                        ) : (
                          <div className="flex-1">
                            {events.map((e, i) => (
                              <div
                                key={`${e.groupId}-${i}`}
                                className="lesson-pill"
                                style={{ borderLeftColor: e.color }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span
                                    className="dm font-bold tabular-nums"
                                    style={{ fontSize: 12, color: 'var(--sch-ink)' }}
                                  >
                                    {e.startTime}
                                  </span>
                                  <span
                                    className="dm text-[9px]"
                                    style={{ color: 'var(--sch-ink-soft)' }}
                                  >
                                    {e.minutes}m
                                  </span>
                                </div>
                                <p
                                  className="font-semibold truncate"
                                  style={{ fontSize: 12, color: 'var(--sch-ink)' }}
                                  title={e.groupName}
                                >
                                  {e.groupName}
                                </p>
                                {e.teacher && (
                                  <p
                                    className="dm text-[10px] truncate"
                                    style={{ color: 'var(--sch-ink-soft)' }}
                                  >
                                    {e.teacher}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )
          ) : (
            // ── TODO TAB ───────────────────────────────────
            <div className="flex flex-col gap-4 max-w-3xl mx-auto">
              {/* Add form */}
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--sch-card)', border: '1px solid var(--sch-line-strong)' }}
              >
                <input
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                  placeholder={t('todo_placeholder')}
                  className="w-full bg-transparent outline-none cg"
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: 'var(--sch-ink)',
                    borderBottom: '1px solid var(--sch-line)',
                    paddingBottom: 8,
                  }}
                />
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    className="flex rounded-md overflow-hidden"
                    style={{ border: '1px solid var(--sch-line-input)' }}
                  >
                    {(['low', 'med', 'high'] as Priority[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewPriority(p)}
                        className="dm text-[10px] px-2.5 py-1.5 uppercase tracking-wider"
                        style={{
                          background:
                            newPriority === p ? priorityColor(p) : 'transparent',
                          color: newPriority === p ? '#fff' : 'var(--sch-ink-soft)',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                      >
                        {t(`priority_${p}`)}
                      </button>
                    ))}
                  </div>
                  <input
                    type="date"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="dm text-[11px] px-2 py-1.5 rounded-md outline-none"
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--sch-line-input)',
                      color: 'var(--sch-ink)',
                    }}
                  />
                  <button
                    onClick={addTodo}
                    disabled={!newText.trim()}
                    className="ml-auto dm text-[11px] uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold"
                    style={{
                      background: !newText.trim() ? 'var(--sch-chip)' : 'var(--sch-button)',
                      color: !newText.trim() ? 'var(--sch-ink-faint)' : '#fff',
                      border: 'none',
                      cursor: !newText.trim() ? 'not-allowed' : 'pointer',
                      boxShadow: !newText.trim() ? 'none' : '0 2px 8px var(--sch-button-shadow)',
                    }}
                  >
                    <Plus style={{ width: 12, height: 12 }} />
                    {t('add')}
                  </button>
                </div>
              </div>

              {/* Stats + filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 dm text-[11px]" style={{ color: 'var(--sch-ink-soft)' }}>
                  <span>{t('todo_total')}: <b style={{ color: 'var(--sch-ink)' }}>{todoStats.total}</b></span>
                  <span>·</span>
                  <span>{t('todo_active')}: <b style={{ color: 'var(--sch-ink)' }}>{todoStats.active}</b></span>
                  <span>·</span>
                  <span>{t('todo_done')}: <b style={{ color: 'var(--sch-ink)' }}>{todoStats.done}</b></span>
                </div>
                <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--sch-line-input)' }}>
                  {(['all', 'active', 'done'] as TodoFilter[]).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTodoFilter(f)}
                      className="dm text-[10px] px-3 py-1.5 uppercase tracking-wider"
                      style={{
                        background: todoFilter === f ? 'var(--sch-button)' : 'transparent',
                        color: todoFilter === f ? '#fff' : 'var(--sch-ink-soft)',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 700,
                      }}
                    >
                      {t(`filter_${f}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* List */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--sch-card)', border: '1px solid var(--sch-line-strong)' }}
              >
                {!hydrated ? (
                  <div className="p-4 space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-10 rounded" style={{ background: 'var(--sch-skel)' }} />
                    ))}
                  </div>
                ) : filteredTodos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <ListTodo
                      style={{
                        width: 40, height: 40,
                        opacity: 0.25,
                        marginBottom: 8,
                        color: 'var(--sch-gold-soft)',
                      }}
                    />
                    <p className="cg font-semibold" style={{ fontSize: 18, color: 'var(--sch-ink-soft)' }}>
                      {t('todo_empty')}
                    </p>
                    <p className="dm text-[11px] mt-1" style={{ color: 'var(--sch-ink-faint)' }}>
                      {t('todo_empty_hint')}
                    </p>
                  </div>
                ) : (
                  filteredTodos.map((todo, idx) => (
                    <div
                      key={todo.id}
                      className="todo-item sch-delay"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      <button
                        onClick={() => toggleTodo(todo.id)}
                        aria-label="toggle"
                        style={{
                          width: 22, height: 22,
                          borderRadius: 6,
                          border: `1.5px solid ${todo.done ? '#166534' : 'var(--sch-line-input)'}`,
                          background: todo.done ? '#166534' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        {todo.done && <Check style={{ width: 14, height: 14, color: '#fff' }} />}
                      </button>

                      <span className="pri-dot" style={{ background: priorityColor(todo.priority) }} />

                      <div className="flex-1 min-w-0">
                        <p
                          className="truncate"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: todo.done ? 'var(--sch-ink-faint)' : 'var(--sch-ink)',
                            textDecoration: todo.done ? 'line-through' : 'none',
                          }}
                        >
                          {todo.text}
                        </p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span
                            className="dm text-[10px] uppercase tracking-wider inline-flex items-center gap-1"
                            style={{ color: priorityColor(todo.priority) }}
                          >
                            <Flag style={{ width: 9, height: 9 }} />
                            {t(`priority_${todo.priority}`)}
                          </span>
                          {todo.due && (
                            <span
                              className="dm text-[10px] inline-flex items-center gap-1"
                              style={{ color: 'var(--sch-ink-soft)' }}
                            >
                              <Clock style={{ width: 9, height: 9 }} />
                              {format(new Date(todo.due), 'dd MMM')}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => removeTodo(todo.id)}
                        aria-label="delete"
                        style={{
                          width: 26, height: 26,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 6,
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--sch-ink-faint)',
                          cursor: 'pointer',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#991B1B')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--sch-ink-faint)')}
                      >
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Clear done */}
              {todoStats.done > 0 && (
                <button
                  onClick={() => setTodos((p) => p.filter((t) => !t.done))}
                  className="dm text-[10px] uppercase tracking-widest self-end inline-flex items-center gap-1 px-2 py-1 rounded"
                  style={{
                    color: 'var(--sch-ink-soft)',
                    background: 'transparent',
                    border: '1px solid var(--sch-line-input)',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 10, height: 10 }} />
                  {t('clear_done')}
                </button>
              )}

              {/* Suppress unused warning for tGroups (kept for future use) */}
              <span className="hidden">{tGroups('schedule')}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function priorityColor(p: Priority) {
  if (p === 'high') return '#991B1B';
  if (p === 'med') return '#92400E';
  return '#166534';
}

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <CalendarDays
        style={{
          width: 44, height: 44,
          opacity: 0.25,
          marginBottom: 12,
          color: 'var(--sch-gold-soft)',
        }}
      />
      <p className="cg font-semibold" style={{ fontSize: 20, color: 'var(--sch-ink-soft)' }}>
        {title}
      </p>
      <p className="dm text-[11px] mt-1" style={{ color: 'var(--sch-ink-faint)' }}>
        {hint}
      </p>
    </div>
  );
}
