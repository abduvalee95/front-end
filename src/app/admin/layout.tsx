import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { AdminProviders } from '@/components/admin/AdminProviders';
import { verifyAccessToken } from '@/lib/auth/verify-token';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  if (!accessToken) redirect('/login?redirect=/admin/dashboard');

  // Verify the token signature before trusting its role. 'expired' still
  // carries an authentic (validly signed) role, so we honour it and let the
  // client refresh; only 'invalid' (forged/malformed) is treated as no role.
  const result = await verifyAccessToken(accessToken.value);
  const role = result.status === 'invalid' ? null : result.claims.role;
  if (role !== 'SUPER_ADMIN') redirect('/dashboard');

  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
