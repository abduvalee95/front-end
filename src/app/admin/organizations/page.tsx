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
import type { PlatformOrganization, OrganizationStatus } from '@/types/platform';

export default function OrganizationsPage() {
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

      {/* ── Page header with gradient ── */}
      <div className="edu-gradient-header rounded-xl p-6 mb-6 border border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Organizations
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage all education companies on the platform
            </p>
          </div>
          <button 
            onClick={() => setCreateOpen(true)}
            className="edu-gradient-btn rounded-lg px-4 h-9 text-sm font-medium"
          >
            <Building2 className="mr-2 h-4 w-4" />
            Create Organization
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
