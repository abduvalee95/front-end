'use client';

import { Users, ShieldCheck, Sparkles } from 'lucide-react';
import { UsersTable } from '@/components/users/UsersTable';

export default function AdminUsersPage() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#07111f] to-[#0c2733] p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,203,231,0.2),transparent_25rem)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-widest">
              <ShieldCheck className="size-4" />
              <span>System Administration</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">
              Global User Management
            </h1>
            <p className="text-slate-300 max-w-xl font-medium">
              View and manage all users across the entire platform. Monitor roles, activity, and permissions.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-4 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Users className="size-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-cyan-200/50 uppercase tracking-wider">Total Platform Users</p>
                <p className="text-2xl font-black text-white">Monitoring...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-8">
        <div className="bg-white/80 backdrop-blur-md rounded-[32px] p-8 shadow-sm border border-slate-200/50 transition-all hover:shadow-xl hover:shadow-slate-200/40">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-900">User Directory</h3>
              <p className="text-sm text-slate-400 font-medium">Search and filter through all registered accounts</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-2xl">
              <Sparkles className="size-5 text-slate-400" />
            </div>
          </div>
          
          <UsersTable />
        </div>
      </div>
    </div>
  );
}
