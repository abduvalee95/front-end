'use client';

import { useState } from 'react';
import { useTranslations } from '@/i18n/index';
import { toast } from 'sonner';
import { Search, Pencil, Trash2 } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useSubjects, useDeleteSubject } from '@/hooks/useSubjects';
import { CreateSubjectModal } from '@/components/subjects/CreateSubjectModal';
import { EditSubjectModal } from '@/components/subjects/EditSubjectModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Subject } from '@/types/subject';

export function SubjectsWorkspace() {
  const t = useTranslations('subjects');
  const tCommon = useTranslations('common');
  const { role, isSuperAdmin, isAdmin: isAdminOrManager } = usePermissions();
  const canManage = isAdminOrManager || isSuperAdmin;
  // Existing semantics: ADMIN or SUPER_ADMIN (excludes MANAGER)
  const isAdmin = role === 'ADMIN' || isSuperAdmin;

  const [search, setSearch] = useState('');
  const [editSubject, setEditSubject] = useState<Subject | null>(null);
  const [deleteSubject, setDeleteSubject] = useState<Subject | null>(null);

  const { data: subjects, isLoading } = useSubjects();
  const deleteSubjectMutation = useDeleteSubject();

  const filtered = (subjects ?? []).filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteSubject) return;
    try {
      await deleteSubjectMutation.mutateAsync(deleteSubject.id);
      toast.success(tCommon('success'));
      setDeleteSubject(null);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || tCommon('error'));
      setDeleteSubject(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        {canManage && <CreateSubjectModal />}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder={t('search_subjects')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-muted-foreground text-sm">{t('no_subjects')}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{t('subject_name')}</th>
                <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">{tCommon('created_at')}</th>
                {canManage && (
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">{tCommon('actions')}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((subject) => (
                <tr key={subject.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{subject.name}</td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {new Date(subject.created_at).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="size-8 p-0 rounded-lg"
                          onClick={() => setEditSubject(subject)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="size-8 p-0 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteSubject(subject)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editSubject && (
        <EditSubjectModal
          subject={editSubject}
          open={!!editSubject}
          onClose={() => setEditSubject(null)}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteSubject} onOpenChange={(val) => { if (!val) setDeleteSubject(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete_subject')}</AlertDialogTitle>
            <AlertDialogDescription>{t('delete_confirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
