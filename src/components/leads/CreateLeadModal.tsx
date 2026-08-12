'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Users } from 'lucide-react';
import { useTranslations } from '@/i18n/index';
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
  const t = useTranslations('leads');
  const tCommon = useTranslations('common');
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
      toast.error(t('fill_required_fields'));
      return;
    }

    if (!user?.full_name) {
      toast.error(tCommon('user_not_found'));
      return;
    }

    const cleanPhone = formData.phone.replace(/\s+/g, '');
    if (!/^\+?\d{9,15}$/.test(cleanPhone)) {
      toast.error(t('phone_format_error'));
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errorMessage = err.response?.data?.message || err.message || t('failed_create');
      toast.error(errorMessage);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary-emphasis">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle>{t('add_lead')}</DialogTitle>
              <DialogDescription>
                {t('subtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="lead-name">{t('full_name')} *</Label>
            <Input
              id="lead-name"
              placeholder={t('name_placeholder')}
              value={formData.full_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
              disabled={createLead.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lead-phone">{t('phone')} *</Label>
            <Input
              id="lead-phone"
              placeholder="+996 90 123 45 67"
              value={formData.phone}
              onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
              disabled={createLead.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('source')}</Label>
            <Select
              value={formData.source}
              onValueChange={(val: string | null) => val && setFormData((prev) => ({ ...prev, source: val }))}
              disabled={createLead.isPending}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('select_source')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DIRECT">{t('source_direct')}</SelectItem>
                <SelectItem value="INSTAGRAM">{t('source_instagram')}</SelectItem>
                <SelectItem value="TELEGRAM">{t('source_telegram')}</SelectItem>
                <SelectItem value="FACEBOOK">{t('source_facebook')}</SelectItem>
                <SelectItem value="RECOMMENDATION">{t('source_recommendation')}</SelectItem>
                <SelectItem value="OTHER">{t('source_other')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createLead.isPending}
              className="w-full sm:w-auto rounded-xl"
            >
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={createLead.isPending} className="w-full sm:w-auto rounded-xl edu-gradient-primary text-white">
              {createLead.isPending ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                t('add_lead')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
