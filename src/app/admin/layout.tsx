import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { AdminProviders } from '@/components/admin/AdminProviders';
import { getRoleFromToken } from '@/lib/auth/jwt';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  if (!accessToken) redirect('/login?redirect=/admin/dashboard');

  const role = getRoleFromToken(accessToken!.value);
  if (role !== 'SUPER_ADMIN') redirect('/dashboard');

  return (
    <AdminProviders>
      <AdminShell>{children}</AdminShell>
    </AdminProviders>
  );
}
