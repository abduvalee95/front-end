'use client';

import { forwardRef } from 'react';
import type { Payment, PaymentMethod } from '@/types/finance';
import { useTranslations } from '@/i18n/index';
import { formatAmount } from './utils';

export type ReceiptFormat = 'A4' | 'THERMAL_80';

interface ReceiptProps {
  payment: Payment;
  organizationName: string;
  format: ReceiptFormat;
}

function formatReceiptDate(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}` +
    ` ${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

/**
 * Pure presentational receipt component.
 * Uses explicit hex/RGB styles (not Tailwind color utilities) to stay compatible
 * with html2canvas-pro when rendering to PDF — Tailwind v4 emits oklch() which
 * html2canvas 1.x cannot parse.
 */
export const Receipt = forwardRef<HTMLDivElement, ReceiptProps>(function Receipt(
  { payment, organizationName, format },
  ref,
) {
  const tFinance = useTranslations('finance');

  function methodLabel(method: PaymentMethod): string {
    const key = `method_${method.toLowerCase()}` as 'method_cash' | 'method_card' | 'method_transfer';
    return tFinance(key);
  }

  const isA4 = format === 'A4';

  const containerStyle: React.CSSProperties = isA4
    ? {
        width: '210mm',
        maxWidth: '210mm',
        minHeight: '150mm',
        backgroundColor: '#ffffff',
        color: '#111111',
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        padding: '20mm 18mm',
        boxSizing: 'border-box',
        fontSize: '13px',
        lineHeight: 1.5,
      }
    : {
        width: '80mm',
        maxWidth: '80mm',
        backgroundColor: '#ffffff',
        color: '#111111',
        fontFamily: "'Arial', 'Helvetica Neue', sans-serif",
        padding: '4mm 5mm',
        boxSizing: 'border-box',
        fontSize: '10px',
        lineHeight: 1.4,
      };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    borderBottom: '2px solid #111111',
    paddingBottom: isA4 ? '10px' : '6px',
    marginBottom: isA4 ? '14px' : '8px',
  };

  const orgNameStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: isA4 ? '18px' : '13px',
    letterSpacing: '0.02em',
    margin: 0,
  };

  const receiptTitleStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: isA4 ? '13px' : '10px',
    color: '#444444',
    margin: '4px 0 0 0',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: isA4 ? '6px 0' : '4px 0',
    borderBottom: '1px solid #e5e5e5',
  };

  const labelStyle: React.CSSProperties = {
    color: '#666666',
    fontSize: isA4 ? '12px' : '9px',
    flexShrink: 0,
    marginRight: '8px',
  };

  const valueStyle: React.CSSProperties = {
    fontWeight: 600,
    fontSize: isA4 ? '13px' : '10px',
    color: '#111111',
    textAlign: 'right' as const,
  };

  const amountRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: isA4 ? '10px 0' : '7px 0',
    borderTop: '2px solid #111111',
    borderBottom: '2px solid #111111',
    margin: isA4 ? '10px 0' : '7px 0',
  };

  const amountLabelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: isA4 ? '14px' : '11px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase' as const,
  };

  const amountValueStyle: React.CSSProperties = {
    fontWeight: 800,
    fontSize: isA4 ? '20px' : '14px',
  };

  const signatureAreaStyle: React.CSSProperties = {
    marginTop: isA4 ? '24px' : '14px',
    display: 'flex',
    justifyContent: 'space-between',
    gap: isA4 ? '40px' : '20px',
  };

  const signatureLineStyle: React.CSSProperties = {
    flex: 1,
  };

  const signatureLabelStyle: React.CSSProperties = {
    fontSize: isA4 ? '11px' : '8px',
    color: '#666666',
    marginBottom: '20px',
  };

  const signatureDividerStyle: React.CSSProperties = {
    borderTop: '1px solid #aaaaaa',
    marginTop: '2px',
  };

  const footerStyle: React.CSSProperties = {
    marginTop: isA4 ? '16px' : '10px',
    textAlign: 'center',
    fontSize: isA4 ? '10px' : '8px',
    color: '#999999',
  };

  return (
    <div ref={ref} style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <p style={orgNameStyle}>{organizationName}</p>
        <p style={receiptTitleStyle}>To&apos;lov kvitansiyasi / Квитанция об оплате</p>
      </div>

      {/* Receipt meta */}
      <div style={{ marginBottom: isA4 ? '12px' : '8px' }}>
        <div style={rowStyle}>
          <span style={labelStyle}>Kvitansiya №</span>
          <span style={valueStyle}>{payment.receipt_number ?? payment.id.slice(0, 8).toUpperCase()}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>Sana / Vaqt</span>
          <span style={valueStyle}>{formatReceiptDate(payment.paid_at)}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>O&apos;quvchi</span>
          <span style={valueStyle}>{payment.student_name ?? '—'}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>To&apos;lov usuli</span>
          <span style={valueStyle}>{methodLabel(payment.method)}</span>
        </div>
        {payment.description && (
          <div style={rowStyle}>
            <span style={labelStyle}>Izoh</span>
            <span style={{ ...valueStyle, maxWidth: '60%', wordBreak: 'break-word' as const }}>
              {payment.description}
            </span>
          </div>
        )}
      </div>

      {/* Amount */}
      <div style={amountRowStyle}>
        <span style={amountLabelStyle}>Jami to&apos;lov</span>
        <span style={amountValueStyle}>{formatAmount(payment.amount)}</span>
      </div>

      {/* Signature lines */}
      <div style={signatureAreaStyle}>
        <div style={signatureLineStyle}>
          <p style={signatureLabelStyle}>Kassir imzosi</p>
          <div style={signatureDividerStyle} />
        </div>
        <div style={signatureLineStyle}>
          <p style={signatureLabelStyle}>To&apos;lovchi imzosi</p>
          <div style={signatureDividerStyle} />
        </div>
      </div>

      {/* Footer */}
      <p style={footerStyle}>
        Ushbu kvitansiya to&apos;lovni tasdiqlaydi. Saqlang.
      </p>
    </div>
  );
});
