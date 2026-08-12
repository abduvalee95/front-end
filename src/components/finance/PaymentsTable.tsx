'use client';

import { useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  Banknote,
  CreditCard,
  Loader2,
  Printer,
  ReceiptText,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import type { Payment, PaymentMethod } from '@/types/finance';
import { formatAmount, formatDate, getInitials, METHOD_TONES } from './utils';
import { ReceiptDialog } from './ReceiptDialog';

const METHOD_ICONS: Record<PaymentMethod, ReactNode> = {
  CASH: <Banknote className="size-3" />,
  CARD: <CreditCard className="size-3" />,
  TRANSFER: <ArrowLeftRight className="size-3" />,
};


interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
  onAddPayment: () => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function PaymentsTable({ payments, isLoading, onAddPayment, onDelete, isDeleting }: PaymentsTableProps) {
  const t = useTranslations('finance');
  const tCommon = useTranslations('common');

  function methodLabel(method: PaymentMethod): string {
    const key = `method_${method.toLowerCase()}` as 'method_cash' | 'method_card' | 'method_transfer';
    return t(key);
  }

  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  return (
    <>
      <ReceiptDialog
        payment={receiptPayment}
        open={receiptPayment !== null}
        onClose={() => setReceiptPayment(null)}
      />
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30 border-b border-border/40">
            <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 py-3 pl-4 w-[120px]">
              {tCommon('date')}
            </TableHead>
            <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
              {tCommon('student')}
            </TableHead>
            <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 text-right pr-4">
              {t('amount')}
            </TableHead>
            <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 hidden sm:table-cell">
              {t('payment_type')}
            </TableHead>
            <TableHead className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50 hidden md:table-cell">
              {tCommon('note')}
            </TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i} className="border-b border-border/30">
                <TableCell className="pl-4"><Skeleton className="h-3.5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-3.5 w-32" /></TableCell>
                <TableCell><Skeleton className="h-3.5 w-24 ml-auto" /></TableCell>
                <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                <TableCell className="hidden md:table-cell"><Skeleton className="h-3.5 w-28" /></TableCell>
                <TableCell />
              </TableRow>
            ))
          ) : payments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-14 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="size-12 rounded-2xl bg-success/10 flex items-center justify-center">
                    <ReceiptText className="size-5 text-success-emphasis" />
                  </div>
                  <p className="text-[13px] font-semibold text-muted-foreground/70">No payments yet</p>
                  <button
                    onClick={onAddPayment}
                    className="text-[12px] font-bold text-success-emphasis hover:text-success-emphasis underline-offset-2 hover:underline"
                  >
                    Record first payment
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            payments.map((p) => (
              <TableRow key={p.id} className="group border-b border-border/30 hover:bg-success/[0.03] transition-colors">
                <TableCell className="py-3 pl-4">
                  <span className="text-[11.5px] tabular-nums font-medium text-muted-foreground/60">
                    {formatDate(p.paid_at)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 shrink-0 rounded-lg bg-success/12 text-[9.5px] font-black text-success-emphasis flex items-center justify-center">
                      {p.student_name ? getInitials(p.student_name) : '?'}
                    </div>
                    <span className="text-[13px] font-semibold">{p.student_name ?? '—'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-4">
                  <span className="text-h4 tabular-nums text-success-emphasis">
                    +{formatAmount(p.amount)}
                  </span>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <Badge variant={METHOD_TONES[p.method]}>
                    {METHOD_ICONS[p.method]}
                    {methodLabel(p.method)}
                  </Badge>
                </TableCell>
                <TableCell className="text-[11.5px] text-muted-foreground/55 max-w-[160px] truncate hidden md:table-cell">
                  {p.description || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-foreground hover:bg-muted/60 transition-all"
                      onClick={() => setReceiptPayment(p)}
                      title={tCommon('print_receipt')}
                    >
                      <Printer className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 rounded-lg opacity-0 group-hover:opacity-100 text-destructive/40 hover:text-destructive hover:bg-destructive/8 transition-all"
                      onClick={() => onDelete(p.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3.5" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
