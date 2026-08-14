'use client';

import { useForm } from 'react-hook-form';
import { useTranslations } from '@/i18n/index';
import { Loader2, Plus, TrendingDown } from 'lucide-react';
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
import { useCreateExpense } from '@/hooks/useFinance';
import type { CreateExpenseDto, ExpenseCategory } from '@/types/finance';

interface AddExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: 'RENT', label: 'Rent' },
  { value: 'SALARY', label: 'Salary' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'OTHER', label: 'Other' },
];

type FormValues = {
  amount: string;
  category: ExpenseCategory;
  description: string;
};

export function AddExpenseModal({ open, onClose }: AddExpenseModalProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');
  const createExpense = useCreateExpense();

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      amount: '',
      category: 'OTHER',
      description: '',
    },
  });

  const categoryValue = watch('category');

  const onSubmit = (values: FormValues) => {
    const dto: CreateExpenseDto = {
      amount: parseFloat(values.amount),
      category: values.category,
      description: values.description,
    };
    createExpense.mutate(dto, {
      onSuccess: () => { reset(); onClose(); },
    });
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger/10 text-danger-emphasis">
              <TrendingDown className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('add_expense')}</DialogTitle>
              <DialogDescription>{t('record_organization_expense')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form id="add-expense-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-caption">{t('amount')} (KGS) *</Label>
              <Input
                type="number"
                min="0"
                step="1"
                placeholder={t('amount_placeholder')}
                className="rounded-xl"
                {...register('amount', { required: true, min: 1 })}
                disabled={createExpense.isPending}
              />
              {errors.amount && <p className="text-caption text-destructive">{tCommon('required')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label className="text-caption">{t('category')} *</Label>
              <Select
                value={categoryValue}
                onValueChange={(v) => setValue('category', (v ?? 'OTHER') as ExpenseCategory)}
                disabled={createExpense.isPending}
              >
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue>
                    {(v: string) =>
                      EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-caption">{tCommon('description')} ({tCommon('optional')})</Label>
            <Input
              placeholder={t('expense_description_placeholder')}
              className="rounded-xl"
              {...register('description')}
              disabled={createExpense.isPending}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={createExpense.isPending} className="rounded-xl">
            {tCommon('cancel')}
          </Button>
          <Button
            type="submit"
            form="add-expense-form"
            disabled={createExpense.isPending}
            
          >
            {createExpense.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            <Plus className="mr-1.5 size-4" />
            {t('add_expense')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
