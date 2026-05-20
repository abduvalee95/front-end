'use client';

import { useState } from 'react';
import { useTeacherSalary, useTeacherSalaryHistory, usePayTeacherSalary } from '@/hooks/useTeachers';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react';

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
  const [month, setMonth] = useState(currentMonth());
  const { data: preview, isLoading } = useTeacherSalary(teacherId, month);
  const { data: history } = useTeacherSalaryHistory(teacherId);
  const payMutation = usePayTeacherSalary();

  // Check if current month is already paid in history
  const isPaid = history?.some(r => r.period === month && r.status === 'PAID');

  const handlePay = () => {
    payMutation.mutate({ teacherId, month }, {
      onSuccess: () => toast.success(`${formatPeriod(month)} maoshi to'landi`),
      onError: () => toast.error("Xatolik yuz berdi"),
    });
  };

  const salaryTypeLabel: Record<string, string> = {
    HOURLY: 'Soatbay',
    FIXED: 'Belgilangan',
    GROUP_PERCENT: 'Guruhdan foiz',
    MONTHLY: 'Oylik',
    DAILY: 'Kunlik',
  };

  return (
    <div className="space-y-6">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-base capitalize">{formatPeriod(month)}</span>
        <Button variant="ghost" size="icon" onClick={() => setMonth(m => shiftMonth(m, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Salary card */}
      {isLoading ? (
        <div className="text-center text-muted-foreground py-8">Hisoblanmoqda...</div>
      ) : preview ? (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Maosh turi</p>
              <p className="font-medium">{salaryTypeLabel[preview.salary_type] ?? preview.salary_type}</p>
            </div>
            {isPaid ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" /> To&apos;langan
              </Badge>
            ) : (
              <Badge variant="outline" className="text-orange-600 border-orange-300">
                <Clock className="h-3 w-3 mr-1" /> Kutilmoqda
              </Badge>
            )}
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Jami maosh</p>
            <p className="text-2xl font-bold">{formatMoney(preview.amount)}</p>
          </div>

          {/* Breakdown */}
          <div className="text-sm text-muted-foreground space-y-1 border-t pt-3">
            {preview.salary_type === 'HOURLY' && (
              <>
                <p>Darslar soni: <span className="text-foreground font-medium">{String(preview.breakdown.lesson_count)}</span></p>
                <p>Soat narxi: <span className="text-foreground font-medium">{formatMoney(Number(preview.breakdown.hourly_rate))}</span></p>
              </>
            )}
            {preview.salary_type === 'GROUP_PERCENT' && (
              <>
                <p>Talabalar to&apos;lovi: <span className="text-foreground font-medium">{formatMoney(Number(preview.breakdown.total_student_payments))}</span></p>
                <p>Foiz: <span className="text-foreground font-medium">{String(preview.breakdown.percent_rate)}%</span></p>
                <p>To&apos;lovlar soni: <span className="text-foreground font-medium">{String(preview.breakdown.payment_count)}</span></p>
              </>
            )}
          </div>

          {!isPaid && (
            <Button
              className="w-full"
              onClick={handlePay}
              disabled={payMutation.isPending || preview.amount === 0}
            >
              {payMutation.isPending ? "To'lanmoqda..." : `${formatMoney(preview.amount)} to'lash`}
            </Button>
          )}
        </div>
      ) : null}

      {/* History */}
      {history && history.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">Tarix</h3>
          <div className="space-y-2">
            {history.map(record => (
              <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-medium capitalize">{formatPeriod(record.period)}</p>
                  <p className="text-xs text-muted-foreground">{salaryTypeLabel[record.salary_type]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatMoney(record.amount)}</p>
                  <Badge variant={record.status === 'PAID' ? 'default' : 'outline'} className="text-xs">
                    {record.status === 'PAID' ? "To'langan" : 'Kutilmoqda'}
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
