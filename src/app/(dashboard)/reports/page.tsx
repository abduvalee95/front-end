'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Users, UserCheck,
  Calendar, Target, Activity,
  GraduationCap, Wallet, PieChart, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import { ReportsTabBar, computeRange, type ReportsTab, type Preset, type FilterMode } from '@/components/reports/ReportsTabBar';

function fmtMoney(n: number) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' сом'; }
function fmtShortDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' })}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const t = useTranslations('reports');
  const chart = useChartTheme();
  const [activeTab, setActiveTab]       = useState<ReportsTab>('finance');
  const [filterMode, setFilterMode]     = useState<FilterMode>('preset');
  const [preset, setPreset]             = useState<Preset>('30d');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek]   = useState('');

  const range = computeRange(filterMode, preset, selectedMonth, selectedWeek);
  const rangeKey = `${filterMode}:${preset}:${selectedMonth}:${selectedWeek}`;
  const rangeParams = { from: range.from, to: range.to };

  const summaryQ = useQuery({
    queryKey: ['reports', 'summary', rangeKey],
    queryFn: () => analyticsService.getDashboardSummary(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const financeQ = useQuery({
    queryKey: ['reports', 'finance', rangeKey],
    queryFn: () => analyticsService.getFinanceReport(rangeParams),
    staleTime: 1000 * 60 * 3,
    retry: false,
  });

  const payByDayQ = useQuery({
    queryKey: ['reports', 'pay-by-day', rangeKey],
    queryFn: () => analyticsService.getPaymentsByDay(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const payByMethodQ = useQuery({
    queryKey: ['reports', 'pay-by-method', rangeKey],
    queryFn: () => analyticsService.getPaymentsByMethod(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const leadsQ = useQuery({
    queryKey: ['reports', 'leads', rangeKey],
    queryFn: () => analyticsService.getLeadsByStatus(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const s = summaryQ.data;
  const fin = financeQ.data;

  // ─── Chart data ─────────────────────────────────────────────────────────────
  const revenueChartData = (payByDayQ.data ?? []).map((d) => ({
    date: fmtShortDate(d.day),
    amount: parseFloat(d.totalAmount),
    count: d.count,
  }));

  const methodChartData = (payByMethodQ.data ?? [])
    .filter((m) => m.method !== null)
    .map((m) => ({
      name: m.method ?? 'Other',
      value: parseFloat(m.totalAmount),
      count: m.count,
    }));

  const expenseChartData = (fin?.expenseByCategory ?? []).map((e) => ({
    name: e.category,
    value: e.total,
    count: e.count,
  }));

  const leadChartData = (leadsQ.data ?? []).map((l) => ({
    status: l.status,
    name: t(`lead_${l.status.toLowerCase()}` as Parameters<typeof t>[0]),
    count: l.count,
  }));

  return (
    <div className="space-y-0">
      {/* ── Sticky tab bar (isolated component) ── */}
      <ReportsTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filterMode={filterMode}
        onFilterModeChange={setFilterMode}
        preset={preset}
        onPresetChange={setPreset}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        dateFrom={range.from}
        dateTo={range.to}
      />

      {/* ══ FINANCE TAB ══════════════════════════════════════════════════════ */}
      {activeTab === 'finance' && (
        <div className="mt-6 space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label={t('total_income')}
              value={fin ? fmtMoney(fin.summary.totalIncome) : '—'}
              hint={`${fin?.summary.paymentCount ?? '—'} ${t('payments')}`}
              tone="success"
              isLoading={financeQ.isLoading}
            />
            <StatCard
              icon={TrendingDown}
              label={t('total_expenses')}
              value={fin ? fmtMoney(fin.summary.totalExpenses) : '—'}
              hint={`${fin?.summary.expenseCount ?? '—'} ${t('expenses')}`}
              tone="danger"
              isLoading={financeQ.isLoading}
            />
            <StatCard
              icon={TrendingUp}
              label={t('profit')}
              value={fin ? fmtMoney(fin.summary.profit) : '—'}
              tone={fin && fin.summary.profit >= 0 ? 'primary' : 'danger'}
              isLoading={financeQ.isLoading}
            />
            <StatCard
              icon={Users}
              label={t('students_active')}
              value={s?.studentsActive ?? '—'}
              hint={`${t('of')} ${s?.studentsTotal ?? '—'} ${t('students_total_short')}`}
              tone="primary"
              isLoading={summaryQ.isLoading}
            />
          </div>

          {/* Revenue chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-h4">{t('revenue_by_day')}</CardTitle>
              <CardDescription className="text-caption">{t('daily_payments_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {payByDayQ.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : revenueChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-body text-muted-foreground">{t('no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={seriesColor(chart, 1)} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={seriesColor(chart, 1)} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: chart.axis }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: chart.axis }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      formatter={(v) => [fmtMoney(Number(v)), t('amount')]}
                      contentStyle={chart.tooltip}
                    />
                    <Area type="monotone" dataKey="amount" stroke={seriesColor(chart, 1)} strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment method breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-h4 flex items-center gap-2">
                  <PieChart className="size-4" />{t('income_by_method')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payByMethodQ.isLoading ? <Skeleton className="h-44 w-full rounded-xl" /> : (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <RePieChart>
                        <Pie data={methodChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                          {methodChartData.map((_, i) => (
                            <Cell key={i} fill={seriesColor(chart, i)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmtMoney(Number(v))} contentStyle={chart.tooltip} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {methodChartData.map((m, i) => (
                        <div key={m.name} className="flex items-center justify-between text-caption">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full" style={{ background: seriesColor(chart, i) }} />
                            {m.name}
                          </span>
                          <span className="font-semibold tabular-nums">{fmtMoney(m.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Expense by category */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-h4 flex items-center gap-2">
                  <BarChart3 className="size-4" />{t('expenses_by_category')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financeQ.isLoading ? <Skeleton className="h-44 w-full rounded-xl" /> :
                  expenseChartData.length === 0 ? (
                    <div className="flex h-44 items-center justify-center text-body text-muted-foreground">{t('no_data')}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={expenseChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                        <Tooltip formatter={(v) => [fmtMoney(Number(v)), t('amount')]} contentStyle={chart.tooltip} />
                        <Bar dataKey="value" fill={seriesColor(chart, 3)} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Finance summary row */}
          {fin && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Card className="border-success/60 dark:border-success/20">
                <CardContent className="p-4 text-center">
                  <p className="text-caption font-semibold uppercase tracking-wider text-success-emphasis/70">{t('total_income')}</p>
                  <p className="mt-1 text-h2 tabular-nums text-success-emphasis">{fmtMoney(fin.summary.totalIncome)}</p>
                </CardContent>
              </Card>
              <Card className="border-danger/60 dark:border-danger/20">
                <CardContent className="p-4 text-center">
                  <p className="text-caption font-semibold uppercase tracking-wider text-danger-emphasis/70">{t('total_expenses')}</p>
                  <p className="mt-1 text-h2 tabular-nums text-danger-emphasis">{fmtMoney(fin.summary.totalExpenses)}</p>
                </CardContent>
              </Card>
              <Card className={cn('col-span-2 sm:col-span-1', fin.summary.profit >= 0 ? 'border-primary/60 dark:border-primary/20' : 'border-danger/60 dark:border-danger/20')}>
                <CardContent className="p-4 text-center">
                  <p className={cn('text-caption font-semibold uppercase tracking-wider', fin.summary.profit >= 0 ? 'text-primary-emphasis/70' : 'text-danger-emphasis/70')}>{t('profit')}</p>
                  <p className={cn('mt-1 text-h2 tabular-nums', fin.summary.profit >= 0 ? 'text-primary-emphasis' : 'text-danger-emphasis')}>{fmtMoney(fin.summary.profit)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ══ STUDENTS TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label={t('students_total')} value={s?.studentsTotal ?? '—'} tone="primary" isLoading={summaryQ.isLoading} />
            <StatCard icon={UserCheck} label={t('students_active')} value={s?.studentsActive ?? '—'} tone="success" isLoading={summaryQ.isLoading} />
            <StatCard icon={GraduationCap} label={t('enrollments')} value={s?.enrollmentsTotal ?? '—'} tone="primary" isLoading={summaryQ.isLoading} />
            <StatCard icon={Activity} label={t('attendance_rate')} value={s ? `${s.attendanceRate}%` : '—'} tone="warning" isLoading={summaryQ.isLoading} />
          </div>

          {/* Attendance breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-h4">{t('attendance_breakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryQ.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : s ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-body">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-success" />
                      {t('attendance_present')}
                    </span>
                    <span className="font-bold tabular-nums">{s.attendancePresent}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-success transition-all"
                      style={{ width: `${s.attendancePresent + s.attendanceAbsent > 0 ? (s.attendancePresent / (s.attendancePresent + s.attendanceAbsent)) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-body">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-danger" />
                      {t('attendance_absent')}
                    </span>
                    <span className="font-bold tabular-nums">{s.attendanceAbsent}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-2 text-caption text-muted-foreground">
                    <span>{t('total_records')}: {s.attendancePresent + s.attendanceAbsent}</span>
                    <Badge variant="outline" className={cn('rounded-full font-bold', s.attendanceRate >= 80 ? 'border-success/70 bg-success-muted text-success-emphasis dark:bg-success/10 dark:text-success-emphasis' : 'border-warning/70 bg-warning-muted text-warning-emphasis dark:bg-warning/10 dark:text-warning-emphasis')}>
                      {s.attendanceRate}% {t('attendance_rate')}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-body text-muted-foreground">{t('no_data')}</div>
              )}
            </CardContent>
          </Card>

          {/* Courses & Groups */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary-muted text-primary-emphasis dark:bg-primary/10 dark:text-primary-emphasis">
                  <BarChart3 className="size-6" />
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">{t('groups_total')}</p>
                  {summaryQ.isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : (
                    <p className="mt-0.5 text-h1 text-foreground">{s?.groupsTotal ?? '—'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary-muted text-primary-emphasis dark:bg-primary/10 dark:text-primary-emphasis">
                  <Calendar className="size-6" />
                </div>
                <div>
                  <p className="text-caption text-muted-foreground">{t('courses_total')}</p>
                  {summaryQ.isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : (
                    <p className="mt-0.5 text-h1 text-foreground">{s?.coursesTotal ?? '—'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ══ LEADS TAB ═══════════════════════════════════════════════════════ */}
      {activeTab === 'leads' && (
        <div className="mt-6 space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['NEW', 'CONTACTED', 'CONVERTED', 'LOST'] as const).map((status) => {
              const tones = { NEW: 'primary', CONTACTED: 'warning', CONVERTED: 'success', LOST: 'danger' } as const;
              const icons = { NEW: Target, CONTACTED: RefreshCw, CONVERTED: UserCheck, LOST: TrendingDown };
              const count = leadsQ.data?.find((l) => l.status === status)?.count ?? 0;
              return (
                <StatCard
                  key={status}
                  icon={icons[status]}
                  label={t(`lead_${status.toLowerCase()}`)}
                  value={count}
                  tone={tones[status]}
                  isLoading={leadsQ.isLoading}
                />
              );
            })}
          </div>

          {/* Leads bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-h4">{t('leads_by_status')}</CardTitle>
            </CardHeader>
            <CardContent>
              {leadsQ.isLoading ? <Skeleton className="h-52 w-full rounded-xl" /> : leadChartData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-body text-muted-foreground">{t('no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={leadChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chart.grid} />
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: chart.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chart.tooltip} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {leadChartData.map((entry, i) => {
                        const seriesIdx: Record<string, number> = { NEW: 0, CONTACTED: 2, CONVERTED: 1, LOST: 3 };
                        return <Cell key={i} fill={seriesColor(chart, seriesIdx[entry.status] ?? 5)} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Lead funnel summary */}
          {leadsQ.data && leadsQ.data.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-h4">{t('conversion_summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const total = leadsQ.data!.reduce((acc, l) => acc + l.count, 0);
                  const converted = leadsQ.data!.find((l) => l.status === 'CONVERTED')?.count ?? 0;
                  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-body">
                        <span className="text-muted-foreground">{t('total_leads')}</span>
                        <span className="font-bold">{total}</span>
                      </div>
                      <div className="flex items-center justify-between text-body">
                        <span className="text-muted-foreground">{t('conversion_rate')}</span>
                        <Badge variant="outline" className={cn('rounded-full font-bold', convRate >= 30 ? 'border-success/70 bg-success-muted text-success-emphasis dark:bg-success/10 dark:text-success-emphasis' : 'border-warning/70 bg-warning-muted text-warning-emphasis dark:bg-warning/10 dark:text-warning-emphasis')}>
                          {convRate}%
                        </Badge>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
