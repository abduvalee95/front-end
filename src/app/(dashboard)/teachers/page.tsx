'use client';

import { useState, useCallback } from 'react';
import TeachersTable from '@/components/dashboard/teachers/TeachersTable';
import { EditTeacherModal } from '@/components/dashboard/teachers/EditTeacherModal';
import { CreateTeacherModal } from '@/components/dashboard/teachers/CreateTeacherModal';
import { DeleteTeacherConfirmDialog } from '@/components/dashboard/teachers/DeleteTeacherConfirmDialog';
import { TeacherDetailSheet } from '@/components/dashboard/teachers/TeacherDetailSheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
import { useDeleteTeacher } from '@/hooks/useTeachers';
import type { TeacherProfile } from '@/types/teacher';

export default function TeachersPage() {
  const t = useTranslations('teachers');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherProfile | null>(null);
  const [viewTarget, setViewTarget] = useState<TeacherProfile | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TeacherProfile | null>(null);
  const deleteTeacher = useDeleteTeacher();

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    deleteTeacher.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }, [deleteTarget, deleteTeacher]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-primary hover:bg-primary text-white shadow-lg shadow-primary/20"
          >
            <Plus className="mr-2 h-4 w-4" /> {t('add_teacher')}
          </Button>
        </div>
      </div>

      <TeachersTable
        onEditClick={setEditTarget}
        onViewClick={setViewTarget}
        onDeleteClick={setDeleteTarget}
      />

      <TeacherDetailSheet
        teacher={viewTarget}
        onClose={() => setViewTarget(null)}
        onEdit={setEditTarget}
        onToggleStatus={() => {}}
        onDelete={setDeleteTarget}
      />

      <EditTeacherModal
        teacher={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <CreateTeacherModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <DeleteTeacherConfirmDialog
        teacher={deleteTarget}
        isLoading={deleteTeacher.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
