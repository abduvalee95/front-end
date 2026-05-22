'use client';

import { useTranslations } from '@/i18n/index';
import { Sun, Moon, Laptop } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function AppearanceTab() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold">{t('theme')}</CardTitle>
          <CardDescription>{t('theme_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-primary bg-primary/5 transition-all">
              <Sun className="size-8 text-primary" />
              <span className="font-semibold text-sm">{t('light')}</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all">
              <Moon className="size-8 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-sm text-slate-600 dark:text-slate-400">{t('dark')}</span>
            </button>
            <button className="flex flex-col items-center gap-3 p-4 rounded-xl border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900 transition-all">
              <Laptop className="size-8 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-sm text-slate-600 dark:text-slate-400">{t('system')}</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardHeader className="border-b border-slate-200 dark:border-slate-800">
          <CardTitle className="text-lg font-semibold">{t('language')}</CardTitle>
          <CardDescription>{t('language_desc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Select defaultValue="uz">
            <SelectTrigger className="w-full max-w-xs h-11">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="uz">O&apos;zbekcha</SelectItem>
              <SelectItem value="ru">Русский</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
