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
  Sparkles,
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
import { useAuthStore } from '@/store/auth.store';

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
  const user = useAuthStore((state) => state.user);
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
    <div className="w-full h-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 text-white shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_25rem)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest">
              <Sparkles className="size-4" />
              <span>System Insights</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              {t('welcome_back')} {user?.organization_name || 'Bilim Nuru'}
            </h1>
            {summaryLoading ? (
              <div className="text-slate-300 max-w-xl font-medium">
                <Skeleton className="h-6 w-96 bg-white/10" />
              </div>
            ) : (
              <p className="text-slate-300 max-w-xl font-medium">
                {t('you_have')}{' '}
                <span className="text-blue-400 font-bold">{summary?.leadsNew || 0} {t('new_leads')}</span>
                {' '}{t('and')}{' '}
                <span className="text-red-400 font-bold">{summary?.attendanceAbsent || 0} {t('absent_today')}</span>.
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="bg-white/5 hover:bg-white/10 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all backdrop-blur-md border border-white/10">
              Generate Report
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/25">
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {summaryLoading ? (
          [1,2,3,4].map(i => (
            <div key={i} className="bg-white/80 backdrop-blur-sm rounded-[32px] p-6 shadow-sm border border-slate-200/50">
              <Skeleton className="h-12 w-12 rounded-2xl mb-4" />
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-20" />
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
              subtitle={`${Number(summary?.paymentsTotalAmount || 0).toLocaleString()} som`}
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Charts Area */}
        <div className="xl:col-span-2 space-y-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Distribution Chart */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 min-w-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('leads_by_status')}</h3>
                  <p className="text-sm text-slate-400 font-medium">{t('conversion_funnel_overview')}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <TrendingUp className="size-5 text-slate-400" />
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
            <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 min-w-0">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">{t('payment_methods')}</h3>
                  <p className="text-sm text-slate-400 font-medium">{t('transaction_breakdown')}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <Clock className="size-5 text-slate-400" />
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
        <div className="space-y-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-[32px] p-8 shadow-sm border border-slate-200/50 h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-slate-900">{t('recent_activity')}</h3>
              <button className="text-blue-500 font-bold text-xs hover:underline flex items-center gap-1">
                {t('view_all')} <ChevronRight className="size-3" />
              </button>
            </div>
            <div className="space-y-6">
              {summaryLoading ? (
                [1,2,3].map(i => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="size-10 rounded-xl shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : summary?.upcomingLessons && summary.upcomingLessons.length > 0 ? (
                summary.upcomingLessons.slice(0, 3).map((lesson) => (
                  <div key={lesson.id} className="flex gap-4 group cursor-pointer">
                    <div className="size-10 rounded-xl shrink-0 flex items-center justify-center bg-indigo-50 text-indigo-500">
                      <CalendarDays className="size-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{lesson.title}</p>
                      <p className="text-xs font-medium text-slate-400">{lesson.course_title}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">{t('no_upcoming_lessons')}</p>
              )}
            </div>

            <div className="mt-12 pt-8 border-t border-slate-50">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-blue-100/50">
                <p className="text-sm font-black text-slate-900 mb-2">{t('overall_attendance')}</p>
                <div className="flex items-end gap-2">
                  {summaryLoading ? (
                    <Skeleton className="h-10 w-20" />
                  ) : (
                    <>
                      <span className="text-3xl font-black text-indigo-600">{summary?.attendanceRate || 0}%</span>
                      <span className="text-xs font-bold text-slate-400 mb-1">{summary?.attendancePresent || 0} {t('present')}</span>
                    </>
                  )}
                </div>
                <div className="w-full h-2 bg-slate-200/50 rounded-full mt-4 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${summary?.attendanceRate || 0}%` }}
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
      className="bg-white/80 backdrop-blur-sm rounded-[32px] p-6 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40 group overflow-hidden relative"
      style={{ borderLeft: `6px solid ${color}` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="size-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
          <Icon className="size-6" />
        </div>
        <div className={cn(
          "flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black",
          trendUp ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
        )}>
          {trendUp ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {unit && <span className="text-sm font-bold text-slate-400">{unit}</span>}
        </div>
        <div className="text-[11px] font-semibold text-slate-400 pt-1 flex items-center gap-1.5">
          <span className="size-1 rounded-full bg-slate-300" />
          {subtitle}
        </div>
      </div>
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
