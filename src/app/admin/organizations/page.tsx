'use client';

import { useState, useCallback } from 'react';
import { Building2 } from 'lucide-react';
import OrganizationsTable from '@/components/admin/organizations/OrganizationsTable';
import { OrgStatsCards } from '@/components/admin/organizations/OrgStatsCards';
import { CreateOrganizationModal } from '@/components/admin/organizations/CreateOrganizationModal';
import { EditOrganizationModal } from '@/components/admin/organizations/EditOrganizationModal';
import { OrgDetailDrawer } from '@/components/admin/organizations/OrgDetailDrawer';
import { StatusConfirmDialog } from '@/components/admin/organizations/StatusConfirmDialog';
import { useOrganizations, useToggleOrganizationStatus } from '@/hooks/useOrganizations';
import { QUERY_LIMITS } from '@/lib/constants';
import { useTranslations } from '@/i18n/index';
import type { PlatformOrganization, OrganizationStatus } from '@/types/platform';

export default function OrganizationsPage() {
  const t = useTranslations('admin');
  const tNav = useTranslations('nav');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PlatformOrganization | null>(null);
  const [detailTarget, setDetailTarget] = useState<PlatformOrganization | null>(null);
  const [statusTarget, setStatusTarget] = useState<PlatformOrganization | null>(null);

  // Single shared query for stats cards — table manages its own paginated query
  const { data: statsData, isLoading: statsLoading } = useOrganizations({ page: 1, limit: QUERY_LIMITS.ORGS_STATS });

  const toggleStatus = useToggleOrganizationStatus();

  const handleToggleStatus = useCallback((org: PlatformOrganization) => {
    // If detail drawer is open, close it first then show confirm
    setDetailTarget(null);
    setStatusTarget(org);
  }, []);

  const handleStatusConfirm = useCallback(() => {
    if (!statusTarget) return;
    const newStatus: OrganizationStatus =
      statusTarget.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    toggleStatus.mutate(
      { id: statusTarget.id, status: newStatus },
      { onSettled: () => setStatusTarget(null) },
    );
  }, [statusTarget, toggleStatus]);

  const handleEditFromDetail = useCallback((org: PlatformOrganization) => {
    setDetailTarget(null);
    setEditTarget(org);
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page header ── */}
      <div className="relative mb-6 overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,#07111f_0%,#0c2733_60%,#081726_100%)] p-6 text-white shadow-xl sm:p-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(3,203,231,0.2),transparent_18rem)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">
              <Building2 className="size-3.5" /> {t('console_tag')}
            </p>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{tNav('organizations')}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {t('orgs.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="group flex h-10 shrink-0 items-center gap-2 rounded-xl border border-cyan-400/25 bg-cyan-400/10 px-4 text-sm font-bold text-cyan-100 backdrop-blur-sm transition-all hover:border-cyan-400/40 hover:bg-cyan-400/20"
          >
            <Building2 className="size-4 transition-transform group-hover:scale-110" />
            {t('orgs.create')}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      <OrgStatsCards data={statsData} isLoading={statsLoading} />

      {/* ── Table ── */}
      <OrganizationsTable
        onCreateClick={() => setCreateOpen(true)}
        onEditClick={setEditTarget}
        onDetailClick={setDetailTarget}
      />

      {/* ── Create drawer ── */}
      <CreateOrganizationModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* ── Edit drawer ── */}
      <EditOrganizationModal org={editTarget} onClose={() => setEditTarget(null)} />

      {/* ── Detail drawer ── */}
      <OrgDetailDrawer
        org={detailTarget}
        onClose={() => setDetailTarget(null)}
        onEdit={handleEditFromDetail}
        onToggleStatus={handleToggleStatus}
      />

      {/* ── Status confirm (z-60, above drawers) ── */}
      <StatusConfirmDialog
        org={statusTarget}
        isLoading={toggleStatus.isPending}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusTarget(null)}
      />
    </div>
  );
}
