import { ImageResponse } from 'next/og';

// Route segment config — Next.js generates this at build/request time.
export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = "Bilim Nuru — O'quv markaz uchun CRM + LMS";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '80px',
          background:
            'linear-gradient(135deg, #0B1437 0%, #1E3A8A 50%, #312E81 100%)',
          color: 'white',
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        }}
      >
        {/* Top: brand mark */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background:
                'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
              fontWeight: 800,
              color: 'white',
            }}
          >
            BN
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: 4,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Bilim Nuru
          </div>
        </div>

        {/* Middle: headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -3,
              maxWidth: '900px',
            }}
          >
            O&#39;quv markazingiz uchun CRM + LMS
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 400,
              lineHeight: 1.3,
              opacity: 0.75,
              maxWidth: '850px',
            }}
          >
            O&#39;quvchilar, guruhlar, to&#39;lovlar, dars jadvali — bir
            joyda.
          </div>
        </div>

        {/* Bottom: URL + tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            fontSize: 22,
            opacity: 0.55,
          }}
        >
          <div>bilimnuru.uz</div>
          <div
            style={{
              padding: '8px 20px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.25)',
              fontSize: 18,
              letterSpacing: 1,
            }}
          >
            EDUCATION OS
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
