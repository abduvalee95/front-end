'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, PenLine, UsersRound } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { studentService } from '@/services/students';
import { STUDENTS_KEYS } from '@/hooks/useStudents';
import type { Student, StudentStatus } from '@/types/student';

interface EditStudentModalProps {
  student: Pick<Student, 'id' | 'name' | 'phone' | 'status'> & {
    address?: string;
    parent?: string;
  };
  trigger?: React.ReactElement;
}

export function EditStudentModal({ student, trigger }: EditStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: student.name || '',
    phone: student.phone || '',
    address: student.address || '',
    parent: student.parent || '',
    status: student.status as StudentStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim() || !formData.address.trim()) {
      toast.error('Please fill in all required fields (Name, Phone, Address)');
      return;
    }

    try {
      setIsLoading(true);
      await studentService.updateStudent(student.id, formData);
      toast.success('Student updated successfully');
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: STUDENTS_KEYS.all });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update student');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button variant="ghost" size="icon" className="size-8">
              <PenLine className="size-4" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UsersRound className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Edit Student</DialogTitle>
          <DialogDescription className="text-center">
            Update student details and status.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor={`edit-name-${student.id}`}>Full Name *</Label>
            <Input
              id={`edit-name-${student.id}`}
              placeholder="E.g. Ali Valiyev"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-phone-${student.id}`}>Phone Number *</Label>
            <Input
              id={`edit-phone-${student.id}`}
              placeholder="+996 500 000 000"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-address-${student.id}`}>Address *</Label>
            <Input
              id={`edit-address-${student.id}`}
              placeholder="E.g. Bishkek, Chuy st. 12"
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`edit-parent-${student.id}`}>Parent Info</Label>
            <Input
              id={`edit-parent-${student.id}`}
              placeholder="E.g. Father: +996 700 000 000"
              value={formData.parent}
              onChange={(e) => setFormData((prev) => ({ ...prev, parent: e.target.value }))}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val: StudentStatus | null) => val && setFormData((prev) => ({ ...prev, status: val }))}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
