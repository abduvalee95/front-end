'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Users2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { groupService } from '@/services/groups';
import { GROUPS_KEYS } from '@/hooks/useGroups';
import { useCourses } from '@/hooks/useCourses';
import { useTeachers } from '@/hooks/useTeachers';

export function CreateGroupModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const coursesQuery = useCourses(open);
  const teachersQuery = useTeachers({ page: 1, limit: 100 }, open);

  const [formData, setFormData] = useState({
    name: '',
    course_id: '',
    teacher_id: '',
    start_date: '',
    end_date: '',
  });

  const resetForm = () => setFormData({ name: '', course_id: '', teacher_id: '', start_date: '', end_date: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, course_id, teacher_id, start_date, end_date } = formData;
    if (!name.trim() || !course_id || !teacher_id || !start_date || !end_date) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      await groupService.createGroup(formData);
      toast.success('Group created successfully');
      resetForm();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: GROUPS_KEYS.all });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const courses = coursesQuery.data ?? [];
  const teachers = teachersQuery.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 bg-slate-950 text-white shadow-md hover:bg-slate-800 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90 rounded-xl h-10 px-5">
            <Plus className="size-4" />
            Add Group
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Users2 className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Create New Group</DialogTitle>
          <DialogDescription className="text-center">
            A group links a course with a teacher and schedule.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="group-name">Group Name *</Label>
            <Input
              id="group-name"
              placeholder="E.g. English B1 — Morning"
              value={formData.name}
              onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-course">Course *</Label>
            <select
              id="group-course"
              value={formData.course_id}
              onChange={(e) => setFormData((p) => ({ ...p, course_id: e.target.value }))}
              disabled={isLoading}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">Select course...</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="group-teacher">Teacher *</Label>
            <select
              id="group-teacher"
              value={formData.teacher_id}
              onChange={(e) => setFormData((p) => ({ ...p, teacher_id: e.target.value }))}
              disabled={isLoading}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
            >
              <option value="">Select teacher...</option>
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>{t.user?.full_name ?? 'Unnamed'}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="group-start">Start Date *</Label>
              <Input
                id="group-start"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData((p) => ({ ...p, start_date: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-end">End Date *</Label>
              <Input
                id="group-end"
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData((p) => ({ ...p, end_date: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating...</> : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
