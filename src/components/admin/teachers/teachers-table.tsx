'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import { TeacherActionsMenu } from './teacher-actions-menu'
import { TeacherProfile } from '@/types/teacher';



interface TeachersTableProps {
  teachers: TeacherProfile[]
  isLoading: boolean
  onTeacherClick: (teacher: TeacherProfile) => void
}

export function TeachersTable({
  teachers,
  isLoading,
  onTeacherClick,
}: TeachersTableProps) {
  if (isLoading) {
    return (
      <div className="hidden md:block rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Teacher</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[0, 1, 2, 3, 4].map((i) => (
              <TableRow key={i}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg bg-cyan-100/50 dark:bg-cyan-950/30 shrink-0" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32 bg-cyan-100/50 dark:bg-cyan-950/30" />
                      <Skeleton className="h-3 w-24 bg-cyan-100/50 dark:bg-cyan-950/30" />
                    </div>
                  </div>
                </TableCell>
                {[0, 1, 2].map((j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-4 w-20 bg-cyan-100/50 dark:bg-cyan-950/30" />
                  </TableCell>
                ))}
                <TableCell />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="hidden md:block rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Teacher</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right pr-4">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teachers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-24 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="h-16 w-16 rounded-2xl edu-gradient-primary flex items-center justify-center">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold">No teachers found</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Teachers will appear here when organizations add them to the platform.
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            teachers.map((teacher) => (
              <TableRow
                key={teacher.id}
                className="hover:bg-cyan-50/50 dark:hover:bg-cyan-950/20 cursor-pointer transition-colors"
                onClick={() => onTeacherClick(teacher)}
              >
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="edu-gradient-avatar text-sm font-semibold">
                        {getInitials(teacher.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{teacher.full_name}</p>
                      <p className="text-sm text-muted-foreground truncate">{teacher.email}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground font-mono">
                    {teacher.organization_id ? `${teacher.organization_id.substring(0,8)}...` : '—'}
                  </span>
                </TableCell>

                <TableCell>
                  {teacher.status ? (
                    <TeacherStatusBadge status={teacher.status} />
                  ) : (
                    <Badge variant="secondary">—</Badge>
                  )}
                </TableCell>

                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(teacher.created_at)}
                  </span>
                </TableCell>

                <TableCell className="text-right pr-4" onClick={(e) => e.stopPropagation()}>
                  <TeacherActionsMenu teacher={teacher} onView={() => onTeacherClick(teacher)} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function TeacherStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { className: string; label: string }> = {
    ACTIVE: {
      className: 'bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
      label: 'Active',
    },
    INACTIVE: {
      className: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      label: 'Inactive',
    },
    ON_LEAVE: {
      className: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      label: 'On Leave',
    },
  }

  const config = variants[status] || { className: '', label: status }

  return (
    <Badge className={cn(config.className, 'border')}>
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current inline-block" />
      {config.label}
    </Badge>
  )
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

