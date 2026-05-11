'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, UserPlus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { enrollmentService } from '@/services/enrollments';
import { useStudents } from '@/hooks/useStudents';
import { GROUPS_KEYS } from '@/hooks/useGroups';
import { useQuery } from '@tanstack/react-query';
import type { Enrollment } from '@/types/student';

interface EnrollStudentModalProps {
  groupId: string;
  groupName: string;
}

export function EnrollStudentModal({ groupId, groupName }: EnrollStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const queryClient = useQueryClient();

  // Fetch students for the dropdown
  const studentsQuery = useStudents({ page: 1, limit: 200 }, open);

  // Fetch current enrollments for this group
  const enrollmentsQuery = useQuery({
    queryKey: ['enrollments', 'group', groupId],
    queryFn: () => enrollmentService.getByGroup(groupId),
    enabled: open && !!groupId,
  });

  const enrolledStudentIds = new Set(
    (enrollmentsQuery.data ?? []).map((e: Enrollment) => e.student_id)
  );

  const availableStudents = (studentsQuery.data?.items ?? []).filter(
    (s) => !enrolledStudentIds.has(s.id)
  );

  const handleEnroll = async () => {
    if (!selectedStudentId) {
      toast.error('Please select a student');
      return;
    }
    try {
      setIsEnrolling(true);
      await enrollmentService.create({ student_id: selectedStudentId, group_id: groupId });
      toast.success('Student enrolled successfully');
      setSelectedStudentId('');
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to enroll student');
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm('Remove this student from the group?')) return;
    try {
      setIsRemoving(enrollmentId);
      await enrollmentService.remove(enrollmentId);
      toast.success('Student removed from group');
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'group', groupId] });
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to remove enrollment');
    } finally {
      setIsRemoving(null);
    }
  };

  const enrollments = enrollmentsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" title="Manage enrollment">
            <UserPlus className="size-4" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
            <UserPlus className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Enrollment — {groupName}</DialogTitle>
          <DialogDescription className="text-center">
            Add or remove students from this group.
          </DialogDescription>
        </DialogHeader>

        {/* Enroll new student */}
        <div className="space-y-3 pt-4">
          <Label>Add Student to Group</Label>
          <div className="flex gap-2">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              disabled={isEnrolling}
              className="flex h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">Select student...</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.phone}</option>
              ))}
            </select>
            <Button onClick={handleEnroll} disabled={isEnrolling || !selectedStudentId} size="sm" className="h-9 px-4">
              {isEnrolling ? <Loader2 className="size-4 animate-spin" /> : 'Enroll'}
            </Button>
          </div>
        </div>

        {/* Current enrollments */}
        <div className="mt-6 space-y-3">
          <Label>Enrolled Students ({enrollments.length})</Label>
          {enrollmentsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : enrollments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No students enrolled yet.</p>
            </div>
          ) : (
            <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
              {enrollments.map((enrollment: Enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/30 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {enrollment.student?.name ?? 'Unknown'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {enrollment.student?.phone ?? '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="rounded-full text-xs">
                      {enrollment.student?.status ?? 'N/A'}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10"
                      disabled={isRemoving === enrollment.id}
                      onClick={() => handleRemove(enrollment.id)}
                      title="Remove from group"
                    >
                      <X className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
