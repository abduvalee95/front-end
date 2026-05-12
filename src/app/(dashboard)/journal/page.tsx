'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { useTranslations } from '@/i18n/index';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar as CalendarIcon,
  Users,
  CheckCircle2,
  XCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Clock,
  Star,
  ShieldCheck,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { useGroups } from '@/hooks/useGroups';
import { useGroupEnrollments } from '@/hooks/useStudents';
import { useJournalByGroup, useUpsertJournal } from '@/hooks/useJournal';
import type { JournalStatus } from '@/types/journal';

interface LocalEntry {
  status: JournalStatus;
  score: string;
  notes: string;
}

export default function JournalPage() {
  const t = useTranslations('journal');
  const tCommon = useTranslations('common');
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localEntries, setLocalEntries] = useState<Record<string, LocalEntry>>({});

  const dateStr = format(currentDate, 'yyyy-MM-dd');

  const { data: groups, isLoading: groupsLoading } = useGroups();

  const visibleGroups = useMemo(() => {
    if (!groups) return [];
    if (isTeacher) return groups.filter((g) => g.teacher_id === user?.id);
    return groups;
  }, [groups, isTeacher, user?.id]);

  useEffect(() => {
    if (visibleGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(visibleGroups[0].id);
    }
  }, [visibleGroups, selectedGroupId]);

  const enrollmentResults = useGroupEnrollments(
    selectedGroupId ? [selectedGroupId] : [],
    !!selectedGroupId,
  );
  const enrollments = enrollmentResults[0]?.data ?? [];
  const enrollmentsLoading = enrollmentResults[0]?.isLoading ?? false;

  const { data: journalData, isLoading: journalLoading } = useJournalByGroup(
    selectedGroupId,
    { date: dateStr },
    !!selectedGroupId,
  );

  useEffect(() => {
    if (!journalData || !enrollments.length) return;
    const map: Record<string, LocalEntry> = {};
    enrollments.forEach((e) => {
      const existing = journalData.items.find((j) => j.student_id === e.student_id);
      map[e.student_id] = {
        status: existing?.status ?? 'PRESENT',
        score: existing?.score != null ? String(existing.score) : '',
        notes: existing?.notes ?? '',
      };
    });
    setLocalEntries(map);
  }, [journalData, enrollments]);

  const upsert = useUpsertJournal();

  const updateStatus = (studentId: string, status: JournalStatus) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const updateScore = (studentId: string, score: string) => {
    setLocalEntries((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], score },
    }));
  };

  const handleSave = () => {
    if (!selectedGroupId || !enrollments.length) return;
    upsert.mutate({
      group_id: selectedGroupId,
      date: dateStr,
      entries: enrollments.map((e) => {
        const entry = localEntries[e.student_id];
        return {
          student_id: e.student_id,
          status: entry?.status ?? 'PRESENT',
          score: entry?.score ? Number(entry.score) : undefined,
          notes: entry?.notes || undefined,
        };
      }),
    });
  };

  const isLoading = enrollmentsLoading || journalLoading;
  const selectedGroup = visibleGroups.find((g) => g.id === selectedGroupId);

  const stats = useMemo(() => {
    const values = Object.values(localEntries);
    return {
      present: values.filter((v) => v.status === 'PRESENT').length,
      late: values.filter((v) => v.status === 'LATE').length,
      absent: values.filter((v) => v.status === 'ABSENT').length,
    };
  }, [localEntries]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">{t('title')}</h1>
            {isAdmin && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                <ShieldCheck className="size-3 mr-1" /> Admin View
              </Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1">{t('subtitle')}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={upsert.isPending || !selectedGroupId || !enrollments.length}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-6 font-bold"
          >
            <Save className="mr-2 h-4 w-4" />
            {upsert.isPending ? tCommon('loading') : t('save_attendance')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                <Users className="size-4 text-indigo-500" />
                {isTeacher ? tCommon('your_groups') : 'All Groups'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-3 space-y-1">
              {groupsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 rounded-xl" />
                ))
              ) : visibleGroups.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{tCommon('no_data')}</p>
              ) : (
                visibleGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={cn(
                      'p-3 rounded-xl cursor-pointer transition-all border text-[13px] font-bold',
                      selectedGroupId === group.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                        : 'border-transparent hover:bg-slate-100 text-slate-600',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="size-3.5 shrink-0" />
                      <span className="truncate">{group.name}</span>
                    </div>
                    {group.teacher && selectedGroupId !== group.id && (
                      <p className="text-[10px] font-medium text-slate-400 mt-0.5 ml-5 truncate">
                        {group.teacher.full_name}
                      </p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                <CalendarIcon className="size-4 text-indigo-500" /> {t('date')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => setCurrentDate((d) => subDays(d, 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-black text-slate-700">
                  {format(currentDate, 'MMM dd, yyyy')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600"
                  onClick={() => setCurrentDate((d) => addDays(d, 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {enrollments.length > 0 && (
            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-50/50 pb-3 border-b">
                <CardTitle className="text-sm font-bold text-slate-600">{t('today')}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-green-600 font-bold">
                    <CheckCircle2 className="size-3.5" /> {t('present')}
                  </span>
                  <Badge className="bg-green-100 text-green-700 border-0">{stats.present}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-amber-600 font-bold">
                    <Clock className="size-3.5" /> {t('late')}
                  </span>
                  <Badge className="bg-amber-100 text-amber-700 border-0">{stats.late}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-red-600 font-bold">
                    <XCircle className="size-3.5" /> {t('absent')}
                  </span>
                  <Badge className="bg-red-100 text-red-700 border-0">{stats.absent}</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/60 shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
              <div>
                <CardTitle className="text-lg font-black text-slate-800">
                  {selectedGroup ? selectedGroup.name : t('group')}
                </CardTitle>
                <CardDescription className="font-medium">
                  {selectedGroup
                    ? `${format(currentDate, 'EEEE, MMMM d yyyy')} — ${t('attendance')}`
                    : 'Choose a group from the left panel'}
                </CardDescription>
              </div>
              {enrollments.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1 font-bold"
                >
                  {enrollments.length} students
                </Badge>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {!selectedGroupId ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <BookOpen className="size-12 mb-3 opacity-30" />
                  <p className="font-bold text-slate-500">{t('group')}</p>
                  <p className="text-sm mt-1">Select a group from the left panel</p>
                </div>
              ) : isLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : enrollments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <AlertCircle className="size-12 mb-3 opacity-30" />
                  <p className="font-bold text-slate-500">No students enrolled</p>
                  <p className="text-sm mt-1">Enroll students in this group first</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[250px] font-bold text-slate-700 pl-6">
                        {tCommon('student')}
                      </TableHead>
                      <TableHead className="text-center font-bold text-slate-700">
                        {t('attendance')}
                      </TableHead>
                      <TableHead className="text-center font-bold text-slate-700">
                        Score (0–100)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment) => {
                      const studentId = enrollment.student_id;
                      const entry = localEntries[studentId];
                      const name = enrollment.student?.name ?? studentId;
                      return (
                        <TableRow
                          key={studentId}
                          className="hover:bg-slate-50/50 transition-colors"
                        >
                          <TableCell className="font-bold text-slate-700 pl-6">{name}</TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => updateStatus(studentId, 'PRESENT')}
                                title="Present"
                                className={cn(
                                  'size-9 flex items-center justify-center rounded-xl transition-all border',
                                  entry?.status === 'PRESENT'
                                    ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-500',
                                )}
                              >
                                <CheckCircle2 className="size-5" />
                              </button>
                              <button
                                onClick={() => updateStatus(studentId, 'LATE')}
                                title="Late"
                                className={cn(
                                  'size-9 flex items-center justify-center rounded-xl transition-all border',
                                  entry?.status === 'LATE'
                                    ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500',
                                )}
                              >
                                <Clock className="size-5" />
                              </button>
                              <button
                                onClick={() => updateStatus(studentId, 'ABSENT')}
                                title="Absent"
                                className={cn(
                                  'size-9 flex items-center justify-center rounded-xl transition-all border',
                                  entry?.status === 'ABSENT'
                                    ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20'
                                    : 'bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500',
                                )}
                              >
                                <XCircle className="size-5" />
                              </button>
                            </div>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative w-24">
                                <Star
                                  className={cn(
                                    'absolute left-2 top-1/2 -translate-y-1/2 size-3.5',
                                    Number(entry?.score) > 0
                                      ? 'text-amber-500 fill-amber-500'
                                      : 'text-slate-300',
                                  )}
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={entry?.score ?? ''}
                                  onChange={(e) => updateScore(studentId, e.target.value)}
                                  className="pl-7 h-9 font-bold text-center border-slate-200 focus:ring-indigo-500"
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-400">/ 100</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
