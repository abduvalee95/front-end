'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FileDown, Printer, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from '@/i18n/index';
import { useOrganizationSettings } from '@/hooks/useOrganization';
import { useAuthStore } from '@/store/auth.store';
import { printReceipt } from '@/lib/receipt/print';
import { downloadReceiptPdf } from '@/lib/receipt/pdf';
import type { Payment } from '@/types/finance';
import { Receipt, type ReceiptFormat } from './Receipt';

interface ReceiptDialogProps {
  payment: Payment | null;
  open: boolean;
  onClose: () => void;
}

export function ReceiptDialog({ payment, open, onClose }: ReceiptDialogProps) {
  const t = useTranslations('receipt');
  const orgSettingsQuery = useOrganizationSettings();
  const orgNameFallback = useAuthStore((s) => s.user?.organization_name ?? '');
  const organizationName =
    orgSettingsQuery.data?.name || orgNameFallback || 'Tashkilot';

  // The ref points to the currently selected format's receipt node
  const a4Ref = useRef<HTMLDivElement>(null);
  const thermalRef = useRef<HTMLDivElement>(null);

  const [isPdfLoading, setIsPdfLoading] = useState(false);

  if (!payment) return null;

  function getRef(format: ReceiptFormat) {
    return format === 'A4' ? a4Ref : thermalRef;
  }

  function handlePrint(format: ReceiptFormat) {
    const node = getRef(format).current;
    if (!node) return;
    try {
      printReceipt(node, format);
    } catch {
      toast.error(t('print_failed'));
    }
  }

  async function handlePdf(format: ReceiptFormat) {
    const node = getRef(format).current;
    if (!node) return;
    const receiptNum = payment!.receipt_number ?? payment!.id.slice(0, 8).toUpperCase();
    const filename = `kvitansiya-${receiptNum}-${format.toLowerCase()}`;
    setIsPdfLoading(true);
    try {
      await downloadReceiptPdf(node, filename, format);
    } catch {
      toast.error(t('pdf_failed'));
    } finally {
      setIsPdfLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="sm:max-w-2xl"
        // Prevent the default close button since we add our own in the footer
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('title')}</DialogTitle>
            <Button variant="ghost" size="icon-sm" className="rounded-lg" onClick={onClose}>
              <X className="size-4" />
              <span className="sr-only">{t('close')}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Receipt previews — both rendered but only one visible at a time via overflow */}
        <div className="space-y-3">
          {/* Format toggle label */}
          <p className="text-xs text-muted-foreground font-medium">
            {t('preview_label')}
          </p>

          {/* Scrollable receipt preview container */}
          <div
            className="rounded-xl border border-border/50 bg-gray-50 overflow-auto"
            style={{ maxHeight: '60vh' }}
          >
            {/* A4 receipt — off-screen, captured for print/pdf A4 actions */}
            <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }} aria-hidden>
              <Receipt
                ref={a4Ref}
                payment={payment}
                organizationName={organizationName}
                format="A4"
              />
            </div>
            {/* Thermal receipt — off-screen, captured for thermal actions */}
            <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none' }} aria-hidden>
              <Receipt
                ref={thermalRef}
                payment={payment}
                organizationName={organizationName}
                format="THERMAL_80"
              />
            </div>

            {/* A4 visual preview (displayed, scrollable) */}
            <div className="flex justify-center p-4">
              <div className="shadow-md">
                <Receipt
                  payment={payment}
                  organizationName={organizationName}
                  format="A4"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {/* A4 actions */}
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => handlePrint('A4')}
            disabled={isPdfLoading}
          >
            <Printer className="size-3.5" />
            {t('print_a4')}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => handlePdf('A4')}
            disabled={isPdfLoading}
          >
            <FileDown className="size-3.5" />
            {t('pdf_a4')}
          </Button>

          {/* Thermal actions */}
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => handlePrint('THERMAL_80')}
            disabled={isPdfLoading}
          >
            <Printer className="size-3.5" />
            {t('print_thermal')}
          </Button>
          <Button
            variant="outline"
            className="rounded-xl gap-1.5"
            onClick={() => handlePdf('THERMAL_80')}
            disabled={isPdfLoading}
          >
            <FileDown className="size-3.5" />
            {t('pdf_thermal')}
          </Button>

          <Button
            variant="ghost"
            className="rounded-xl ml-auto"
            onClick={onClose}
          >
            {t('close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
