import { notFound } from 'next/navigation';
import { AuthDesignPreview } from '@/components/auth/AuthDesignPreview';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Auth design preview', robots: { index: false, follow: false } };

export default function AuthPreviewPage() {
  if (process.env.AUTH_DESIGN_PREVIEW !== 'true') notFound();
  return <AuthDesignPreview />;
}
