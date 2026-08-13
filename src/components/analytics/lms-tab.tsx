'use client';

import { format, parseISO } from 'date-fns';
import { GraduationCap, BookOpen, CheckCircle2, Users2, CalendarDays, TrendingUp } from 'lucide-react';
import { useLMSAnalytics, useLMSAI } from '@/hooks/useAnalytics';
import { MetricCard, InsightCard, SectionHeader } from './shared';
import { BarChartWrapper, ChartFrame } from '@/components/charts/chart-primitives';
import { Skeleton } from '@/components/ui/skeleton';
import { seriesColor, useChartTheme } from '@/lib/chart-theme';

export function LMSTab() {
  const chart = useChartTheme();
  const { summary, invoices } = useLMSAnalytics();
  const { data: insights, isLoading: insightsLoading } = useLMSAI();
  const s = summary.data;

  // Revenue per course from invoices (InvoiceItem.course_title + amount)
  const courseRevenue = new Map<string, number>();
  invoices.data?.items.forEach((inv) => {
    inv.items.forEach((item) => {
      const k = item.course_title || '—';
      courseRevenue.set(k, (courseRevenue.get(k) || 0) + Number(item.amount || 0));
    });
  });
  const topCourses = [...courseRevenue.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ x: name, value }));

  return (
    <div className="space-y-8">
      <div>
        <SectionHeader title="LMS KPIs" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard
            isLoading={summary.isLoading}
            title="Students Active"
            value={s?.studentsActive ?? 0}
            icon={<Users2 className="h-5 w-5" />}
            accent="cyan"
            hint={`${s?.studentsTotal ?? 0} total`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Enrollments"
            value={s?.enrollmentsTotal ?? 0}
            icon={<GraduationCap className="h-5 w-5" />}
            accent="blue"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Active Courses"
            value={s?.coursesActive ?? 0}
            icon={<BookOpen className="h-5 w-5" />}
            accent="violet"
            hint={`${s?.coursesTotal ?? 0} catalogued`}
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Groups"
            value={s?.groupsTotal ?? 0}
            icon={<Users2 className="h-5 w-5" />}
            accent="pink"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Attendance"
            value={s?.attendanceRate ?? 0}
            format={(v) => `${Math.round(v)}%`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            accent="emerald"
          />
          <MetricCard
            isLoading={summary.isLoading}
            title="Completion"
            value={s?.progressCompletionRate ?? 0}
            format={(v) => `${Math.round(v)}%`}
            icon={<TrendingUp className="h-5 w-5" />}
            accent="amber"
            hint={`${s?.progressCompleted ?? 0} / ${s?.progressTotal ?? 0}`}
          />
        </div>
      </div>

      {/* Course revenue + Upcoming lessons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartFrame
          title="Revenue by course"
          subtitle="Billed via invoices"
          isLoading={invoices.isLoading}
          isEmpty={topCourses.length === 0}
          emptyText={
            invoices.isError
              ? 'Billing endpoint not accessible (requires ADMIN/MANAGER)'
              : 'No billed invoices in scope'
          }
          height={360}
        >
          <BarChartWrapper
            data={topCourses}
            color={seriesColor(chart, 0)}
            horizontal
            yFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}K` : String(v))}
          />
        </ChartFrame>

        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-4 w-4 text-primary-emphasis" />
            <h3 className="font-semibold">Upcoming Lessons</h3>
          </div>
          {summary.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (s?.upcomingLessons?.length ?? 0) === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              No upcoming lessons scheduled.
            </div>
          ) : (
            <ul className="space-y-2">
              {s!.upcomingLessons.map((l) => (
                <li
                  key={l.id}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary-emphasis flex items-center justify-center shrink-0">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{l.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{l.course_title}</p>
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(parseISO(l.start_date), 'MMM d')}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* AI insights */}
      <div>
        <SectionHeader title="AI LMS Insights" />
        {insightsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-sm text-muted-foreground">
            No insights yet — more data will enable pattern detection.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
