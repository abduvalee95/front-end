'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { BookOpen, CalendarDays, GraduationCap, Layers3, UserCheck, UsersRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useDashboardSummary, useLeadsByStatus, usePaymentsByMethod, usePaymentsByDay } from '@/hooks/useDashboard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n/index';

// Lazy load chart components — recharts is heavy (~140KB gzipped)
const RevenueChart = dynamic(
  () => import('@/components/dashboard/RevenueChart').then((m) => m.RevenueChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[280px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

const LeadsByStatusChart = dynamic(
  () => import('@/components/dashboard/LeadsByStatusChart').then((m) => m.LeadsByStatusChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[340px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

const PaymentMethodsChart = dynamic(
  () => import('@/components/dashboard/PaymentMethodsChart').then((m) => m.PaymentMethodsChart),
  {
    loading: () => (
      <div className="bg-card rounded-2xl p-6 min-w-0 shadow-sm">
        <Skeleton className="h-[320px] w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);

const TEACHER_LINKS = [
  { href: '/journal',    icon: BookOpen,     color: 'text-indigo-500',  bg: 'bg-indigo-500/10 border-indigo-500/20',  labelKey: 'journal' },
  { href: '/students',   icon: UsersRound,   color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', labelKey: 'students' },
  { href: '/groups',     icon: Layers3,      color: 'text-amber-500',   bg: 'bg-amber-500/10 border-amber-500/20',    labelKey: 'groups' },
  { href: '/attendance', icon: UserCheck,    color: 'text-rose-500',    bg: 'bg-rose-500/10 border-rose-500/20',      labelKey: 'attendance' },
  { href: '/schedule',   icon: CalendarDays, color: 'text-cyan-500',    bg: 'bg-cyan-500/10 border-cyan-500/20',      labelKey: 'schedule' },
] as const;

function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
        <div className="relative flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="size-6 text-indigo-300" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-300">{tCommon('teacher')}</p>
            <h1 className="mt-0.5 text-xl font-black leading-tight">
              {tDash('welcome_back')} {user?.full_name?.split(' ')[0]}
            </h1>
          </div>
        </div>
      </div>

      {/* Quick nav grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {TEACHER_LINKS.map(({ href, icon: Icon, color, bg, labelKey }) => (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md ${bg} cursor-pointer`}
          >
            <div className={`flex size-10 items-center justify-center rounded-xl bg-background/60`}>
              <Icon className={`size-5 ${color}`} />
            </div>
            <span className="text-sm font-semibold text-foreground">{t(labelKey as string)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const role = useAuthStore((s) => s.user?.role);
  const isTeacher = role === 'TEACHER';

  const revenueRange = useMemo(() => {
    const to = endOfDay(new Date());
    const from = startOfDay(subDays(to, 29));
    return { from, to };
  }, []);

  const revenueQuery = useMemo(
    () => ({
      from: revenueRange.from.toISOString(),
      to: revenueRange.to.toISOString(),
    }),
    [revenueRange],
  );

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const { data: leadsByStatus, isLoading: leadsLoading } = useLeadsByStatus();
  const { data: paymentsByMethod, isLoading: paymentsLoading } = usePaymentsByMethod();
  const { data: paymentsByDay, isLoading: paymentsByDayLoading } = usePaymentsByDay(revenueQuery);

  if (isTeacher) return <TeacherDashboard />;

  return (
    <div className="w-full h-full space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <StatsGrid summary={summary} isLoading={summaryLoading} />

      <RevenueChart
        paymentsByDay={paymentsByDay}
        isLoading={paymentsByDayLoading}
        rangeFrom={revenueRange.from}
        rangeTo={revenueRange.to}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <LeadsByStatusChart leadsByStatus={leadsByStatus} isLoading={leadsLoading} />
            <PaymentMethodsChart paymentsByMethod={paymentsByMethod} isLoading={paymentsLoading} />
          </div>
        </div>

        <div className="space-y-5">
          <RecentActivity summary={summary} isLoading={summaryLoading} />
        </div>
      </div>
    </div>
  );
}
