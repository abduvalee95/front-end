'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  Users,
  Pencil,
  Power,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useOrganizations, useToggleOrganizationStatus } from '@/hooks/useOrganizations';
import { EditOrganizationModal } from '@/components/admin/organizations/EditOrganizationModal';
import { StatusConfirmDialog } from '@/components/admin/organizations/StatusConfirmDialog';
import { OrganizationStatusBadge } from '@/components/admin/organizations/OrganizationStatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { PlatformOrganization, OrganizationStatus } from '@/types/platform';

export default function OrganizationDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const { data, isLoading, isError, refetch } = useOrganizations({ page: 1, limit: 100 });
  const org = data?.items.find((o) => o.id === id) ?? null;

  const [editTarget, setEditTarget] = useState<PlatformOrganization | null>(null);
  const [statusTarget, setStatusTarget] = useState<PlatformOrganization | null>(null);
  const toggleStatus = useToggleOrganizationStatus();

  const handleStatusConfirm = useCallback(() => {
    if (!statusTarget) return;
    const newStatus: OrganizationStatus = statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatus.mutate(
      { id: statusTarget.id, status: newStatus },
      { onSettled: () => setStatusTarget(null) },
    );
  }, [statusTarget, toggleStatus]);

  // --- Loading ---
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  // --- Error ---
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-white/50 text-sm">Ma'lumotlarni yuklashda xatolik</p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-white/10 text-white">
          <RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish
        </Button>
      </div>
    );
  }

  // --- Not found ---
  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Building2 className="h-10 w-10 text-white/10" />
        <p className="text-white/40 font-bold">Tashkilot topilmadi</p>
        <Link href="/admin/organizations" className="text-primary hover:underline text-sm">
          Ro'yxatga qaytish
        </Link>
      </div>
    );
  }

  const details = [
    { label: 'Email', value: org.email, icon: Mail },
    { label: 'Telefon', value: org.phone || '—', icon: Phone },
    { label: 'Foydalanuvchilar soni', value: String(org.usersCount), icon: Users },
    { label: 'Yaratilgan', value: format(new Date(org.created_at), 'dd MMMM yyyy, HH:mm'), icon: Calendar },
    { label: 'Yangilangan', value: format(new Date(org.updated_at), 'dd MMMM yyyy, HH:mm'), icon: Calendar },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Back + Header */}
      <div className="flex flex-col gap-4">
        <Link
          href="/admin/organizations"
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm font-medium w-fit"
        >
          <ArrowLeft size={16} /> Orqaga qaytish
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{org.name}</h1>
              <OrganizationStatusBadge status={org.status} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditTarget(org)}
              className="border-white/10 text-white/70"
            >
              <Pencil className="mr-2 h-4 w-4" /> Tahrirlash
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStatusTarget(org)}
              className={org.status === 'ACTIVE'
                ? 'border-red-500/20 text-red-400 hover:bg-red-500/10'
                : 'border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10'}
            >
              <Power className="mr-2 h-4 w-4" />
              {org.status === 'ACTIVE' ? 'To\'xtatish' : 'Faollashtirish'}
            </Button>
          </div>
        </div>
      </div>

      {/* Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {details.map((d) => (
          <Card key={d.label} className="bg-white/[0.03] border-white/10 backdrop-blur-sm">
            <CardContent className="p-5 flex items-start gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <d.icon className="h-5 w-5 text-white/40" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/40 uppercase tracking-wider">{d.label}</p>
                <p className="text-sm font-semibold text-white mt-1 truncate">{d.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modals */}
      <EditOrganizationModal org={editTarget} onClose={() => setEditTarget(null)} />
      <StatusConfirmDialog
        org={statusTarget}
        isLoading={toggleStatus.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}
