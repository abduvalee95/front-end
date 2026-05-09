'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import TeachersTable from '@/components/dashboard/teachers/TeachersTable';
import { EditTeacherModal } from '@/components/dashboard/teachers/EditTeacherModal';
import { CreateTeacherModal } from '@/components/dashboard/teachers/CreateTeacherModal';
import { BulkImportDialog } from '@/components/shared/BulkImportDialog';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet } from 'lucide-react';
import { teacherService } from '@/services/teachers';
import type { TeacherProfile, CreateTeacherDto } from '@/types/teacher';

export default function TeachersPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TeacherProfile | null>(null);

  const handleBulkImport = async (data: any[]) => {
    // Map Excel data to CreateTeacherDto
    const teachers: CreateTeacherDto[] = data.map(item => ({
      full_name: String(item.full_name || '').trim(),
      phone: String(item.phone || '').trim(),
      email: item.email ? String(item.email).trim() : '',
      password: String(item.password || '123456'), // Default password
      role: 'TEACHER',
      hourly_rate: Number(item.hourly_rate) || 0,
      qualifications: String(item.qualifications || ''),
      bio: String(item.bio || ''),
      status: 'ACTIVE',
      subjects: item.subjects ? String(item.subjects).split(',').map((s: string) => s.trim()) : [],
    }));

    await teacherService.bulkCreate(teachers);
    queryClient.invalidateQueries({ queryKey: ['teachers'] });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Teachers</h1>
          <p className="text-slate-500 mt-1">Manage your educational staff and their profiles.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsImportOpen(true)} 
            className="border-green-600 text-green-600 hover:bg-green-50 shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" /> Import Excel
          </Button>
          <Button 
            onClick={() => setIsCreateOpen(true)} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"
          >
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </div>
      </div>

      <TeachersTable
        onEditClick={setEditTarget}
      />

      <EditTeacherModal
        teacher={editTarget}
        onClose={() => setEditTarget(null)}
      />

      <CreateTeacherModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <BulkImportDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={handleBulkImport}
        title="Import Teachers"
        description="Upload an Excel file to bulk add teachers to your organization."
        requiredFields={['full_name', 'phone']}
        columnMapping={{
          'Full Name': 'full_name',
          'Phone': 'phone',
          'Email': 'email',
          'Password': 'password',
          'Hourly Rate': 'hourly_rate',
          'Qualifications': 'qualifications',
          'Bio': 'bio',
          'Subjects': 'subjects'
        }}
      />
    </div>
  );
}
