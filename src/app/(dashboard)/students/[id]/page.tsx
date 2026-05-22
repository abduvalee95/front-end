'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStudentDetail } from '@/hooks/useStudents';
import { usePayments, useDeletePayment } from '@/hooks/useFinance';
import { AddPaymentModal } from '@/components/finance/AddPaymentModal';
import { useTranslations, useLocale } from '@/i18n/index';
import {
  ArrowLeft, BookOpen, Calendar, Check, CreditCard,
  GraduationCap, Loader2, MapPin, Phone, Plus, Trash2, User, Users, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function formatAmount(amount: number) {
  return new Intl.NumberFormat('ru-RU').format(amount) + ' сом';
}

type PaymentStatus = 'full' | 'partial' | 'none' | 'future';

interface MonthData {
  month: number;
  total: number;
  status: PaymentStatus;
  isCurrent: boolean;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const t = useTranslations('students');
  const locale = useLocale();

  const { data: student, isLoading, isError } = useStudentDetail(studentId);
  const paymentsQuery = usePayments({ student_id: studentId, limit: 100 }, !!studentId);
  const deletePayment = useDeletePayment();

  const payments = paymentsQuery.data?.items ?? [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthlyData = useMemo<MonthData[]>(() => {
    const totals = new Array(12).fill(0);
    payments.forEach((p) => {
      const d = new Date(p.paid_at);
      if (d.getFullYear() === currentYear) {
        totals[d.getMonth()] += p.amount;
      }
    });
    const maxPaid = Math.max(...totals.filter((a) => a > 0), 0);

    return totals.map((total, month) => {
      let status: PaymentStatus = 'none';
      if (month > currentMonth) {
        status = 'future';
      } else if (total === 0) {
        status = 'none';
      } else if (maxPaid > 0 && total >= maxPaid) {
        status = 'full';
      } else {
        status = 'partial';
      }
      return { month, total, status, isCurrent: month === currentMonth };
    });
  }, [payments, currentYear, currentMonth]);

  const currentMonthData = monthlyData[currentMonth];
  const hasPaidThisMonth = currentMonthData?.status === 'full' || currentMonthData?.status === 'partial';

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Student not found or error loading data.</p>
            <Button variant="outline" onClick={() => router.push('/students')} className="mt-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/students')}>
          <ArrowLeft className="size-5" />
        </Button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-black tracking-tight">{student.name}</h1>
            {!paymentsQuery.isLoading && (
              <PaymentStatusBadge
                status={currentMonthData?.status ?? 'none'}
                paid={t('payment_badge_paid')}
                unpaid={t('payment_badge_unpaid')}
                partial={t('payment_badge_partial')}
              />
            )}
          </div>
          <p className="text-sm text-muted-foreground">{t('profile_subtitle')}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── Personal Info ── */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              {t('personal_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('status_label')}</p>
              <Badge
                variant="outline"
                className={cn(
                  'mt-1 rounded-full',
                  student.status === 'ACTIVE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                )}
              >
                {student.status === 'ACTIVE' ? t('status_active') : t('status_inactive')}
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">{t('current_month_payment')}</p>
              <div className="mt-2">
                {paymentsQuery.isLoading ? (
                  <div className="size-10 rounded-full bg-muted animate-pulse" />
                ) : (
                  <PaymentStatusCircle
                    status={currentMonthData?.status ?? 'none'}
                    paidLabel={t('month_paid_full')}
                    partialLabel={t('month_paid_partial')}
                    unpaidLabel={t('month_not_paid')}
                    locale={locale}
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">
                <Phone className="mr-1 inline size-3.5" />
                {t('phone')}
              </p>
              <p className="mt-1 text-sm font-medium">{student.phone}</p>
            </div>

            {student.address && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <MapPin className="mr-1 inline size-3.5" />
                  {t('address_label')}
                </p>
                <p className="mt-1 text-sm">{student.address}</p>
              </div>
            )}

            {student.parent && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <Users className="mr-1 inline size-3.5" />
                  {t('parent_guardian')}
                </p>
                <p className="mt-1 text-sm">{student.parent}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Enrollments ── */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              {t('enrollments_title')}
            </CardTitle>
            <CardDescription>{t('enrollments_desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            {student.enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <BookOpen className="mb-3 size-10 text-muted-foreground" />
                <p className="text-sm font-medium">{t('no_enrollments')}</p>
                <p className="text-xs text-muted-foreground">{t('no_enrollments_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{enrollment.group?.name ?? '-'}</h4>
                          {enrollment.group?.course && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              <BookOpen className="mr-1 inline size-3.5" />
                              {enrollment.group.course.title}
                            </p>
                          )}
                          {enrollment.group?.teacher && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              <User className="mr-1 inline size-3.5" />
                              {enrollment.group.teacher.full_name}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            <Calendar className="mr-1 inline size-3" />
                            {format(new Date(enrollment.enrolled_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 12-Month Payment Calendar ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="size-5" />
            {t('payment_calendar_title', { year: currentYear })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsQuery.isLoading ? (
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-12">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl" />
              ))}
            </div>
          ) : (
            <MonthlyCalendar
              data={monthlyData}
              locale={locale}
              labelPaid={t('month_paid_full')}
              labelPartial={t('month_paid_partial')}
              labelUnpaid={t('month_not_paid')}
              labelFuture={t('month_future')}
            />
          )}
        </CardContent>
      </Card>

      {/* ── Payment List ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5" />
              {t('payment_history_title')}
            </CardTitle>
            <CardDescription>{t('payment_history_desc')}</CardDescription>
          </div>
          <Button
            size="sm"
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white h-9"
            onClick={() => setPaymentModalOpen(true)}
          >
            <Plus className="mr-1.5 size-4" />
            {t('add_payment_btn')}
          </Button>
        </CardHeader>
        <CardContent>
          {paymentsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
              <CreditCard className="mb-3 size-10 text-muted-foreground" />
              <p className="text-sm font-medium">{t('no_payments_title')}</p>
              <p className="text-xs text-muted-foreground">{t('no_payments_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10">
                      <CreditCard className="size-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-emerald-600">+{formatAmount(payment.amount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(payment.paid_at), 'dd MMM yyyy')}
                        {payment.description && <span> · {payment.description}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0.5">
                      {payment.method}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                      disabled={deletePayment.isPending}
                      onClick={() => {
                        if (!confirm(t('delete_payment_confirm'))) return;
                        deletePayment.mutate(payment.id);
                      }}
                    >
                      {deletePayment.isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AddPaymentModal
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        studentId={studentId}
        studentName={student.name}
      />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function MonthlyCalendar({
  data,
  locale,
  labelPaid,
  labelPartial,
  labelUnpaid,
  labelFuture,
}: {
  data: MonthData[];
  locale: string;
  labelPaid: string;
  labelPartial: string;
  labelUnpaid: string;
  labelFuture: string;
}) {
  const getMonthName = (month: number) =>
    new Intl.DateTimeFormat(locale === 'kg' ? 'ru' : locale, { month: 'short' }).format(
      new Date(2024, month, 1),
    );

  const getLabel = (status: PaymentStatus) => {
    if (status === 'full') return labelPaid;
    if (status === 'partial') return labelPartial;
    if (status === 'future') return labelFuture;
    return labelUnpaid;
  };

  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-12">
      {data.map(({ month, total, status, isCurrent }) => (
        <div
          key={month}
          title={`${getMonthName(month)}: ${getLabel(status)}${total > 0 ? ' — ' + formatAmount(total) : ''}`}
          className={cn(
            'group flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-200',
            isCurrent && 'ring-2 ring-offset-1',
            status === 'full' && 'border-emerald-200 bg-emerald-50/50 ring-emerald-400 dark:border-emerald-500/30 dark:bg-emerald-500/5',
            status === 'partial' && 'border-amber-200 bg-amber-50/50 ring-amber-400 dark:border-amber-500/30 dark:bg-amber-500/5',
            status === 'none' && 'border-red-200 bg-red-50/50 ring-red-400 dark:border-red-500/30 dark:bg-red-500/5',
            status === 'future' && 'border-border/40 bg-muted/20 opacity-50 ring-border',
          )}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {getMonthName(month)}
          </span>
          <MonthCircle status={status} />
          {total > 0 && (
            <span className="text-[9px] font-bold tabular-nums text-muted-foreground leading-none">
              {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(total)} сом
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MonthCircle({ status }: { status: PaymentStatus }) {
  if (status === 'full') {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500 shadow-md ring-4 ring-emerald-100 dark:ring-emerald-500/20">
        <Check className="size-4 text-white stroke-[3]" />
      </div>
    );
  }

  if (status === 'none') {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-red-500 shadow-md ring-4 ring-red-100 dark:ring-red-500/20">
        <X className="size-4 text-white stroke-[3]" />
      </div>
    );
  }

  if (status === 'future') {
    return (
      <div className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted/30">
        <span className="size-1.5 rounded-full bg-border" />
      </div>
    );
  }

  // partial — half green (left) / half red (right) with CSS conic-gradient
  return (
    <div
      className="size-9 rounded-full shadow-md ring-4 ring-amber-100 dark:ring-amber-500/20 flex items-center justify-center overflow-hidden"
      style={{
        background: 'conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg)',
      }}
    >
      <div className="size-4 rounded-full bg-white/90 dark:bg-background/90" />
    </div>
  );
}

function PaymentStatusBadge({
  status,
  paid,
  unpaid,
  partial,
}: {
  status: PaymentStatus;
  paid: string;
  unpaid: string;
  partial: string;
}) {
  if (status === 'future') return null;

  const configs = {
    full: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/30', dotBg: 'bg-emerald-500', label: paid },
    partial: { bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/30', dotBg: '', label: partial },
    none: { bg: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/30', dotBg: 'bg-red-500', label: unpaid },
    future: { bg: '', dotBg: '', label: '' },
  };

  const cfg = configs[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border', cfg.bg)}>
      {status === 'partial' ? (
        <span
          className="size-4 rounded-full flex-shrink-0"
          style={{ background: 'conic-gradient(#22c55e 0deg 180deg, #ef4444 180deg 360deg)' }}
        />
      ) : (
        <span className={cn('flex size-4 items-center justify-center rounded-full flex-shrink-0', cfg.dotBg)}>
          {status === 'full' ? <Check className="size-2.5 text-white stroke-[3]" /> : <X className="size-2.5 text-white stroke-[3]" />}
        </span>
      )}
      {cfg.label}
    </span>
  );
}

function PaymentStatusCircle({
  status,
  paidLabel,
  partialLabel,
  unpaidLabel,
  locale,
}: {
  status: PaymentStatus;
  paidLabel: string;
  partialLabel: string;
  unpaidLabel: string;
  locale: string;
}) {
  const now = new Date();
  const monthName = new Intl.DateTimeFormat(locale === 'kg' ? 'ru' : locale, {
    month: 'long',
    year: 'numeric',
  }).format(now);

  const label = status === 'full' ? paidLabel : status === 'partial' ? partialLabel : unpaidLabel;
  const textColor =
    status === 'full' ? 'text-emerald-600 dark:text-emerald-400' :
    status === 'partial' ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2.5">
      <MonthCircle status={status} />
      <div>
        <p className={cn('text-sm font-bold', textColor)}>{label}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{monthName}</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl md:col-span-2" />
      </div>
      <Skeleton className="h-48 rounded-xl" />
    </div>
  );
}
