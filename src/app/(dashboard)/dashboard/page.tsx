'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { endOfDay, startOfMonth } from 'date-fns';
import { BookOpen, CalendarDays, GraduationCap, Layers3, UserCheck, UsersRound } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { TONE_SURFACE } from '@/components/ui/tone';
import { cn } from '@/lib/utils';
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
      <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
        <Skeleton className="h-[280px] w-full rounded-control" />
      </div>
    ),
    ssr: false,
  },
);

const LeadsByStatusChart = dynamic(
  () => import('@/components/dashboard/LeadsByStatusChart').then((m) => m.LeadsByStatusChart),
  {
    loading: () => (
      <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
        <Skeleton className="h-[340px] w-full rounded-control" />
      </div>
    ),
    ssr: false,
  },
);

const PaymentMethodsChart = dynamic(
  () => import('@/components/dashboard/PaymentMethodsChart').then((m) => m.PaymentMethodsChart),
  {
    loading: () => (
      <div className="min-w-0 rounded-card border border-border bg-card p-6 shadow-card">
        <Skeleton className="h-[320px] w-full rounded-control" />
      </div>
    ),
    ssr: false,
  },
);

const TEACHER_LINKS = [
  { href: '/journal',    icon: BookOpen,     labelKey: 'journal' },
  { href: '/students',   icon: UsersRound,   labelKey: 'students' },
  { href: '/groups',     icon: Layers3,      labelKey: 'groups' },
  { href: '/attendance', icon: UserCheck,    labelKey: 'attendance' },
  { href: '/schedule',   icon: CalendarDays, labelKey: 'schedule' },
] as const;

function TeacherDashboard() {
  const user = useAuthStore((s) => s.user);
  const t = useTranslations('nav');
  const tDash = useTranslations('dashboard');
  const tCommon = useTranslations('common');

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        icon={GraduationCap}
        eyebrow={tCommon('teacher')}
        title={`${tDash('welcome_back')} ${user?.full_name?.split(' ')[0] ?? ''}`.trim()}
        subtitle={tDash('teacher_quick_links')}
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
        {TEACHER_LINKS.map(({ href, icon: Icon, labelKey }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-3 rounded-card border border-border bg-card p-5 shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-px hover:shadow-card-hover"
          >
            <span className={cn('flex size-10 items-center justify-center rounded-control', TONE_SURFACE.primary)}>
              <Icon className="size-5" />
            </span>
            <span className="text-h4 text-foreground">{t(labelKey as string)}</span>
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
    const now = new Date();
    return { from: startOfMonth(now), to: endOfDay(now) };
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
