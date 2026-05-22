'use client';

import { useEffect } from 'react';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('[GLOBAL ERROR]', error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: '#fafafa',
        color: '#111',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            fontSize: 32,
          }}>
            ⚠️
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
            Критическая ошибка
          </h1>

          <p style={{ fontSize: 14, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>
            В приложении произошла непредвиденная ошибка. Пожалуйста, перезагрузите страницу.
          </p>

          <button
            onClick={reset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#2563eb',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
            onMouseOver={(e) => { (e.target as HTMLButtonElement).style.background = '#1d4ed8'; }}
            onMouseOut={(e) => { (e.target as HTMLButtonElement).style.background = '#2563eb'; }}
          >
            🔄 Перезагрузить
          </button>
        </div>
      </body>
    </html>
  );
}
