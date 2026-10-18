import { Suspense } from 'react';
import { LiveLogin } from '@/components/auth/LiveLogin';
import { AuthLoading } from '@/components/auth/LiveAuthShared';

export default function LoginPage() {
  return <Suspense fallback={<AuthLoading />}><LiveLogin /></Suspense>;
}
