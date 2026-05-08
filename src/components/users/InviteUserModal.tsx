'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, User, Shield, Briefcase, KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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
import { Separator } from '@/components/ui/separator';

import { useInviteUser } from '@/hooks/useUsers';
import type { InviteUserDto } from '@/types/user';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = InviteUserDto;

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const inviteUser = useInviteUser();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      role: 'STUDENT',
    },
  });

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      reset();
      setTempPassword(null);
    }, 200);
  };

  const onSubmit = (values: FormValues) => {
    inviteUser.mutate(values, {
      onSuccess: (data) => {
        // If backend returned a temporary password or we successfully set one, show it.
        // Actually, backend requires password. We are sending one if entered, otherwise we can auto-generate?
        // Wait, the backend requires a password inside the DTO, but the frontend should provide it.
        // Let's just rely on the user input password or what they provide.
        if (data.temporaryPassword) {
          setTempPassword(data.temporaryPassword);
        } else {
          handleClose();
        }
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <User className="size-4 text-primary" />
            Invite User
          </DialogTitle>
          <DialogDescription>
            Invite a new user to your organization. They will receive access immediately.
          </DialogDescription>
        </DialogHeader>

        {tempPassword ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center space-y-2">
              <KeyRound className="size-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">User invited successfully!</p>
              <p className="text-xs text-muted-foreground">Please share this temporary password with the user:</p>
              <div className="bg-background p-3 rounded-lg font-mono text-lg font-bold tracking-wider select-all mt-4 border border-input">
                {tempPassword}
              </div>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : (
          <form id="invite-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <User className="size-3 text-muted-foreground" />
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register('full_name', { required: 'Full name is required', minLength: { value: 2, message: 'Minimum 2 characters' } })}
                  placeholder="e.g. John Doe"
                />
                {errors.full_name && <p className="text-[10px] text-destructive">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Phone className="size-3 text-muted-foreground" />
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register('phone', { 
                    required: 'Phone number is required',
                    pattern: { value: /^\+996\d{9}$/, message: 'Must be in format +996XXXXXXXXX' }
                  })}
                  placeholder="+996XXXXXXXXX"
                />
                {errors.phone && <p className="text-[10px] text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Mail className="size-3 text-muted-foreground" />
                  Email Address <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                  })}
                  placeholder="user@example.com"
                />
                {errors.email && <p className="text-[10px] text-destructive">{errors.email.message}</p>}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    <Shield className="size-3 text-muted-foreground" />
                    Role <span className="text-destructive">*</span>
                  </Label>
                  <select
                    {...register('role', { required: 'Role is required' })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="STUDENT" className="bg-background text-foreground">Student</option>
                    <option value="TEACHER" className="bg-background text-foreground">Teacher</option>
                    <option value="MANAGER" className="bg-background text-foreground">Manager</option>
                    <option value="ADMIN" className="bg-background text-foreground">Admin</option>
                  </select>
                  {errors.role && <p className="text-[10px] text-destructive">{errors.role.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    <KeyRound className="size-3 text-muted-foreground" />
                    Password <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: { value: 6, message: 'Minimum 6 characters' }
                    })}
                    placeholder="••••••"
                  />
                  {errors.password && <p className="text-[10px] text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Briefcase className="size-3 text-muted-foreground" />
                  Title (Optional)
                </Label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Senior English Teacher"
                />
              </div>

            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose} disabled={inviteUser.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
