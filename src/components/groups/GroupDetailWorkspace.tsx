'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  GraduationCap,
  RefreshCw,
  Users2,
} from 'lucide-react';
import { useGroupDetail, useGroupSchedule } from '@/hooks/useGroups';
import { enrollmentService } from '@/services/enrollments';
import type { Enrollment } from '@/types/student';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EnrollStudentModal } from './EnrollStudentModal';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getGroupStatus(startDate: string, endDate: string) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  const end = new Date(endDate);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  if (now < start) return 'forming' as const;
  if (now > end) return 'completed' as const;
  return 'active' as const;
}

const STATUS_MAP = {
  forming: { label: 'Forming', className: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400' },
  active: { label: 'Active', className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' },
  completed: { label: 'Completed', className: 'border-slate-500/20 bg-slate-500/10 text-slate-700 dark:text-slate-400' },
};

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return d;
  }
}

interface GroupDetailWorkspaceProps {
  groupId: string;
}

export function GroupDetailWorkspace({ groupId }: GroupDetailWorkspaceProps) {
  const groupQuery = useGroupDetail(groupId);
  const scheduleQuery = useGroupSchedule(groupId);
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'group', groupId],
    queryFn: () => enrollmentService.getByGroup(groupId),
    enabled: !!groupId,
  });

  const group = groupQuery.data;
  const schedule = scheduleQuery.data ?? [];
  const enrollments: Enrollment[] = enrollmentsQuery.data ?? [];

  if (groupQuery.isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-36 rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (groupQuery.isError || !group) {
    return (
      <div className="mx-auto mt-20 max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <AlertCircle className="size-8" />
        </div>
        <h1 className="text-2xl font-black">Group not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This group may have been deleted or you lack access.</p>
        <Link href="/groups">
          <Button variant="outline" className="mt-6">
            <ArrowLeft className="mr-2 size-4" /> Back to Groups
          </Button>
        </Link>
      </div>
    );
  }

  const status = getGroupStatus(group.start_date, group.end_date);
  const statusMeta = STATUS_MAP[status];

  return (
    <div className="space-y-7 animate-in fade-in duration-700">
      {/* Back + Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/groups">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" />
            Groups
          </Button>
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-semibold text-foreground">{group.name}</span>
      </div>

      {/* Header */}
      <section className="overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/82 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="relative p-6 sm:p-8">
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_70%_35%,rgba(139,92,246,0.22),transparent_18rem),radial-gradient(circle_at_90%_80%,rgba(59,130,246,0.18),transparent_14rem)] lg:block" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={statusMeta.className}>
                  {statusMeta.label}
                </Badge>
                {group.course && (
                  <Badge variant="outline" className="rounded-full border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300">
                    {group.course.title}
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">{group.name}</h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="size-4" />
                {formatDate(group.start_date)} — {formatDate(group.end_date)}
              </p>
            </div>
            <EnrollStudentModal groupId={group.id} groupName={group.name} />
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <InfoCard
          icon={GraduationCap}
          label="Course"
          value={group.course?.title ?? '—'}
          tone="blue"
        />
        <InfoCard
          icon={Users2}
          label="Teacher"
          value={group.teacher?.full_name ?? 'Unassigned'}
          tone="violet"
        />
        <InfoCard
          icon={Users2}
          label="Students"
          value={enrollmentsQuery.isLoading ? '…' : String(enrollments.length)}
          tone="amber"
        />
      </section>

      {/* Schedule */}
      <Card className="border-white/70 bg-white/82 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Clock className="size-5 text-muted-foreground" />
              Weekly Schedule
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => scheduleQuery.refetch()}
              title="Refresh schedule"
            >
              <RefreshCw className={`size-4 ${scheduleQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          {scheduleQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
            </div>
          ) : schedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <Clock className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No schedule set yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {schedule.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-10 rounded-lg bg-primary/10 px-2 py-0.5 text-center text-xs font-bold text-primary">
                      {DAYS[item.day_of_week]}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{item.start_time}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.duration_minutes} min</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enrolled Students */}
      <Card className="border-white/70 bg-white/82 shadow-[0_16px_60px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/5">
        <CardHeader className="px-5 pt-5 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg font-bold">
              <Users2 className="size-5 text-muted-foreground" />
              Enrolled Students
              <Badge variant="secondary" className="ml-1 rounded-full">
                {enrollments.length}
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0"
              onClick={() => enrollmentsQuery.refetch()}
              title="Refresh"
            >
              <RefreshCw className={`size-4 ${enrollmentsQuery.isFetching ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-5 pb-5 sm:px-6 sm:pb-6">
          {enrollmentsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : enrollments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
              <Users2 className="mb-3 size-8 text-muted-foreground/50" />
              <p className="text-sm font-medium text-muted-foreground">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="size-9 rounded-xl">
                    <AvatarFallback className="rounded-xl bg-violet-500/10 text-xs font-bold text-violet-600">
                      {enrollment.student?.name?.charAt(0)?.toUpperCase() ?? 'S'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {enrollment.student?.name ?? 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {enrollment.student?.phone ?? '—'}
                    </p>
                  </div>
                  <Badge variant="outline" className="rounded-full text-xs">
                    {enrollment.student?.status ?? 'N/A'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Users2;
  label: string;
  value: string;
  tone: 'violet' | 'blue' | 'amber';
}) {
  const tones = {
    violet: 'from-violet-500 to-purple-500',
    blue: 'from-blue-500 to-sky-500',
    amber: 'from-amber-400 to-orange-500',
  };

  return (
    <Card className="border-white/70 bg-white/80 shadow-[0_14px_50px_rgba(15,23,42,0.07)] backdrop-blur dark:border-white/10 dark:bg-white/5">
      <CardContent className="flex items-center justify-between p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-xl font-black text-foreground">{value}</p>
        </div>
        <div className={`flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tones[tone]}`}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}
