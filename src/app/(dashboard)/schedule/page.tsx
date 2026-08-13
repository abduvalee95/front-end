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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { TONE_FILL, TONE_INK, TONE_SURFACE, type Tone } from '@/components/ui/tone';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';
import type { LucideIcon } from 'lucide-react';
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

const TODO_KEY = 'bilim_nuru_todos_v1';

export default function SchedulePage() {
  const t = useTranslations('schedule_page');
  const tCommon = useTranslations('common');
  const tGroups = useTranslations('groups');
  const user = useAuthStore((s) => s.user);
  const { isTeacher, isAdmin } = usePermissions();
  const orgId = user?.organization_id;

  const [tab, setTab] = useState<Tab>('schedule');
  const chart = useChartTheme();

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
          color: seriesColor(chart, idx),
        });
      });
    });
    Object.values(map).forEach((arr) => arr.sort((a, b) => (a.startTime < b.startTime ? -1 : 1)));
    return map;
  }, [visibleGroups, scheduleResults, chart]);

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
    <div className="space-y-5 ds-enter">
      <PageHeader
        icon={tab === 'schedule' ? CalendarRange : ListTodo}
        title={tab === 'schedule' ? t('title') : t('todo_title')}
        subtitle={tab === 'schedule' ? t('subtitle') : t('todo_subtitle')}
        actions={
          isAdmin ? (
            <Badge variant="primary" className="gap-1.5">
              <ShieldCheck className="size-3" aria-hidden="true" />
              {t('admin_view')}
            </Badge>
          ) : undefined
        }
        stats={
          tab === 'schedule' && !schedulesLoading
            ? [
                { label: t('total_lessons'), value: totalLessons, icon: CalendarDays, tone: 'primary' },
                { label: t('total_hours'), value: `${(totalMinutes / 60).toFixed(1)}h`, icon: Clock, tone: 'neutral' },
              ]
            : undefined
        }
      />

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 border-b border-border" role="tablist">
        {([
          { id: 'schedule' as Tab, icon: CalendarDays, label: t('tab_schedule'), count: 0 },
          { id: 'todo' as Tab, icon: ListTodo, label: t('tab_todo'), count: todoStats.active },
        ]).map(({ id, icon: Icon, label, count }) => {
          const isActive = tab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(id)}
              className={cn(
                'relative flex h-11 items-center gap-2 px-4 text-body-sm font-medium transition-colors',
                'after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-t-full after:bg-primary after:transition-transform after:duration-200',
                isActive
                  ? 'text-primary after:scale-x-100'
                  : 'text-muted-foreground hover:text-foreground after:scale-x-0',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
              {count > 0 && <Badge variant="primary" className="tabular-nums">{count}</Badge>}
            </button>
          );
        })}
      </div>

      {/* ── Schedule tab ───────────────────────────────────────────────── */}
      {tab === 'schedule' ? (
        groupsLoading || schedulesLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-60 rounded-card" />
            ))}
          </div>
        ) : visibleGroups.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title={tCommon('no_data')}
            hint={isTeacher ? t('teacher_no_groups') : t('no_groups')}
          />
        ) : (
          <>
            {/* Group legend — each group keeps a stable slot in the chart ramp */}
            <div className="flex flex-wrap gap-2">
              {visibleGroups.map((g, i) => (
                <span
                  key={g.id}
                  className="inline-flex items-center gap-1.5 rounded-control border border-border bg-card px-2 py-1 text-caption text-foreground"
                >
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: seriesColor(chart, i) }}
                    aria-hidden
                  />
                  {g.name}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
              {weekDays.map((d, dayIdx) => {
                const dow = d.getDay(); // 0 Sun .. 6 Sat
                const events = eventsByDay[dow] ?? [];
                const isToday = dayIdx === todayIdx;
                return (
                  <Card
                    key={dayIdx}
                    size="sm"
                    className={cn('ds-enter-delayed min-h-52', isToday && 'border-primary/50 ring-1 ring-primary/30')}
                    style={{ animationDelay: `${dayIdx * 40}ms` }}
                  >
                    <div className="flex items-baseline justify-between px-3">
                      <div>
                        <p className="text-caption text-muted-foreground">{dayLabels[(dow + 6) % 7]}</p>
                        <p className="mt-0.5 text-h2 tabular-nums text-foreground">
                          {format(d, 'dd')}
                          <span className="ml-1 text-caption font-normal text-muted-foreground">
                            {format(d, 'MMM')}
                          </span>
                        </p>
                      </div>
                      {isToday && <Badge variant="primary">{t('today')}</Badge>}
                    </div>

                    {events.length === 0 ? (
                      <p className="flex flex-1 items-center justify-center text-body-sm text-muted-foreground">—</p>
                    ) : (
                      <div className="flex flex-col gap-2 px-3">
                        {events.map((e, i) => (
                          <div
                            key={`${e.groupId}-${i}`}
                            className="rounded-control border-l-2 bg-muted/60 px-2.5 py-2"
                            style={{ borderLeftColor: e.color }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-h4 tabular-nums text-foreground">{e.startTime}</span>
                              <span className="text-caption font-normal text-muted-foreground">{e.minutes}m</span>
                            </div>
                            <p className="truncate text-body-sm font-medium text-foreground" title={e.groupName}>
                              {e.groupName}
                            </p>
                            {e.teacher && (
                              <p className="truncate text-caption font-normal text-muted-foreground">{e.teacher}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </>
        )
      ) : (
        /* ── To-do tab ─────────────────────────────────────────────────── */
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <Card>
            <div className="px-4">
              <Input
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                placeholder={t('todo_placeholder')}
                aria-label={t('todo_placeholder')}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 px-4">
              <div className="flex items-center rounded-control border border-border bg-muted p-0.5">
                {(['low', 'med', 'high'] as Priority[]).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={newPriority === p ? 'primary' : 'ghost'}
                    aria-pressed={newPriority === p}
                    onClick={() => setNewPriority(p)}
                  >
                    {t(`priority_${p}`)}
                  </Button>
                ))}
              </div>
              <Input
                type="date"
                value={newDue}
                onChange={(e) => setNewDue(e.target.value)}
                aria-label={t('todo_due')}
                className="w-auto"
              />
              <Button className="ml-auto" size="sm" disabled={!newText.trim()} onClick={addTodo}>
                <Plus className="size-4" />
                {t('add')}
              </Button>
            </div>
          </Card>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <span>{t('todo_total')}: <b className="tabular-nums text-foreground">{todoStats.total}</b></span>
              <span aria-hidden>·</span>
              <span>{t('todo_active')}: <b className="tabular-nums text-foreground">{todoStats.active}</b></span>
              <span aria-hidden>·</span>
              <span>{t('todo_done')}: <b className="tabular-nums text-foreground">{todoStats.done}</b></span>
            </p>
            <div className="flex items-center rounded-control border border-border bg-muted p-0.5">
              {(['all', 'active', 'done'] as TodoFilter[]).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={todoFilter === f ? 'primary' : 'ghost'}
                  aria-pressed={todoFilter === f}
                  onClick={() => setTodoFilter(f)}
                >
                  {t(`filter_${f}`)}
                </Button>
              ))}
            </div>
          </div>

          <Card className="gap-0 py-0">
            {!hydrated ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-control" />
                ))}
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center gap-1 py-12">
                <ListTodo className="mb-2 size-9 text-muted-foreground" aria-hidden="true" />
                <p className="text-h3 text-foreground">{t('todo_empty')}</p>
                <p className="text-body-sm text-muted-foreground">{t('todo_empty_hint')}</p>
              </div>
            ) : (
              filteredTodos.map((todo, idx) => (
                <div
                  key={todo.id}
                  className="ds-enter-delayed flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <button
                    type="button"
                    onClick={() => toggleTodo(todo.id)}
                    role="checkbox"
                    aria-checked={todo.done}
                    aria-label={todo.text}
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-control border transition-colors',
                      todo.done
                        ? 'border-success bg-success text-success-foreground'
                        : 'border-border hover:border-primary',
                    )}
                  >
                    {todo.done && <Check className="size-3.5" aria-hidden="true" />}
                  </button>

                  <span
                    className={cn('size-2 shrink-0 rounded-full', TONE_FILL[PRIORITY_TONES[todo.priority]])}
                    aria-hidden
                  />

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'truncate text-h4',
                        todo.done ? 'text-muted-foreground line-through' : 'text-foreground',
                      )}
                    >
                      {todo.text}
                    </p>
                    <div className="mt-0.5 flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-caption',
                          TONE_INK[PRIORITY_TONES[todo.priority]],
                        )}
                      >
                        <Flag className="size-3" aria-hidden="true" />
                        {t(`priority_${todo.priority}`)}
                      </span>
                      {todo.due && (
                        <span className="inline-flex items-center gap-1 text-caption font-normal text-muted-foreground">
                          <Clock className="size-3" aria-hidden="true" />
                          {format(new Date(todo.due), 'dd MMM')}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`${tCommon('delete')} — ${todo.text}`}
                    onClick={() => removeTodo(todo.id)}
                    className="hover:text-danger-emphasis"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </Card>

          {todoStats.done > 0 && (
            <Button
              variant="secondary"
              size="sm"
              className="self-end"
              onClick={() => setTodos((p) => p.filter((x) => !x.done))}
            >
              <X className="size-4" />
              {t('clear_done')}
            </Button>
          )}

          {/* Suppress unused warning for tGroups (kept for future use) */}
          <span className="hidden">{tGroups('schedule')}</span>
        </div>
      )}
    </div>
  );
}

/** Priority maps onto semantic tones — no priority-specific colours. */
const PRIORITY_TONES: Record<Priority, Tone> = {
  high: 'danger',
  med: 'warning',
  low: 'success',
};

function EmptyState({ icon: Icon, title, hint }: { icon: LucideIcon; title: string; hint: string }) {
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
