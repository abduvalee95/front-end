'use client';

import { useState } from 'react';
import TeachersTable from '@/components/dashboard/teachers/TeachersTable';
import { EditTeacherModal } from '@/components/dashboard/teachers/EditTeacherModal';
import { CreateTeacherModal } from '@/components/dashboard/teachers/CreateTeacherModal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { TeacherProfile } from '@/types/teacher';

export default function TeachersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherProfile | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage your educational staff and their profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <TeachersTable
        onEditClick={setEditTarget}
      />

      <EditTeacherModal
        teacher={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <CreateTeacherModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />
    </div>
  );
}
