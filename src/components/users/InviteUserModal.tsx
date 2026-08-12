'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mail, Phone, User, Shield, Briefcase, KeyRound, Loader2 } from 'lucide-react';

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
import { useTranslations } from '@/i18n/index';

interface InviteUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormValues = InviteUserDto;

export function InviteUserModal({ open, onOpenChange }: InviteUserModalProps) {
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const inviteUser = useInviteUser();
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  const tSettings = useTranslations('settings');
  const tAuth = useTranslations('auth');
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
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('invite_user')}</DialogTitle>
              <DialogDescription>{t('invite_user_desc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {tempPassword ? (
          <div className="py-6 space-y-4">
            <div className="p-4 bg-success/10 border border-success/20 rounded-xl text-center space-y-2">
              <KeyRound className="size-8 text-success-emphasis mx-auto mb-2" />
              <p className="text-sm font-medium text-success-emphasis">{t('invited_success')}</p>
              <p className="text-xs text-muted-foreground">{t('temp_password_desc')}</p>
              <div className="bg-background p-3 rounded-lg font-mono text-lg font-bold tracking-wider select-all mt-4 border border-input">
                {tempPassword}
              </div>
            </div>
            <Button className="w-full" onClick={handleClose}>
              {tCommon('done')}
            </Button>
          </div>
        ) : (
          <form id="invite-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <User className="size-3 text-muted-foreground" />
                  {tSettings('full_name')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register('full_name', { required: t('full_name_required'), minLength: { value: 2, message: t('min_2_chars') } })}
                  placeholder="e.g. John Doe"
                />
                {errors.full_name && <p className="text-[10px] text-destructive">{errors.full_name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Phone className="size-3 text-muted-foreground" />
                  {tSettings('phone')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  {...register('phone', {
                    required: t('phone_required'),
                    pattern: { value: /^\+996\d{9}$/, message: t('phone_format') }
                  })}
                  placeholder="+996XXXXXXXXX"
                />
                {errors.phone && <p className="text-[10px] text-destructive">{errors.phone.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Mail className="size-3 text-muted-foreground" />
                  {tSettings('email')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="email"
                  {...register('email', {
                    required: t('email_required'),
                    pattern: { value: /^\S+@\S+\.\S+$/, message: t('email_invalid') }
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
                    {tCommon('role')} <span className="text-destructive">*</span>
                  </Label>
                  <select
                    {...register('role', { required: t('role_required') })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="STUDENT" className="bg-background text-foreground">{t('role_student')}</option>
                    <option value="TEACHER" className="bg-background text-foreground">{t('role_teacher')}</option>
                    <option value="MANAGER" className="bg-background text-foreground">{t('role_manager')}</option>
                    <option value="ADMIN" className="bg-background text-foreground">{t('role_admin')}</option>
                  </select>
                  {errors.role && <p className="text-[10px] text-destructive">{errors.role.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-2">
                    <KeyRound className="size-3 text-muted-foreground" />
                    {tAuth('password')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="password"
                    {...register('password', {
                      required: t('password_required'),
                      minLength: { value: 6, message: t('min_6_chars') }
                    })}
                    placeholder="••••••"
                  />
                  {errors.password && <p className="text-[10px] text-destructive">{errors.password.message}</p>}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-2">
                  <Briefcase className="size-3 text-muted-foreground" />
                  {t('title_optional')}
                </Label>
                <Input
                  {...register('title')}
                  placeholder="e.g. Senior English Teacher"
                />
              </div>

            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={inviteUser.isPending} className="rounded-xl">
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={inviteUser.isPending} className="rounded-xl">
                {inviteUser.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
                {t('send_invitation')}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
