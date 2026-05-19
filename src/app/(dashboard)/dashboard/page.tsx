'use client';

import { 
  Users, 
  CalendarDays, 
  AlertTriangle, 
  ClipboardList, 
  ArrowUpRight, 
  ArrowDownRight,
  TrendingUp,
  Clock,
  ChevronRight,
  DollarSign,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  Tooltip,
} from 'recharts';
import { useDashboardSummary, useLeadsByStatus, usePaymentsByMethod } from '@/hooks/useDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';
import { useTranslations } from '@/i18n/index';

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: '#3b82f6',
  CONTACTED: '#6366f1',
  CONVERTED: '#10b981',
  LOST: '#ef4444',
};

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CASH: '#2dd4bf',
  CARD: '#3b82f6',
  TRANSFER: '#8b5cf6',
};

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: leadsByStatus, isLoading: leadsLoading } = useLeadsByStatus();
  const { data: paymentsByMethod, isLoading: paymentsLoading } = usePaymentsByMethod();

  const pieData = useMemo(() => {
    if (!leadsByStatus) return [];
    return leadsByStatus.map(item => ({
      name: item.status,
      value: item.count,
      color: LEAD_STATUS_COLORS[item.status] || '#64748b',
    }));
  }, [leadsByStatus]);

  const barData = useMemo(() => {
    if (!paymentsByMethod) return [];
    return paymentsByMethod.map(item => ({
      name: item.method || 'Unknown',
      value: item.count,
      color: PAYMENT_METHOD_COLORS[item.method || ''] || '#64748b',
    }));
  }, [paymentsByMethod]);
  return (
    <div className="w-full h-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <Skeleton className="h-9 w-9 rounded-xl mb-5" />
              <Skeleton className="h-8 w-20 mb-1.5" />
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          ))
        ) : (
          <>
            <StatCard 
              title={t('total_students')} 
              value={String(summary?.studentsActive || 0)} 
              subtitle={`Inactive: ${summary?.studentsInactive || 0}`} 
              icon={Users} 
              trend={`${summary?.studentsTotal || 0} total`}
              trendUp={true}
              color="#3b82f6"
            />
            <StatCard 
              title={t('total_payments')} 
              value={String(summary?.paymentsCount || 0)} 
              unit="payments" 
              subtitle={`${Number(summary?.paymentsTotalAmount || 0).toLocaleString()} сом`}
              icon={DollarSign} 
              trend={`${summary?.paymentsCount || 0} count`}
              trendUp={true}
              color="#2dd4bf"
            />
            <StatCard 
              title={t('active_leads')} 
              value={String(summary?.leadsNew || 0)} 
              subtitle={`Contacted: ${summary?.leadsContacted || 0}`} 
              icon={ClipboardList} 
              trend={`${summary?.leadsConverted || 0} converted`}
              trendUp={true}
              color="#f59e0b"
            />
            <StatCard 
              title={t('attendance_rate')} 
              value={String(summary?.attendanceRate || 0)} 
              unit="%"
              subtitle={`${t('present')}: ${summary?.attendancePresent || 0}`} 
              icon={GraduationCap} 
              trend={`${summary?.attendanceAbsent || 0} absent`}
              trendUp={(summary?.attendanceRate || 0) >= 75}
              color="#8b5cf6"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Main Charts Area */}
        <div className="xl:col-span-2 space-y-5">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Distribution Chart */}
            <div className="bg-white rounded-2xl p-6 min-w-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('leads_by_status')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('conversion_funnel_overview')}</p>
                </div>
                <div className="flex size-7 items-center justify-center rounded-lg bg-slate-50">
                  <TrendingUp className="size-3.5 text-slate-400" strokeWidth={2} />
                </div>
              </div>
              {leadsLoading ? (
                <div className="h-[300px] w-full min-h-[300px] flex items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : pieData.length > 0 ? (
                <>
                  <div className="h-[300px] w-full min-h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                          itemStyle={{ fontWeight: 'bold' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-6 mt-4">
                    {pieData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs font-bold text-slate-500">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">
                  No lead data available
                </div>
              )}
            </div>

            {/* Payment Methods Chart */}
            <div className="bg-white rounded-2xl p-6 min-w-0" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('payment_methods')}</h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{t('transaction_breakdown')}</p>
                </div>
                <div className="flex size-7 items-center justify-center rounded-lg bg-slate-50">
                  <Clock className="size-3.5 text-slate-400" strokeWidth={2} />
                </div>
              </div>
              {paymentsLoading ? (
                <div className="h-[280px] w-full mt-4 min-h-[280px] flex items-center justify-center">
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </div>
              ) : barData.length > 0 ? (
                <div className="h-[280px] w-full mt-4 min-h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={45}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#f8fafc' }}
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="value" radius={[10, 10, 10, 10]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                  No payment data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Activity Area */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 h-full" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">{t('recent_activity')}</h3>
              <button className="flex items-center gap-0.5 text-[11px] font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                {t('view_all')} <ChevronRight className="size-3" />
              </button>
            </div>
            <div className="space-y-1">
              {summaryLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex gap-3 p-2">
                    <Skeleton className="size-8 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1 py-0.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-2.5 w-24" />
                    </div>
                  </div>
                ))
              ) : summary?.upcomingLessons && summary.upcomingLessons.length > 0 ? (
                summary.upcomingLessons.slice(0, 5).map((lesson) => (
                  <div key={lesson.id} className="group flex gap-3 rounded-xl p-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="size-8 rounded-lg shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-400">
                      <CalendarDays className="size-3.5" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{lesson.title}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">{lesson.course_title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-8">{t('no_upcoming_lessons')}</p>
              )}
            </div>

            <div className="mt-5 pt-5 border-t border-slate-100/80">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-indigo-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-3">{t('overall_attendance')}</p>
                {summaryLoading ? (
                  <Skeleton className="h-8 w-20 mb-3" />
                ) : (
                  <div className="flex items-baseline gap-1.5 mb-3">
                    <span className="text-2xl font-black text-slate-900 tabular-nums">{summary?.attendanceRate || 0}</span>
                    <span className="text-xs font-bold text-slate-400">%</span>
                    <span className="text-[10px] font-medium text-slate-400 ml-1">{summary?.attendancePresent || 0} {t('present')}</span>
                  </div>
                )}
                <div className="w-full h-1.5 bg-slate-200/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${summary?.attendanceRate || 0}%`,
                      background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  unit?: string;
  subtitle: string;
  icon: LucideIcon;
  trend: string;
  trendUp: boolean;
  color: string;
}

function StatCard({ title, value, unit, subtitle, icon: Icon, trend, trendUp, color }: StatCardProps) {
  return (
    <div
      className="group relative bg-white rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute inset-x-0 top-0 h-[2.5px] rounded-t-2xl transition-all duration-300 group-hover:h-[3px]"
        style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }}
      />

      {/* Icon + trend row */}
      <div className="flex items-start justify-between mb-5 pt-1">
        <div
          className="flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105"
          style={{ backgroundColor: `${color}12`, color }}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        <div
          className={cn(
            'flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide',
            trendUp
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-500'
          )}
        >
          {trendUp
            ? <ArrowUpRight className="size-3" strokeWidth={2.5} />
            : <ArrowDownRight className="size-3" strokeWidth={2.5} />}
          {trend}
        </div>
      </div>

      {/* Number */}
      <div className="flex items-baseline gap-1.5 mb-1">
        <span
          className="text-[2.15rem] font-black leading-none tracking-tight text-slate-900 tabular-nums"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-xs font-semibold text-slate-400 mb-0.5">{unit}</span>
        )}
      </div>

      {/* Label + subtitle */}
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-1">{title}</p>
      <p className="text-[11px] text-slate-400/80 font-medium">{subtitle}</p>
    </div>
  );
}

function CreditCard({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
    </svg>
  );
}
