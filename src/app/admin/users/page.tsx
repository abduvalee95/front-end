'use client';

import { Users, ShieldCheck, Sparkles } from 'lucide-react';
import { UsersTable } from '@/components/users/UsersTable';
import { useUsers } from '@/hooks/useUsers';

export default function AdminUsersPage() {
  const totalQuery = useUsers({ page: 1, limit: 1 });
  const totalUsers = totalQuery.data?.meta.total;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(160deg,#07111f_0%,#0c2733_60%,#081726_100%)] p-7 text-white shadow-2xl sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(3,203,231,0.2),transparent_22rem)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:36px_36px]" />
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-2">
            <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/80">
              <ShieldCheck className="size-3.5" /> Platform Console
            </p>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">
              Global User Management
            </h1>
            <p className="max-w-xl font-medium text-slate-400">
              View and manage all users across the entire platform. Monitor roles, activity, and permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 backdrop-blur-md">
              <div className="flex size-12 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-500/15">
                <Users className="size-6 text-cyan-400" />
              </div>
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/60">Total Platform Users</p>
                <p className="text-2xl font-black tabular-nums text-white">{totalUsers ?? '—'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        <div className="rounded-[24px] border border-border/70 bg-card/80 p-6 shadow-sm backdrop-blur-md transition-shadow hover:shadow-xl sm:p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-foreground">User Directory</h3>
              <p className="text-sm font-medium text-muted-foreground">Search and filter through all registered accounts</p>
            </div>
            <div className="rounded-2xl bg-muted p-3">
              <Sparkles className="size-5 text-muted-foreground" />
            </div>
          </div>

          <UsersTable />
        </div>
      </div>
    </div>
  );
}
