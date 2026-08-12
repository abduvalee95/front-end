'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Loader2, PenLine } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { courseService } from '@/services/courses';
import { queryKeys } from '@/lib/api/query-keys';
import { useAuthStore } from '@/store/auth.store';
import type { Course, CourseStatus } from '@/types/group';

interface EditCourseModalProps {
  course: Course;
}

export function EditCourseModal({ course }: EditCourseModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: course.title,
    description: course.description || '',
    price: course.price,
    status: course.status,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price) {
      toast.error('Title and Price are required fields');
      return;
    }

    try {
      setIsLoading(true);
      await courseService.updateCourse(course.id, {
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price,
        status: formData.status,
      });
      toast.success('Course updated successfully');
      setOpen(false);
      const user = useAuthStore.getState().user;
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(user?.organization_id) });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="size-8" title="Edit course">
            <PenLine className="size-4" />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-emphasis">
              <BookOpen className="size-5" />
            </div>
            <div>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update course details and availability status.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor={`edit-ctitle-${course.id}`}>Course Title *</Label>
            <Input
              id={`edit-ctitle-${course.id}`}
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-cdesc-${course.id}`}>Description</Label>
            <Textarea
              id={`edit-cdesc-${course.id}`}
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={isLoading}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-cprice-${course.id}`}>Price *</Label>
              <Input
                id={`edit-cprice-${course.id}`}
                type="number"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-cstatus-${course.id}`}>Status</Label>
              <select
                id={`edit-cstatus-${course.id}`}
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                disabled={isLoading}
                className="flex h-9 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-xl">
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
