import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { AdminShell } from '@/components/admin/layout/AdminShell';
import { AdminProviders } from '@/components/admin/AdminProviders';

function getRoleFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const decoded = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    );
    return decoded.role ?? null;
  } catch {
    return null;
  }
}

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
