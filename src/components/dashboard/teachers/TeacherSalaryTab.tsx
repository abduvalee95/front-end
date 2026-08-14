'use client';

import { useState } from 'react';
import { useTeacherSalary, useTeacherSalaryHistory, usePayTeacherSalary } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';
import { useTranslations } from '@/i18n/index';

// Format month for display: "2026-05" -> "May 2026"
function formatPeriod(period: string) {
  const [y, m] = period.split('-');
  return new Date(Number(y), Number(m) - 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
}

// Format currency
function formatMoney(amount: number) {
  return new Intl.NumberFormat('ru-KG').format(Math.round(amount)) + ' сом';
}

// Current month as YYYY-MM
function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

// Navigate month: direction = +1 or -1
function shiftMonth(period: string, direction: number): string {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 1 + direction, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

interface Props {
  teacherId: string;
  teacherName: string;
}

export function TeacherSalaryTab({ teacherId, teacherName: _teacherName }: Props) {
  const t = useTranslations('teachers');
  const tCommon = useTranslations('common');
  const [month, setMonth] = useState(currentMonth());
  const { data: preview, isLoading } = useTeacherSalary(teacherId, month);
  const { data: history } = useTeacherSalaryHistory(teacherId);
  const payMutation = usePayTeacherSalary();

  // Check if current month is already paid in history
  const isPaid = history?.some(r => r.period === month && r.status === 'PAID');

  const handlePay = () => {
    payMutation.mutate({ teacherId, month }, {
      onSuccess: () => toast.success(t('salary_paid_toast', { period: formatPeriod(month) })),
      onError: () => toast.error(tCommon('error_generic')),
    });
  };

  const salaryTypeLabel: Record<string, string> = {
    HOURLY: t('hourly'),
    FIXED: t('fixed'),
    GROUP_PERCENT: t('group_percent'),
    MONTHLY: t('monthly'),
    DAILY: t('daily'),
  };

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-h3 capitalize">{formatPeriod(month)}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Salary card */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">{t('calculating')}</div>
      ) : preview ? (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body text-muted-foreground">{t('salary_type')}</p>
              <p className="font-medium">{salaryTypeLabel[preview.salary_type] ?? preview.salary_type}</p>
            </div>
            {isPaid ? (
              <Badge className="bg-success-muted text-success-emphasis border-success/30">
                <CheckCircle2 className="h-3 w-3 mr-1" /> {t('paid')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-warning-emphasis border-warning/30">
                <Clock className="h-3 w-3 mr-1" /> {t('pending')}
              </Badge>
            )}
          </div>
          <div>
            <p className="text-body text-muted-foreground">{t('total_salary')}</p>
            <p className="text-h1">{formatMoney(preview.amount)}</p>
          </div>

          {/* Breakdown */}
          <div className="text-body text-muted-foreground space-y-1 border-t pt-3">
            {preview.salary_type === 'HOURLY' && (
              <>
                <p>{t('lessons_count')} <span className="text-foreground font-medium">{String(preview.breakdown.lesson_count)}</span></p>
                <p>{t('hourly_rate')} <span className="text-foreground font-medium">{formatMoney(Number(preview.breakdown.hourly_rate))}</span></p>
              </>
            )}
            {preview.salary_type === 'GROUP_PERCENT' && (
              <>
                <p>{t('student_payments')} <span className="text-foreground font-medium">{formatMoney(Number(preview.breakdown.total_student_payments))}</span></p>
                <p>{t('percent_rate')} <span className="text-foreground font-medium">{String(preview.breakdown.percent_rate)}%</span></p>
                <p>{t('payment_count')} <span className="text-foreground font-medium">{String(preview.breakdown.payment_count)}</span></p>
              </>
            )}
          </div>

          {!isPaid && (
            <Button
              className="w-full"
              onClick={handlePay}
              disabled={payMutation.isPending || preview.amount === 0}
            >
              {payMutation.isPending ? t('paying') : t('pay_amount', { amount: formatMoney(preview.amount) })}
            </Button>
          )}
        </div>
      ) : null}

      {/* History */}
      {history && history.length > 0 && (
        <div>
          <h3 className="text-h4 text-muted-foreground mb-3">{t('history')}</h3>
          <div className="space-y-2">
            {history.map(record => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-h4 capitalize">{formatPeriod(record.period)}</p>
                  <p className="text-caption text-muted-foreground">{salaryTypeLabel[record.salary_type]}</p>
                </div>
                <div className="text-right">
                  <p className="text-h4">{formatMoney(record.amount)}</p>
                  <Badge variant={record.status === 'PAID' ? 'default' : 'outline'} className="text-caption">
                    {record.status === 'PAID' ? t('paid') : t('pending')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
