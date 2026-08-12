'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from '@/i18n/index';
import { Loader2, Plus, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreatePayment } from '@/hooks/useFinance';
import { useStudents } from '@/hooks/useStudents';
import type { CreatePaymentDto, Payment, PaymentMethod } from '@/types/finance';
import { ReceiptDialog } from './ReceiptDialog';

interface AddPaymentModalProps {
  open: boolean;
  onClose: () => void;
  studentId?: string;
  studentName?: string;
}

type FormValues = {
  student_id: string;
  amount: string;
  method: PaymentMethod;
  description: string;
};

const METHOD_LABEL_KEYS = {
  CASH: 'method_cash',
  CARD: 'method_card',
  TRANSFER: 'method_transfer',
} as const;

export function AddPaymentModal({ open, onClose, studentId, studentName }: AddPaymentModalProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const createPayment = useCreatePayment();
  const studentsQuery = useStudents({ page: 1, limit: 500 }, open && !studentId);

  // After successful creation, store the returned payment to drive ReceiptDialog
  const [createdPayment, setCreatedPayment] = useState<Payment | null>(null);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      student_id: studentId ?? '',
      amount: '',
      method: 'CASH',
      description: '',
    },
  });

  const methodValue = watch('method');
  const studentValue = watch('student_id');

  // Base UI's <SelectValue /> renders the raw value ("CASH") unless it is told
  // how to turn a value into a label, so the trigger needs the mapping too —
  // the <SelectItem> children only cover the open dropdown.
  const methodLabel = (method: string) =>
    t(METHOD_LABEL_KEYS[method as PaymentMethod] ?? METHOD_LABEL_KEYS.CASH);

  const students = studentsQuery.data?.items ?? [];
  const selectedStudent = studentId
    ? { name: studentName ?? studentId, phone: '' }
    : students.find((s) => s.id === studentValue);

  const onSubmit = (values: FormValues) => {
    const dto: CreatePaymentDto = {
      student_id: studentId ?? values.student_id,
      amount: parseFloat(values.amount),
      method: values.method,
      description: values.description || undefined,
    };
    createPayment.mutate(dto, {
      onSuccess: (payment: Payment) => {
        reset();
        onClose(); // Close the create modal first
        setCreatedPayment(payment); // Then open receipt dialog
      },
    });
  };

  const handleClose = () => { reset(); onClose(); };

  const handleReceiptClose = () => {
    setCreatedPayment(null);
  };

  return (
    <>
      {/* Receipt dialog is a sibling — opens after the create modal closes */}
      <ReceiptDialog
        payment={createdPayment}
        open={createdPayment !== null}
        onClose={handleReceiptClose}
      />

    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <CreditCard className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('add_payment')}</DialogTitle>
              <DialogDescription>{t('record_new_payment')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="add-payment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">{tCommon('student')} *</Label>
            {studentId ? (
              <div className="flex h-9 items-center rounded-xl border border-border/60 bg-muted/40 px-3 text-sm font-medium">
                {studentName ?? studentId}
              </div>
            ) : (
              <>
                {/* The Select is not a native input, so the value is mirrored into a
                    registered hidden field — otherwise nothing validates it and an
                    empty student_id reaches the API. */}
                <input type="hidden" {...register('student_id', { required: true })} />
                <Select
                  value={studentValue}
                  onValueChange={(v) => setValue('student_id', v ?? '', { shouldValidate: true })}
                  disabled={createPayment.isPending}
                >
                  <SelectTrigger className="rounded-xl h-9">
                    {selectedStudent
                      ? <span className="truncate">{selectedStudent.name}{(selectedStudent as { phone?: string }).phone ? ` — ${(selectedStudent as { phone?: string }).phone}` : ''}</span>
                      : <SelectValue placeholder={tCommon('select_student')} />}
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px]">
                    {(studentsQuery.data?.items ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.student_id && <p className="text-xs text-destructive">{tCommon('required')}</p>}
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('amount')} (KGS) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder={t('amount_placeholder')}
                className="rounded-xl"
                {...register('amount', { required: true, min: 1 })}
                disabled={createPayment.isPending}
              />
              {errors.amount && <p className="text-xs text-destructive">{tCommon('required')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">{t('payment_type')} *</Label>
              <Select
                value={methodValue}
                onValueChange={(v) => setValue('method', (v ?? 'CASH') as PaymentMethod)}
                disabled={createPayment.isPending}
              >
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue>{(v: string) => methodLabel(v)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t('method_cash')}</SelectItem>
                  <SelectItem value="CARD">{t('method_card')}</SelectItem>
                  <SelectItem value="TRANSFER">{t('method_transfer')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{tCommon('description')} ({tCommon('optional')})</Label>
            <Input
              placeholder={t('description_placeholder')}
              className="rounded-xl"
              {...register('description')}
              disabled={createPayment.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createPayment.isPending} className="rounded-xl">
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            form="add-payment-form"
            disabled={createPayment.isPending}
            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {createPayment.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-1.5 size-4" />
            {t('add_payment')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
