'use client';

import { useParams, useRouter } from 'next/navigation';
import { useStudentDetail } from '@/hooks/useStudents';
import { ArrowLeft, BookOpen, Calendar, GraduationCap, MapPin, Phone, User, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const { data: student, isLoading, isError } = useStudentDetail(studentId);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (isError || !student) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Student not found or error loading data.</p>
            <Button variant="outline" onClick={() => router.push('/students')} className="mt-4">
              <ArrowLeft className="mr-2 size-4" />
              Back to Students
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/students')}>
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-black tracking-tight">{student.name}</h1>
          <p className="text-sm text-muted-foreground">Student profile and enrollments</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="size-5" />
              Personal Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Status</p>
              <Badge
                variant="outline"
                className={cn(
                  'mt-1 rounded-full',
                  student.status === 'ACTIVE'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
                )}
              >
                {student.status}
              </Badge>
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground">Phone</p>
              <div className="mt-1 flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">{student.phone}</p>
              </div>
            </div>

            {student.address && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Address</p>
                <div className="mt-1 flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <p className="text-sm">{student.address}</p>
                </div>
              </div>
            )}

            {student.parent && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Parent/Guardian</p>
                <div className="mt-1 flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <p className="text-sm">{student.parent}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="size-5" />
              Enrollments
            </CardTitle>
            <CardDescription>Groups and courses this student is enrolled in</CardDescription>
          </CardHeader>
          <CardContent>
            {student.enrollments.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
                <BookOpen className="mb-3 size-10 text-muted-foreground" />
                <p className="text-sm font-medium">No enrollments yet</p>
                <p className="text-xs text-muted-foreground">This student is not enrolled in any groups</p>
              </div>
            ) : (
              <div className="space-y-3">
                {student.enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground">{enrollment.group?.name ?? '-'}</h4>
                          {enrollment.group?.course && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              <BookOpen className="mr-1 inline size-3.5" />
                              {enrollment.group.course.title}
                            </p>
                          )}
                          {enrollment.group?.teacher && (
                            <p className="mt-1 text-sm text-muted-foreground">
                              <User className="mr-1 inline size-3.5" />
                              {enrollment.group.teacher.full_name}
                            </p>
                          )}
                          <p className="mt-2 text-xs text-muted-foreground">
                            <Calendar className="mr-1 inline size-3" />
                            Enrolled: {format(new Date(enrollment.enrolled_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="size-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl md:col-span-2" />
      </div>
    </div>
  );
}
