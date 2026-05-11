'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BookOpen, Loader2, Plus } from 'lucide-react';
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
import type { CourseStatus } from '@/types/group';

export function CreateCourseModal() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    status: 'ACTIVE' as CourseStatus,
  });

  const resetForm = () => setFormData({ title: '', description: '', price: '', status: 'ACTIVE' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.price.trim()) {
      toast.error('Title and Price are required fields');
      return;
    }

    try {
      setIsLoading(true);
      await courseService.createCourse({
        title: formData.title,
        description: formData.description || undefined,
        price: formData.price,
      });
      toast.success('Course created successfully');
      resetForm();
      setOpen(false);
      const user = useAuthStore.getState().user;
      queryClient.invalidateQueries({ queryKey: queryKeys.courses.all(user?.organization_id) });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create course');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 rounded-xl h-10 px-5">
            <Plus className="size-4" />
            Add Course
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600">
            <BookOpen className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Create New Course</DialogTitle>
          <DialogDescription className="text-center">
            Add a new educational program to your organization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="course-title">Course Title *</Label>
            <Input
              id="course-title"
              placeholder="E.g. Full-Stack Web Development"
              value={formData.title}
              onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="course-desc">Description</Label>
            <Textarea
              id="course-desc"
              placeholder="Brief overview of what students will learn..."
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              disabled={isLoading}
              className="resize-none"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="course-price">Price *</Label>
              <Input
                id="course-price"
                type="number"
                placeholder="E.g. 500000"
                value={formData.price}
                onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-status">Status</Label>
              <select
                id="course-status"
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as CourseStatus }))}
                disabled={isLoading}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <><Loader2 className="mr-2 size-4 animate-spin" />Creating...</> : 'Create Course'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
