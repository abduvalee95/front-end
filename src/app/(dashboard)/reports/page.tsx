'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, TrendingDown, Users, UserCheck,
  DollarSign, FileDown, Calendar, Target, Activity,
  GraduationCap, Wallet, PieChart, RefreshCw,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { subDays, startOfMonth, endOfDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { analyticsService } from '@/services/analytics';
import { exportToExcel } from '@/lib/excel';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import { ReportsTabBar, type ReportsTab, type Preset } from '@/components/reports/ReportsTabBar';

// ─── Date range ───────────────────────────────────────────────────────────────
function presetRange(p: Preset) {
  const now = new Date();
  const to = endOfDay(now);
  switch (p) {
    case '7d': return { from: subDays(now, 6), to };
    case '30d': return { from: subDays(now, 29), to };
    case '90d': return { from: subDays(now, 89), to };
    case 'mtd': return { from: startOfMonth(now), to };
  }
}

function fmtDate(d: Date) { return d.toISOString().slice(0, 10); }
function fmtMoney(n: number) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' сом'; }
function fmtShortDate(s: string) {
  const d = new Date(s);
  return `${d.getDate()} ${d.toLocaleString('ru', { month: 'short' })}`;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon: Icon, label, value, sub, color = 'blue', loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'violet';
  loading?: boolean;
}) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    emerald:'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose:   'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    amber:  'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', colors[color])}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted-foreground truncate">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-24" />
            ) : (
              <p className="mt-0.5 text-2xl font-black tabular-nums text-foreground">{value}</p>
            )}
            {sub && !loading && (
              <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const t = useTranslations('reports');
  const [activeTab, setActiveTab] = useState<ReportsTab>('finance');
  const [preset, setPreset] = useState<Preset>('30d');
  const range = presetRange(preset);
  const rangeParams = { from: range.from, to: range.to };

  const summaryQ = useQuery({
    queryKey: ['reports', 'summary', preset],
    queryFn: () => analyticsService.getDashboardSummary(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const financeQ = useQuery({
    queryKey: ['reports', 'finance', preset],
    queryFn: () => analyticsService.getFinanceReport(rangeParams),
    staleTime: 1000 * 60 * 3,
    retry: false,
  });

  const payByDayQ = useQuery({
    queryKey: ['reports', 'pay-by-day', preset],
    queryFn: () => analyticsService.getPaymentsByDay(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const payByMethodQ = useQuery({
    queryKey: ['reports', 'pay-by-method', preset],
    queryFn: () => analyticsService.getPaymentsByMethod(rangeParams),
    staleTime: 1000 * 60 * 3,
  });

  const leadsQ = useQuery({
    queryKey: ['reports', 'leads', preset],
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
    name: l.status,
    count: l.count,
  }));

  // ─── Export helpers ──────────────────────────────────────────────────────────
  const exportFinance = async () => {
    if (!fin) return;
    await exportToExcel(
      [
        { Metric: t('total_income'), Value: fin.summary.totalIncome, Currency: 'KGS' },
        { Metric: t('total_expenses'), Value: fin.summary.totalExpenses, Currency: 'KGS' },
        { Metric: t('profit'), Value: fin.summary.profit, Currency: 'KGS' },
        { Metric: t('payment_count'), Value: fin.summary.paymentCount, Currency: '' },
        { Metric: t('expense_count'), Value: fin.summary.expenseCount, Currency: '' },
        ...fin.incomeByMethod.map((m) => ({ Metric: `Income - ${m.method}`, Value: m.total, Currency: 'KGS' })),
        ...fin.expenseByCategory.map((e) => ({ Metric: `Expense - ${e.category}`, Value: e.total, Currency: 'KGS' })),
      ],
      `finance-report-${fmtDate(range.from)}-${fmtDate(range.to)}`,
    );
  };

  const exportStudents = async () => {
    if (!s) return;
    await exportToExcel(
      [
        { Metric: t('students_total'), Value: s.studentsTotal },
        { Metric: t('students_active'), Value: s.studentsActive },
        { Metric: t('students_inactive'), Value: s.studentsInactive },
        { Metric: t('enrollments'), Value: s.enrollmentsTotal },
        { Metric: t('attendance_present'), Value: s.attendancePresent },
        { Metric: t('attendance_absent'), Value: s.attendanceAbsent },
        { Metric: t('attendance_rate'), Value: `${s.attendanceRate}%` },
      ],
      `student-report-${fmtDate(range.from)}-${fmtDate(range.to)}`,
    );
  };

  const exportLeads = async () => {
    if (!leadsQ.data) return;
    await exportToExcel(
      leadsQ.data.map((l) => ({ Status: l.status, Count: l.count })),
      `leads-report-${fmtDate(range.from)}-${fmtDate(range.to)}`,
    );
  };

  return (
    <div className="space-y-0">
      {/* ── Sticky tab bar (isolated component) ── */}
      <ReportsTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        preset={preset}
        onPresetChange={setPreset}
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
              sub={`${fin?.summary.paymentCount ?? '—'} ${t('payments')}`}
              color="emerald"
              loading={financeQ.isLoading}
            />
            <StatCard
              icon={TrendingDown}
              label={t('total_expenses')}
              value={fin ? fmtMoney(fin.summary.totalExpenses) : '—'}
              sub={`${fin?.summary.expenseCount ?? '—'} ${t('expenses')}`}
              color="rose"
              loading={financeQ.isLoading}
            />
            <StatCard
              icon={TrendingUp}
              label={t('profit')}
              value={fin ? fmtMoney(fin.summary.profit) : '—'}
              color={fin && fin.summary.profit >= 0 ? 'blue' : 'rose'}
              loading={financeQ.isLoading}
            />
            <StatCard
              icon={Users}
              label={t('students_active')}
              value={s?.studentsActive ?? '—'}
              sub={`${t('of')} ${s?.studentsTotal ?? '—'} ${t('students_total_short')}`}
              color="violet"
              loading={summaryQ.isLoading}
            />
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportFinance} disabled={!fin} className="rounded-xl gap-1.5 text-xs">
              <FileDown className="size-3.5" />{t('export_excel')}
            </Button>
          </div>

          {/* Revenue chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('revenue_by_day')}</CardTitle>
              <CardDescription className="text-xs">{t('daily_payments_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              {payByDayQ.isLoading ? (
                <Skeleton className="h-56 w-full rounded-xl" />
              ) : revenueChartData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-muted-foreground">{t('no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                    <Tooltip
                      formatter={(v) => [fmtMoney(Number(v)), t('amount')]}
                      contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid hsl(var(--border))' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#10B981" strokeWidth={2} fill="url(#revenueGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Payment method breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
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
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v) => fmtMoney(Number(v))} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {methodChartData.map((m, i) => (
                        <div key={m.name} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5">
                            <span className="inline-block size-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
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
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="size-4" />{t('expenses_by_category')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {financeQ.isLoading ? <Skeleton className="h-44 w-full rounded-xl" /> :
                  expenseChartData.length === 0 ? (
                    <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">{t('no_data')}</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={expenseChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                        <Tooltip formatter={(v) => [fmtMoney(Number(v)), t('amount')]} contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                        <Bar dataKey="value" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
              </CardContent>
            </Card>
          </div>

          {/* Finance summary row */}
          {fin && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Card className="border-emerald-200/60 dark:border-emerald-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600/70">{t('total_income')}</p>
                  <p className="mt-1 text-xl font-black tabular-nums text-emerald-600">{fmtMoney(fin.summary.totalIncome)}</p>
                </CardContent>
              </Card>
              <Card className="border-rose-200/60 dark:border-rose-500/20">
                <CardContent className="p-4 text-center">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-rose-600/70">{t('total_expenses')}</p>
                  <p className="mt-1 text-xl font-black tabular-nums text-rose-600">{fmtMoney(fin.summary.totalExpenses)}</p>
                </CardContent>
              </Card>
              <Card className={cn('col-span-2 sm:col-span-1', fin.summary.profit >= 0 ? 'border-blue-200/60 dark:border-blue-500/20' : 'border-rose-200/60 dark:border-rose-500/20')}>
                <CardContent className="p-4 text-center">
                  <p className={cn('text-[11px] font-semibold uppercase tracking-wider', fin.summary.profit >= 0 ? 'text-blue-600/70' : 'text-rose-600/70')}>{t('profit')}</p>
                  <p className={cn('mt-1 text-xl font-black tabular-nums', fin.summary.profit >= 0 ? 'text-blue-600' : 'text-rose-600')}>{fmtMoney(fin.summary.profit)}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* ══ STUDENTS TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'students' && (
        <div className="mt-6 space-y-5">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportStudents} disabled={!s} className="rounded-xl gap-1.5 text-xs">
              <FileDown className="size-3.5" />{t('export_excel')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Users} label={t('students_total')} value={s?.studentsTotal ?? '—'} color="blue" loading={summaryQ.isLoading} />
            <StatCard icon={UserCheck} label={t('students_active')} value={s?.studentsActive ?? '—'} color="emerald" loading={summaryQ.isLoading} />
            <StatCard icon={GraduationCap} label={t('enrollments')} value={s?.enrollmentsTotal ?? '—'} color="violet" loading={summaryQ.isLoading} />
            <StatCard icon={Activity} label={t('attendance_rate')} value={s ? `${s.attendanceRate}%` : '—'} color="amber" loading={summaryQ.isLoading} />
          </div>

          {/* Attendance breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('attendance_breakdown')}</CardTitle>
            </CardHeader>
            <CardContent>
              {summaryQ.isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : s ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-emerald-500" />
                      {t('attendance_present')}
                    </span>
                    <span className="font-bold tabular-nums">{s.attendancePresent}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${s.attendancePresent + s.attendanceAbsent > 0 ? (s.attendancePresent / (s.attendancePresent + s.attendanceAbsent)) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="size-3 rounded-full bg-rose-400" />
                      {t('attendance_absent')}
                    </span>
                    <span className="font-bold tabular-nums">{s.attendanceAbsent}</span>
                  </div>
                  <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                    <span>{t('total_records')}: {s.attendancePresent + s.attendanceAbsent}</span>
                    <Badge variant="outline" className={cn('rounded-full font-bold', s.attendanceRate >= 80 ? 'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-300/70 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300')}>
                      {s.attendanceRate}% {t('attendance_rate')}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">{t('no_data')}</div>
              )}
            </CardContent>
          </Card>

          {/* Courses & Groups */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                  <BarChart3 className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('groups_total')}</p>
                  {summaryQ.isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : (
                    <p className="mt-0.5 text-3xl font-black text-foreground">{s?.groupsTotal ?? '—'}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-12 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <Calendar className="size-6" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('courses_total')}</p>
                  {summaryQ.isLoading ? <Skeleton className="mt-1 h-7 w-16" /> : (
                    <p className="mt-0.5 text-3xl font-black text-foreground">{s?.coursesTotal ?? '—'}</p>
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
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportLeads} disabled={!leadsQ.data} className="rounded-xl gap-1.5 text-xs">
              <FileDown className="size-3.5" />{t('export_excel')}
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(['NEW', 'CONTACTED', 'CONVERTED', 'LOST'] as const).map((status) => {
              const colors = { NEW: 'blue', CONTACTED: 'amber', CONVERTED: 'emerald', LOST: 'rose' } as const;
              const icons = { NEW: Target, CONTACTED: RefreshCw, CONVERTED: UserCheck, LOST: TrendingDown };
              const count = leadsQ.data?.find((l) => l.status === status)?.count ?? 0;
              return (
                <StatCard
                  key={status}
                  icon={icons[status]}
                  label={t(`lead_${status.toLowerCase()}`)}
                  value={count}
                  color={colors[status]}
                  loading={leadsQ.isLoading}
                />
              );
            })}
          </div>

          {/* Leads bar chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t('leads_by_status')}</CardTitle>
            </CardHeader>
            <CardContent>
              {leadsQ.isLoading ? <Skeleton className="h-52 w-full rounded-xl" /> : leadChartData.length === 0 ? (
                <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">{t('no_data')}</div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={leadChartData} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {leadChartData.map((entry, i) => {
                        const colorMap: Record<string, string> = { NEW: '#3B82F6', CONTACTED: '#F59E0B', CONVERTED: '#10B981', LOST: '#EF4444' };
                        return <Cell key={i} fill={colorMap[entry.name] ?? '#8B5CF6'} />;
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
                <CardTitle className="text-sm font-semibold">{t('conversion_summary')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(() => {
                  const total = leadsQ.data!.reduce((acc, l) => acc + l.count, 0);
                  const converted = leadsQ.data!.find((l) => l.status === 'CONVERTED')?.count ?? 0;
                  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
                  return (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('total_leads')}</span>
                        <span className="font-bold">{total}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('conversion_rate')}</span>
                        <Badge variant="outline" className={cn('rounded-full font-bold', convRate >= 30 ? 'border-emerald-300/70 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300' : 'border-amber-300/70 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300')}>
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
