'use client';

import { FileSpreadsheet, GraduationCap, Layers3, TrendingUp, UserRoundCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/i18n/index';
import { cn } from '@/lib/utils';
import { CreateStudentModal } from './CreateStudentModal';

interface StudentsHeroProps {
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  groupCount: number;
  rowsLength: number;
  activeRatio: number;
  teacherScoped: boolean;
  canManageScope: boolean;
  onImportClick: () => void;
}

export function StudentsHero({
  totalCount,
  activeCount,
  inactiveCount,
  groupCount,
  rowsLength,
  activeRatio,
  teacherScoped,
  canManageScope,
  onImportClick,
}: StudentsHeroProps) {
  const t = useTranslations('students');
  const tCommon = useTranslations('common');

  return (
    <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 sm:p-8 text-white shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.15),transparent_50%)]" />
      <div className="absolute right-0 top-0 h-full w-1/3 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSA2MCAwIEwgMCAwIDAgNjAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-60" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex size-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <GraduationCap className="size-5 text-indigo-300" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
              {teacherScoped ? tCommon('teacher_scope') : tCommon('student_registry')}
            </span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            {teacherScoped ? tCommon('your_students') : t('title')}
          </h1>
          <p className="mt-2 text-sm text-slate-400 max-w-lg">
            {teacherScoped ? t('subtitle_teacher') : t('subtitle')}
          </p>

          {canManageScope && (
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <CreateStudentModal />
              <Button
                variant="outline"
                onClick={onImportClick}
                className="h-10 rounded-xl border-white/20 bg-white/8 text-white hover:bg-white/15 hover:text-white backdrop-blur-sm"
              >
                <FileSpreadsheet className="mr-2 size-4 text-emerald-400" />
                {tCommon('import_excel')}
              </Button>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="flex shrink-0 gap-3 lg:gap-4">
          {[
            { label: tCommon('total'), value: totalCount, icon: UsersRound, color: 'text-indigo-300' },
            { label: tCommon('active'), value: activeCount, icon: UserRoundCheck, color: 'text-emerald-300' },
            { label: tCommon('groups'), value: groupCount, icon: Layers3, color: 'text-amber-300' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div
              key={label}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/6 px-5 py-4 min-w-[80px] backdrop-blur-sm"
            >
              <Icon className={cn('size-4 mb-1.5', color)} />
              <span className="text-2xl font-black tabular-nums">{value}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active ratio bar */}
      {rowsLength > 0 && (
        <div className="relative mt-6 pt-5 border-t border-white/8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="size-3.5 text-emerald-400" />
              {tCommon('active_rate')}
            </span>
            <span className="text-xs font-bold text-emerald-300">{activeRatio}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${activeRatio}%` }}
            />
          </div>
          <div className="mt-2 flex gap-4">
            <span className="text-[11px] text-slate-400">
              <span className="font-semibold text-emerald-300">{activeCount}</span> {tCommon('active')}
            </span>
            <span className="text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">{inactiveCount}</span> {tCommon('inactive')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
