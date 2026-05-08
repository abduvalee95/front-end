'use client';

import { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteUserModal } from '@/components/users/InviteUserModal';
import { UsersTable } from '@/components/users/UsersTable';

export default function UsersPage() {
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Users Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your organization&apos;s staff and students
            </p>
          </div>
        </div>

        <Button onClick={() => setInviteModalOpen(true)} className="gap-2 shrink-0">
          <Plus className="size-4" />
          Invite User
        </Button>
      </div>

      <UsersTable />

      <InviteUserModal 
        open={inviteModalOpen} 
        onOpenChange={setInviteModalOpen} 
      />
    </div>
  );
}
