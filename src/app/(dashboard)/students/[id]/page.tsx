'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useStudentDetail } from '@/hooks/useStudents';
import { usePayments, useDeletePayment } from '@/hooks/useFinance';
import { AddPaymentModal } from '@/components/finance/AddPaymentModal';
import { ReceiptDialog } from '@/components/finance/ReceiptDialog';
import type { Payment } from '@/types/finance';
import { useTranslations, useLocale } from '@/i18n/index';
import { useAuthStore } from '@/store/auth.store';
import { queryKeys } from '@/lib/api/query-keys';
import { enrollmentService } from '@/services/enrollments';
import {
  ArrowLeft, BookOpen, Calendar, Check, CreditCard,
  GraduationCap, Loader2, MapPin, Pencil, Phone, Plus, Printer, Trash2, User, Users, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  ratio: number; // 0..1+ (paid / expected for that month)
  status: PaymentStatus;
  isCurrent: boolean;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [savingDiscount, setSavingDiscount] = useState(false);
  const t = useTranslations('students');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const orgId = user?.organization_id;

  const saveDiscount = async (enrollmentId: string) => {
    setSavingDiscount(true);
    try {
      const amount = parseFloat(discountInput) || 0;
      await enrollmentService.update(enrollmentId, { discount_amount: amount });
      await queryClient.invalidateQueries({ queryKey: [...queryKeys.students.all(orgId), 'student-detail', studentId] });
      setEditingDiscountId(null);
    } finally {
      setSavingDiscount(false);
    }
  };

  const { data: student, isLoading, isError } = useStudentDetail(studentId);
  const paymentsQuery = usePayments({ student_id: studentId, limit: 100 }, !!studentId);
  const deletePayment = useDeletePayment();

  const payments = paymentsQuery.data?.items ?? [];
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const expectedMonthlyFee = Number(student?.expected_monthly_fee ?? 0);

  const monthlyData = useMemo<MonthData[]>(() => {
    const totals = new Array(12).fill(0);
    payments.forEach((p) => {
      const d = new Date(p.paid_at);
      if (d.getFullYear() === currentYear) {
        totals[d.getMonth()] += p.amount;
      }
    });

    return totals.map((total, month) => {
      const ratio = expectedMonthlyFee > 0 ? total / expectedMonthlyFee : (total > 0 ? 1 : 0);
      let status: PaymentStatus = 'none';
      if (month > currentMonth) {
        status = 'future';
      } else if (total === 0) {
        status = 'none';
      } else if (ratio >= 1) {
        status = 'full';
      } else {
        status = 'partial';
      }
      return { month, total, ratio, status, isCurrent: month === currentMonth };
    });
  }, [payments, currentYear, currentMonth, expectedMonthlyFee]);

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
            <h1 className="text-h1 tracking-tight">{student.name}</h1>
            {!paymentsQuery.isLoading && (
              <PaymentStatusBadge
                status={currentMonthData?.status ?? 'none'}
                paid={t('payment_badge_paid')}
                unpaid={t('payment_badge_unpaid')}
                partial={t('payment_badge_partial')}
              />
            )}
          </div>
          <p className="text-body text-muted-foreground">{t('profile_subtitle')}</p>
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
              <p className="text-caption text-muted-foreground">{t('status_label')}</p>
              <Badge
                variant="outline"
                className={cn(
                  'mt-1 rounded-full',
                  student.status === 'ACTIVE'
                    ? 'border-success/30 bg-success-muted text-success-emphasis dark:border-success/30 dark:bg-success/10 dark:text-success-emphasis'
                    : 'border-border bg-muted text-foreground dark:border-border dark:bg-card dark:text-muted-foreground',
                )}
              >
                {student.status === 'ACTIVE' ? t('status_active') : t('status_inactive')}
              </Badge>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">{t('current_month_payment')}</p>
              <div className="mt-2">
                {paymentsQuery.isLoading ? (
                  <div className="size-10 rounded-full bg-muted animate-pulse" />
                ) : (
                  <PaymentStatusCircle
                    status={currentMonthData?.status ?? 'none'}
                    ratio={currentMonthData?.ratio ?? 0}
                    paid={currentMonthData?.total ?? 0}
                    expected={expectedMonthlyFee}
                    paidLabel={t('month_paid_full')}
                    partialLabel={t('month_paid_partial')}
                    unpaidLabel={t('month_not_paid')}
                    locale={locale}
                  />
                )}
              </div>
            </div>

            <div>
              <p className="text-caption text-muted-foreground">
                <Phone className="mr-1 inline size-3.5" />
                {t('phone')}
              </p>
              <p className="mt-1 text-h4">{student.phone}</p>
            </div>

            {student.address && (
              <div>
                <p className="text-caption text-muted-foreground">
                  <MapPin className="mr-1 inline size-3.5" />
                  {t('address_label')}
                </p>
                <p className="mt-1 text-body">{student.address}</p>
              </div>
            )}

            {student.parent && (
              <div>
                <p className="text-caption text-muted-foreground">
                  <Users className="mr-1 inline size-3.5" />
                  {t('parent_guardian')}
                </p>
                <p className="mt-1 text-body">{student.parent}</p>
              </div>
            )}

            {student.parent_phone && (
              <div>
                <p className="text-caption text-muted-foreground">
                  <Phone className="mr-1 inline size-3.5" />
                  {t('parent_phone')}
                </p>
                <p className="mt-1 text-h4">{student.parent_phone}</p>
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
                <p className="text-h4">{t('no_enrollments')}</p>
                <p className="text-caption text-muted-foreground">{t('no_enrollments_desc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.enrollments.map((enrollment) => {
                  const monthlyFee = Number(enrollment.monthly_fee ?? 0);
                  const coursePrice = Number(enrollment.group?.course?.price ?? 0);
                  const baseFee = monthlyFee > 0 ? monthlyFee : coursePrice;
                  const discount = Number(enrollment.discount_amount ?? 0);
                  const netFee = Math.max(0, baseFee - discount);
                  const isEditing = editingDiscountId === enrollment.id;
                  return (
                    <Card key={enrollment.id} className="border-border/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-foreground">{enrollment.group?.name ?? '-'}</h4>
                            {enrollment.group?.course && (
                              <p className="mt-1 text-body text-muted-foreground">
                                <BookOpen className="mr-1 inline size-3.5" />
                                {enrollment.group.course.title}
                              </p>
                            )}
                            {enrollment.group?.teacher && (
                              <p className="mt-1 text-body text-muted-foreground">
                                <User className="mr-1 inline size-3.5" />
                                {enrollment.group.teacher.full_name}
                              </p>
                            )}
                            <p className="mt-2 text-caption text-muted-foreground">
                              <Calendar className="mr-1 inline size-3" />
                              {format(new Date(enrollment.enrolled_at), 'MMM dd, yyyy')}
                            </p>

                            {/* Discount edit row */}
                            {isEditing ? (
                              <div className="mt-3 flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  step="1"
                                  className="h-8 w-32 rounded-lg text-body"
                                  placeholder="0 сом"
                                  value={discountInput}
                                  onChange={(e) => setDiscountInput(e.target.value)}
                                  autoFocus
                                  disabled={savingDiscount}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveDiscount(enrollment.id);
                                    if (e.key === 'Escape') setEditingDiscountId(null);
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-success-emphasis hover:bg-success-muted hover:text-success-emphasis"
                                  onClick={() => saveDiscount(enrollment.id)}
                                  disabled={savingDiscount}
                                >
                                  {savingDiscount ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="size-8"
                                  onClick={() => setEditingDiscountId(null)}
                                  disabled={savingDiscount}
                                >
                                  <X className="size-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <button
                                className="mt-2 flex items-center gap-1 text-caption text-muted-foreground/60 hover:text-warning-emphasis transition-colors"
                                onClick={() => {
                                  setDiscountInput(discount > 0 ? String(discount) : '');
                                  setEditingDiscountId(enrollment.id);
                                }}
                              >
                                <Pencil className="size-3" />
                                {t('edit_discount')}
                              </button>
                            )}
                          </div>
                          {baseFee > 0 && (
                            <div className="shrink-0 text-right">
                              {discount > 0 ? (
                                <>
                                  <p className="text-caption text-muted-foreground line-through tabular-nums">
                                    {formatAmount(baseFee)}
                                  </p>
                                  <p className="text-h4 tabular-nums text-success-emphasis">
                                    {formatAmount(netFee)}
                                  </p>
                                  <Badge variant="outline" className="mt-1 rounded-full border-warning/70 bg-warning-muted text-caption font-bold text-warning-emphasis dark:border-warning/30 dark:bg-warning/10 dark:text-warning-emphasis">
                                    −{formatAmount(discount)}
                                  </Badge>
                                </>
                              ) : (
                                <p className="text-h4 tabular-nums text-foreground">
                                  {formatAmount(baseFee)}
                                </p>
                              )}
                              <p className="text-caption font-semibold uppercase tracking-wider text-muted-foreground/60 mt-1">
                                /{t('per_month_short')}
                              </p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
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
            className="rounded-xl bg-success hover:bg-success/90 text-success-foreground h-9"
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
              <p className="text-h4">{t('no_payments_title')}</p>
              <p className="text-caption text-muted-foreground">{t('no_payments_desc')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-success/10">
                      <CreditCard className="size-4 text-success-emphasis" />
                    </div>
                    <div>
                      <p className="text-h4 text-success-emphasis">+{formatAmount(payment.amount)}</p>
                      <p className="text-caption text-muted-foreground">
                        {format(new Date(payment.paid_at), 'dd MMM yyyy')}
                        {payment.description && <span> · {payment.description}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-caption px-2 py-0.5">
                      {payment.method}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg text-success-emphasis/70 hover:text-success-emphasis hover:bg-success/10"
                      title="Квитанция"
                      onClick={() =>
                        setReceiptPayment({
                          ...payment,
                          student_name: payment.student_name ?? student.name,
                        })
                      }
                    >
                      <Printer className="size-3.5" />
                    </Button>
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

      <ReceiptDialog
        payment={receiptPayment}
        open={receiptPayment !== null}
        onClose={() => setReceiptPayment(null)}
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
      {data.map(({ month, total, ratio, status, isCurrent }) => (
        <div
          key={month}
          title={`${getMonthName(month)}: ${getLabel(status)}${total > 0 ? ' — ' + formatAmount(total) : ''}`}
          className={cn(
            'group flex flex-col items-center gap-2 rounded-2xl border p-3 transition-all duration-200',
            isCurrent && 'ring-2 ring-offset-1',
            status === 'full' && 'border-success/30 bg-success-muted/50 ring-success/30 dark:border-success/30 dark:bg-success/5',
            status === 'partial' && 'border-warning/30 bg-warning-muted/50 ring-warning/30 dark:border-warning/30 dark:bg-warning/5',
            status === 'none' && 'border-danger/30 bg-danger-muted/50 ring-danger/30 dark:border-danger/30 dark:bg-danger/5',
            status === 'future' && 'border-border/40 bg-muted/20 opacity-50 ring-border',
          )}
        >
          <span className="text-caption font-bold uppercase tracking-wider text-muted-foreground">
            {getMonthName(month)}
          </span>
          <MonthCircle status={status} ratio={ratio} />
          {total > 0 && (
            <span className="text-caption font-bold tabular-nums text-muted-foreground leading-none">
              {new Intl.NumberFormat('ru-RU', { notation: 'compact' }).format(total)} сом
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function MonthCircle({ status, ratio = 0 }: { status: PaymentStatus; ratio?: number }) {
  if (status === 'full') {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-success shadow-md ring-4 ring-success/30 dark:ring-success/20">
        <Check className="size-4 text-background stroke-[3]" />
      </div>
    );
  }

  if (status === 'none') {
    return (
      <div className="flex size-9 items-center justify-center rounded-full bg-danger shadow-md ring-4 ring-danger/30 dark:ring-danger/20">
        <X className="size-4 text-background stroke-[3]" />
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

  // partial — conic gradient reflects actual paid ratio (green) vs outstanding (red).
  const clamped = Math.max(0, Math.min(1, ratio));
  const paidDeg = clamped * 360;
  const percent = Math.round(clamped * 100);
  return (
    <div
      className="size-9 rounded-full shadow-md ring-4 ring-warning/30 dark:ring-warning/20 flex items-center justify-center overflow-hidden"
      style={{
        background: `conic-gradient(hsl(var(--success)) 0deg ${paidDeg}deg, hsl(var(--danger)) ${paidDeg}deg 360deg)`,
      }}
      title={`${percent}%`}
    >
      <div className="flex size-5 items-center justify-center rounded-full bg-card dark:bg-background/95">
        <span className="text-caption font-semibold tabular-nums text-foreground/80 leading-none">
          {percent}
        </span>
      </div>
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
    full: { bg: 'bg-success-muted text-success-emphasis border-success/30 dark:bg-success/10 dark:text-success-emphasis dark:border-success/30', dotBg: 'bg-success', label: paid },
    partial: { bg: 'bg-warning-muted text-warning-emphasis border-warning/30 dark:bg-warning/10 dark:text-warning-emphasis dark:border-warning/30', dotBg: '', label: partial },
    none: { bg: 'bg-danger-muted text-danger-emphasis border-danger/30 dark:bg-danger/10 dark:text-danger-emphasis dark:border-danger/30', dotBg: 'bg-danger', label: unpaid },
    future: { bg: '', dotBg: '', label: '' },
  };

  const cfg = configs[status];

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-caption border', cfg.bg)}>
      {status === 'partial' ? (
        <span
          className="size-4 rounded-full flex-shrink-0"
          style={{ background: 'conic-gradient(hsl(var(--success)) 0deg 180deg, hsl(var(--danger)) 180deg 360deg)' }}
        />
      ) : (
        <span className={cn('flex size-4 items-center justify-center rounded-full flex-shrink-0', cfg.dotBg)}>
          {status === 'full' ? <Check className="size-2.5 text-background stroke-[3]" /> : <X className="size-2.5 text-background stroke-[3]" />}
        </span>
      )}
      {cfg.label}
    </span>
  );
}

function PaymentStatusCircle({
  status,
  ratio = 0,
  paid,
  expected,
  paidLabel,
  partialLabel,
  unpaidLabel,
  locale,
}: {
  status: PaymentStatus;
  ratio?: number;
  paid?: number;
  expected?: number;
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
    status === 'full' ? 'text-success-emphasis' :
    status === 'partial' ? 'text-warning-emphasis' :
    'text-danger-emphasis';

  return (
    <div className="flex items-center gap-2.5">
      <MonthCircle status={status} ratio={ratio} />
      <div>
        <p className={cn('text-h4', textColor)}>{label}</p>
        <p className="text-caption text-muted-foreground capitalize">{monthName}</p>
        {expected !== undefined && expected > 0 && status !== 'future' && (
          <p className="text-caption font-semibold tabular-nums text-muted-foreground/80 mt-0.5">
            {formatAmount(paid ?? 0)} / {formatAmount(expected)}
          </p>
        )}
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
