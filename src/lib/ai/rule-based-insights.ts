/**
 * Rule-based AI insight generator.
 * Produces natural-language summaries + actionable insights from real metrics.
 * No external API required. Optional OpenAI path lives in /api/ai/insights.
 */

import type {
  DashboardSummary,
  PaymentsByDay,
  PaymentsByMethod,
  FinanceSummary,
  Insight,
  PlatformAISummary,
  Lead,
} from '@/types/analytics';

function pct(num: number, den: number): number {
  if (!den) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

/** Simple linear trend on last-N series. Returns slope per day + projection. */
export function linearTrend(series: PaymentsByDay[]): { slope: number; avg: number; delta: number } {
  if (series.length < 2) return { slope: 0, avg: 0, delta: 0 };
  const ys = series.map((s) => Number(s.totalAmount || 0));
  const n = ys.length;
  const xs = ys.map((_, i) => i);
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((a, _, i) => a + xs[i] * ys[i], 0);
  const sumXX = xs.reduce((a, _, i) => a + xs[i] * xs[i], 0);
  const denom = n * sumXX - sumX * sumX;
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom;
  const avg = sumY / n;
  // Compare recent half vs earlier half to get a stable "delta" percentage.
  const half = Math.floor(n / 2);
  const early = ys.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half);
  const recent = ys.slice(half).reduce((a, b) => a + b, 0) / Math.max(1, n - half);
  const delta = early === 0 ? 0 : Math.round(((recent - early) / early) * 1000) / 10;
  return { slope, avg, delta };
}

export interface PlatformContext {
  summary: DashboardSummary;
  paymentsByDay: PaymentsByDay[];
  paymentsByMethod: PaymentsByMethod[];
  finance?: FinanceSummary;
}

export function generatePlatformSummary(ctx: PlatformContext): PlatformAISummary {
  const s = ctx.summary;
  const trend = linearTrend(ctx.paymentsByDay);
  const insights: Insight[] = [];

  // Revenue trend
  if (ctx.paymentsByDay.length >= 4) {
    if (trend.delta > 10) {
      insights.push({
        id: 'rev-up',
        tone: 'positive',
        title: 'Revenue accelerating',
        body: `Daily payments are up ${trend.delta.toFixed(1)}% in the recent half of the period (avg ${fmtMoney(trend.avg)}/day).`,
        metric: 'revenue',
      });
    } else if (trend.delta < -10) {
      insights.push({
        id: 'rev-down',
        tone: 'warning',
        title: 'Revenue softening',
        body: `Daily payments dropped ${Math.abs(trend.delta).toFixed(1)}% vs the earlier half. Review pipeline and overdue invoices.`,
        metric: 'revenue',
      });
    }
  }

  // Attendance rate
  if (s.attendanceRate > 0) {
    if (s.attendanceRate < 70) {
      insights.push({
        id: 'att-low',
        tone: 'urgent',
        title: `Attendance at ${s.attendanceRate}%`,
        body: `Attendance below 70% — ${s.attendanceAbsent} absences out of ${s.attendancePresent + s.attendanceAbsent} records. Consider outreach to at-risk students.`,
        metric: 'attendance',
      });
    } else if (s.attendanceRate >= 90) {
      insights.push({
        id: 'att-high',
        tone: 'positive',
        title: `Strong attendance (${s.attendanceRate}%)`,
        body: `Students are showing up consistently — keep momentum with same schedule.`,
        metric: 'attendance',
      });
    }
  }

  // Lead conversion
  const convRate = pct(s.leadsConverted, s.leadsTotal || 1);
  if (s.leadsTotal > 0 && convRate < 15) {
    insights.push({
      id: 'lead-conv',
      tone: 'warning',
      title: `Lead conversion ${convRate}%`,
      body: `${s.leadsNew} new + ${s.leadsContacted} contacted leads. Only ${s.leadsConverted} converted — consider follow-up cadence.`,
      metric: 'leads',
    });
  }

  // Completion rate
  if (s.progressTotal > 0 && s.progressCompletionRate < 50) {
    insights.push({
      id: 'prog-low',
      tone: 'warning',
      title: `Lesson completion ${s.progressCompletionRate}%`,
      body: `${s.progressCompleted} of ${s.progressTotal} tracked lessons completed. Identify stalled enrollments.`,
      metric: 'progress',
    });
  }

  // Finance
  if (ctx.finance) {
    if (ctx.finance.profit < 0) {
      insights.push({
        id: 'fin-loss',
        tone: 'urgent',
        title: 'Negative profit this period',
        body: `Income ${fmtMoney(ctx.finance.totalIncome)} vs expenses ${fmtMoney(ctx.finance.totalExpenses)}. Review expense categories.`,
        metric: 'finance',
      });
    } else if (ctx.finance.profit > 0 && ctx.finance.totalIncome > 0) {
      const margin = (ctx.finance.profit / ctx.finance.totalIncome) * 100;
      if (margin > 30) {
        insights.push({
          id: 'fin-margin',
          tone: 'positive',
          title: `Healthy ${margin.toFixed(0)}% margin`,
          body: `Profit ${fmtMoney(ctx.finance.profit)} on ${fmtMoney(ctx.finance.totalIncome)} income.`,
          metric: 'finance',
        });
      }
    }
  }

  // Payment method mix
  const topMethod = [...ctx.paymentsByMethod].sort(
    (a, b) => Number(b.totalAmount) - Number(a.totalAmount),
  )[0];
  if (topMethod && Number(topMethod.totalAmount) > 0) {
    insights.push({
      id: 'pay-mix',
      tone: 'info',
      title: `${topMethod.method ?? 'Unknown'} is top channel`,
      body: `${topMethod.count} payments totalling ${fmtMoney(Number(topMethod.totalAmount))} came via ${topMethod.method ?? 'unknown'}.`,
      metric: 'payments',
    });
  }

  // Headline
  const parts: string[] = [];
  parts.push(`${s.studentsActive} active students across ${s.groupsTotal} groups.`);
  if (ctx.paymentsByDay.length > 0) {
    const total = ctx.paymentsByDay.reduce((a, b) => a + Number(b.totalAmount || 0), 0);
    parts.push(`Collected ${fmtMoney(total)} in ${s.paymentsCount} payments.`);
  }
  if (s.leadsNew > 0) parts.push(`${s.leadsNew} new leads pending follow-up.`);
  if (s.upcomingLessons.length > 0) parts.push(`${s.upcomingLessons.length} lessons scheduled next.`);

  return {
    headline:
      trend.delta > 5
        ? 'Platform trending up'
        : trend.delta < -5
        ? 'Needs attention'
        : 'Platform steady',
    body: parts.join(' '),
    insights: insights.slice(0, 5),
    generatedAt: new Date().toISOString(),
    source: 'rule-based',
  };
}

export interface CRMContext {
  summary: DashboardSummary;
  leads: Lead[];
}

export function generateCRMInsights(ctx: CRMContext): Insight[] {
  const s = ctx.summary;
  const insights: Insight[] = [];

  // Conversion funnel drop-offs
  const fromNew = s.leadsNew + s.leadsContacted + s.leadsConverted + s.leadsLost;
  if (fromNew > 0) {
    const contactedRate = pct(s.leadsContacted + s.leadsConverted + s.leadsLost, fromNew);
    if (contactedRate < 50 && s.leadsNew > 5) {
      insights.push({
        id: 'crm-stale-new',
        tone: 'warning',
        title: `${s.leadsNew} leads untouched`,
        body: `Only ${contactedRate}% of leads have been contacted. Untouched leads lose heat fast.`,
      });
    }
  }

  // Lost ratio
  if (s.leadsTotal > 10) {
    const lostRate = pct(s.leadsLost, s.leadsTotal);
    if (lostRate > 30) {
      insights.push({
        id: 'crm-lost',
        tone: 'urgent',
        title: `${lostRate}% of leads lost`,
        body: `Lost leads outnumber conversions — review objection patterns and source quality.`,
      });
    }
  }

  // Source concentration
  const sources = new Map<string, number>();
  ctx.leads.forEach((l) => sources.set(l.source || 'unknown', (sources.get(l.source || 'unknown') || 0) + 1));
  const top = [...sources.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && ctx.leads.length > 5) {
    const share = pct(top[1], ctx.leads.length);
    if (share > 60) {
      insights.push({
        id: 'crm-src-risk',
        tone: 'info',
        title: `${top[0]} drives ${share}% of leads`,
        body: 'High channel concentration is a single-point-of-failure risk. Diversify acquisition sources.',
      });
    } else {
      insights.push({
        id: 'crm-src-top',
        tone: 'positive',
        title: `Top source: ${top[0]}`,
        body: `${top[1]} of ${ctx.leads.length} leads (${share}%) came from ${top[0]}. Consider doubling down.`,
      });
    }
  }

  // Admin load
  const byAdmin = new Map<string, number>();
  ctx.leads.forEach((l) => byAdmin.set(l.admin || 'unassigned', (byAdmin.get(l.admin || 'unassigned') || 0) + 1));
  const topAdmin = [...byAdmin.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topAdmin && byAdmin.size > 1) {
    insights.push({
      id: 'crm-admin',
      tone: 'info',
      title: `${topAdmin[0]} handling most leads`,
      body: `${topAdmin[1]} leads assigned to ${topAdmin[0]} across ${byAdmin.size} admins.`,
    });
  }

  return insights.slice(0, 5);
}

export interface LMSContext {
  summary: DashboardSummary;
}

export function generateLMSInsights(ctx: LMSContext): Insight[] {
  const s = ctx.summary;
  const insights: Insight[] = [];

  if (s.studentsActive > 0) {
    const inactiveRate = pct(s.studentsInactive, s.studentsTotal);
    if (inactiveRate > 25) {
      insights.push({
        id: 'lms-inactive',
        tone: 'warning',
        title: `${inactiveRate}% students inactive`,
        body: `${s.studentsInactive} of ${s.studentsTotal} students flagged inactive. Plan re-engagement outreach.`,
      });
    } else {
      insights.push({
        id: 'lms-active',
        tone: 'positive',
        title: `${s.studentsActive} active learners`,
        body: `${100 - inactiveRate}% of students are engaged across ${s.groupsTotal} groups.`,
      });
    }
  }

  if (s.attendanceRate > 0 && s.progressCompletionRate > 0) {
    const gap = Math.abs(s.attendanceRate - s.progressCompletionRate);
    if (gap > 25) {
      insights.push({
        id: 'lms-gap',
        tone: 'warning',
        title: 'Attendance/progress gap',
        body: `Attendance ${s.attendanceRate}% but completion only ${s.progressCompletionRate}% — students show up but don't finish material.`,
      });
    }
  }

  if (s.coursesActive === 0 && s.coursesTotal > 0) {
    insights.push({
      id: 'lms-no-active',
      tone: 'urgent',
      title: 'No active courses',
      body: `${s.coursesInactive} courses exist but none are ACTIVE. Check publishing state.`,
    });
  }

  if (s.upcomingLessons.length === 0) {
    insights.push({
      id: 'lms-noupc',
      tone: 'info',
      title: 'No upcoming lessons scheduled',
      body: 'Schedule sessions to maintain learning velocity.',
    });
  }

  return insights.slice(0, 5);
}
