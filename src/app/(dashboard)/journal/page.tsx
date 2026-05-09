'use client';

import { useState, useMemo } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

// Mock data for groups (In a real app, this will come from API)
const MOCK_GROUPS = [
  { id: '1', name: 'Frontend React - 001', teacherId: 'teacher-1' },
  { id: '2', name: 'Backend Node.js - 102', teacherId: 'teacher-2' },
  { id: '3', name: 'Foundation - 505', teacherId: 'teacher-1' },
];

// Mock data for students
const MOCK_STUDENTS = [
  { id: '1', name: 'Ali Valiyev' },
  { id: '2', name: 'Sardor Rahimxon' },
  { id: '3', name: 'Malika Sobirova' },
  { id: '4', name: 'Dilnoza Orifova' },
  { id: '5', name: 'Jasur Hamroyev' },
];

export default function JournalPage() {
  const user = useAuthStore((state) => state.user);
  const isTeacher = user?.role === 'TEACHER';
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // RBAC: Filter groups based on role
  const visibleGroups = useMemo(() => {
    if (isAdmin) return MOCK_GROUPS;
    if (isTeacher) return MOCK_GROUPS.filter(g => g.teacherId === 'teacher-1'); // Matching mock teacher id
    return [];
  }, [isAdmin, isTeacher]);

  const [selectedGroup, setSelectedGroup] = useState(visibleGroups[0]?.id);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for attendance and scores
  const [journalData, setJournalData] = useState<Record<string, { status: string, score: string }>>({
    '1': { status: 'present', score: '5' },
    '2': { status: 'absent', score: '0' },
    '3': { status: 'present', score: '4' },
    '4': { status: 'present', score: '5' },
    '5': { status: 'present', score: '3' },
  });

  const updateAttendance = (studentId: string, status: string) => {
    setJournalData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const updateScore = (studentId: string, score: string) => {
    setJournalData(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], score }
    }));
  };

  const handleSave = () => {
    // Logic to save to backend
    console.log('Saving Journal Data:', { selectedGroup, date: currentDate, journalData });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Class Journal</h1>
            {isAdmin && (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100">
                <ShieldCheck className="size-3 mr-1" /> Admin View
              </Badge>
            )}
          </div>
          <p className="text-slate-500 mt-1">Manage attendance and grade student performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-6 font-bold"
          >
            <Save className="mr-2 h-4 w-4" /> Save Journal
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Groups and Date */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                <Users className="size-4 text-indigo-500" /> 
                {isTeacher ? 'My Groups' : 'All Groups'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 pt-3 space-y-1">
              {visibleGroups.map((group) => (
                <div 
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={cn(
                    "p-3 rounded-xl cursor-pointer transition-all border text-[13px] font-bold",
                    selectedGroup === group.id 
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-md" 
                      : "border-transparent hover:bg-slate-100 text-slate-600"
                  )}
                >
                  {group.name}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 pb-3 border-b">
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-600">
                <CalendarIcon className="size-4 text-indigo-500" /> Select Date
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border shadow-sm">
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600">
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm font-black text-slate-700">{format(currentDate, 'MMM dd, yyyy')}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-50 hover:text-indigo-600">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Attendance and Grading */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200/60 shadow-md overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-white">
              <div>
                <CardTitle className="text-lg font-black text-slate-800">Attendance & Grading</CardTitle>
                <CardDescription className="font-medium">Mark presence and award points.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 px-3 py-1 font-bold">
                  Lesson #12
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow>
                    <TableHead className="w-[250px] font-bold text-slate-700 pl-6">Student</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">Attendance</TableHead>
                    <TableHead className="text-center font-bold text-slate-700">Score (0-5)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_STUDENTS.map((student) => (
                    <TableRow key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-700 pl-6">{student.name}</TableCell>
                      
                      {/* Attendance Controls */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => updateAttendance(student.id, 'present')}
                            title="Present"
                            className={cn(
                              "size-9 flex items-center justify-center rounded-xl transition-all border",
                              journalData[student.id]?.status === 'present' 
                                ? "bg-green-500 border-green-500 text-white shadow-lg shadow-green-500/20" 
                                : "bg-white border-slate-200 text-slate-400 hover:border-green-300 hover:text-green-500"
                            )}
                          >
                            <CheckCircle2 className="size-5" />
                          </button>
                          <button 
                            onClick={() => updateAttendance(student.id, 'late')}
                            title="Late"
                            className={cn(
                              "size-9 flex items-center justify-center rounded-xl transition-all border",
                              journalData[student.id]?.status === 'late' 
                                ? "bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20" 
                                : "bg-white border-slate-200 text-slate-400 hover:border-amber-300 hover:text-amber-500"
                            )}
                          >
                            <Clock className="size-5" />
                          </button>
                          <button 
                            onClick={() => updateAttendance(student.id, 'absent')}
                            title="Absent"
                            className={cn(
                              "size-9 flex items-center justify-center rounded-xl transition-all border",
                              journalData[student.id]?.status === 'absent' 
                                ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-500/20" 
                                : "bg-white border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500"
                            )}
                          >
                            <XCircle className="size-5" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Grading Input */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <div className="relative w-20">
                            <Star className={cn(
                              "absolute left-2 top-1/2 -translate-y-1/2 size-3.5",
                              Number(journalData[student.id]?.score) > 0 ? "text-amber-500 fill-amber-500" : "text-slate-300"
                            )} />
                            <Input 
                              type="number"
                              min="0"
                              max="5"
                              value={journalData[student.id]?.score}
                              onChange={(e) => updateScore(student.id, e.target.value)}
                              className="pl-7 h-9 font-bold text-center border-slate-200 focus:ring-indigo-500"
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-400">/ 5</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
