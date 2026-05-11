'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateLead } from '@/hooks/useLeads';
import { useAuthStore } from '@/store/auth.store';

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateLeadModal({ isOpen, onClose }: CreateLeadModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    source: 'DIRECT',
  });
  
  const createLead = useCreateLead();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim() || !formData.phone.trim()) {
      toast.error('Please fill in Name and Phone Number');
      return;
    }

    if (!user?.full_name) {
      toast.error('User information not found');
      return;
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      toast.error('Phone must be 9-15 digits (e.g., +998901234567)');
      return;
    }

    try {
      await createLead.mutateAsync({
        ...formData,
        phone: cleanPhone,
        admin: user.full_name,
      });
      setFormData({ full_name: '', phone: '', source: 'DIRECT' });
      onClose();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create lead';
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
            <Users className="size-6" />
          </div>
          <DialogTitle className="text-center text-xl">Add New Lead</DialogTitle>
          <DialogDescription className="text-center">
            Enter the details of the potential student.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Full Name *</Label>
            <Input
              id="lead-name"
              placeholder="E.g. Ali Valiyev"
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              disabled={createLead.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-phone">Phone Number *</Label>
            <Input
              id="lead-phone"
              placeholder="+998 90 123 45 67"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={createLead.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <Select
              value={formData.source}
              onValueChange={(val: string | null) => val && setFormData((prev) => ({ ...prev, source: val }))}
              disabled={createLead.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT">Direct</SelectItem>
                <SelectItem value="INSTAGRAM">Instagram</SelectItem>
                <SelectItem value="TELEGRAM">Telegram</SelectItem>
                <SelectItem value="FACEBOOK">Facebook</SelectItem>
                <SelectItem value="RECOMMENDATION">Recommendation</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createLead.isPending}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createLead.isPending} className="w-full sm:w-auto edu-gradient-primary text-white">
              {createLead.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Lead'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
