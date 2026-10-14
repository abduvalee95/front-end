// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CreateStudentModal } from '@/components/students/CreateStudentModal';
import { I18nProvider } from '@/i18n/index';
import messages from '../../messages/en.json';

const services = vi.hoisted(() => ({
  createStudent: vi.fn(),
  createEnrollment: vi.fn(),
  getEnrollments: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
  toastInfo: vi.fn(),
}));

vi.mock('@/services/students', () => ({ studentService: { createStudent: services.createStudent } }));
vi.mock('@/services/enrollments', () => ({
  enrollmentService: { create: services.createEnrollment, getByStudent: services.getEnrollments },
}));
vi.mock('sonner', () => ({
  toast: { success: services.toastSuccess, error: services.toastError, info: services.toastInfo },
}));
vi.mock('@/store/auth.store', () => ({ useAuthStore: () => ({ user: { organization_id: 'org-1' } }) }));
vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({ data: [{ id: 'group-1', name: 'Morning group', course_id: 'course-1' }] }),
}));
vi.mock('@/hooks/useCourses', () => ({
  useCourses: () => ({ data: [{ id: 'course-1', title: 'English', price: '1000' }] }),
}));

// The native select keeps these tests focused on the two API writes and recovery.
// Dialog, form fields, buttons, translations and QueryClient are the real components.
vi.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: {
    children: ReactNode;
    value: string;
    onValueChange: (value: string) => void;
    disabled?: boolean;
  }) => (
    <select aria-label="Group" value={value} disabled={disabled} onChange={(event) => onValueChange(event.target.value)}>
      <option value="">Choose a group</option>
      {children}
    </select>
  ),
  SelectTrigger: () => null,
  SelectValue: () => null,
  SelectContent: ({ children }: { children: ReactNode }) => children,
  SelectItem: ({ children, value }: { children: ReactNode; value: string }) => <option value={value}>{children}</option>,
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => { resolve = res; });
  return { promise, resolve };
}

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const view = render(
    <QueryClientProvider client={queryClient}>
      <I18nProvider locale="en" messages={messages}>
        <CreateStudentModal />
      </I18nProvider>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole('button', { name: messages.students.add_student }));
  return { ...view, queryClient, invalidate };
}

function fillForm() {
  fireEvent.change(screen.getByLabelText('Full Name *'), { target: { value: 'Ali Test' } });
  fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+996700000001' } });
  fireEvent.change(screen.getByLabelText('Address *'), { target: { value: 'Bishkek' } });
  fireEvent.change(screen.getByRole('combobox', { name: 'Group' }), { target: { value: 'group-1' } });
  fireEvent.change(screen.getByLabelText('Discount'), { target: { value: '100' } });
}

function submitForm() {
  fireEvent.submit(screen.getByLabelText('Full Name *').closest('form')!);
}

beforeEach(() => {
  vi.resetAllMocks();
  services.createStudent.mockResolvedValue({ student: { id: 'student-1' }, temporaryPassword: 'one-time-password' });
  services.createEnrollment.mockResolvedValue({ id: 'enrollment-1', student_id: 'student-1', group_id: 'group-1' });
  services.getEnrollments.mockResolvedValue([]);
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(cleanup);

describe('CreateStudentModal recovery', () => {
  it('keeps the saved student and password across close/reopen, then retries only enrollment', async () => {
    services.createEnrollment.mockRejectedValueOnce(new Error('Group is unavailable'));
    const { invalidate } = setup();
    fillForm();
    submitForm();

    await screen.findByRole('button', { name: 'Retry enrollment' });
    expect(screen.getByRole('status').textContent).toContain('Student saved');
    expect(screen.getByRole('status').textContent).toContain('Group is unavailable');
    expect(screen.getByText('one-time-password')).toBeDefined();
    expect((screen.getByLabelText('Full Name *') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Phone Number *') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Address *') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Parent Info (Optional)') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByLabelText('Parent phone') as HTMLInputElement).disabled).toBe(true);
    expect((screen.getByRole('combobox', { name: 'Group' }) as HTMLSelectElement).disabled).toBe(true);
    expect((screen.getByLabelText('Discount') as HTMLInputElement).disabled).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['students', 'org-1'] });
    expect(services.toastSuccess).not.toHaveBeenCalled();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Close for now' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: messages.students.add_student }));
    expect(screen.getByText('one-time-password')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Retry enrollment' }));

    await waitFor(() => expect(services.toastSuccess).toHaveBeenCalledWith('Student created successfully'));
    expect(services.createStudent).toHaveBeenCalledTimes(1);
    expect(services.createEnrollment).toHaveBeenCalledTimes(2);
    expect(services.createEnrollment).toHaveBeenLastCalledWith({
      student_id: 'student-1', group_id: 'group-1', discount_amount: 100,
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['groups', 'org-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['enrollments', 'group', 'group-1'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['enrollments', 'student', 'student-1'] });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: messages.students.add_student }));
    expect((screen.getByLabelText('Full Name *') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Full Name *') as HTMLInputElement).disabled).toBe(false);
    expect(screen.queryByText('one-time-password')).toBeNull();
  });

  it('invalidates the student cache as soon as creation succeeds, before enrollment settles', async () => {
    const pendingEnrollment = deferred<{ id: string }>();
    services.createEnrollment.mockReturnValueOnce(pendingEnrollment.promise);
    const { invalidate } = setup();
    fillForm();
    submitForm();

    await waitFor(() => expect(services.createEnrollment).toHaveBeenCalledTimes(1));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['students', 'org-1'] });
    expect(services.toastInfo).toHaveBeenCalledWith('Temporary password: one-time-password', { duration: 10000 });
    expect(screen.getByText('one-time-password')).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('dialog')).toBeDefined();

    await act(async () => { pendingEnrollment.resolve({ id: 'enrollment-1' }); });
  });

  it('blocks two submit events in the same turn before React can disable the button', async () => {
    const pendingStudent = deferred<{ student: { id: string } }>();
    services.createStudent.mockReturnValue(pendingStudent.promise);
    setup();
    fillForm();
    act(() => {
      submitForm();
      submitForm();
    });
    expect(services.createStudent).toHaveBeenCalledTimes(1);
    await act(async () => { pendingStudent.resolve({ student: { id: 'student-1' } }); });
    expect(services.createEnrollment).toHaveBeenCalledTimes(1);
  });

  it('lets the user correct their profile and retry creation when creation itself fails', async () => {
    services.createStudent.mockRejectedValueOnce(new Error('Phone is invalid'));
    const { invalidate } = setup();
    fillForm();
    submitForm();
    await waitFor(() => expect(services.toastError).toHaveBeenCalledWith('Phone is invalid'));
    expect((screen.getByLabelText('Full Name *') as HTMLInputElement).disabled).toBe(false);
    expect(services.createEnrollment).not.toHaveBeenCalled();
    expect(invalidate).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Phone Number *'), { target: { value: '+996700000002' } });
    submitForm();
    await waitFor(() => expect(services.toastSuccess).toHaveBeenCalled());
    expect(services.createStudent).toHaveBeenCalledTimes(2);
    expect(services.createStudent).toHaveBeenLastCalledWith(expect.objectContaining({ phone: '+996700000002' }));
  });

  it('reconciles an enrollment whose success response was lost before retrying the write', async () => {
    services.createEnrollment.mockRejectedValueOnce(new Error('Network error'));
    services.getEnrollments.mockResolvedValueOnce([
      { id: 'enrollment-1', student_id: 'student-1', group_id: 'group-1' },
    ]);
    setup();
    fillForm();
    submitForm();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry enrollment' }));

    await waitFor(() => expect(services.toastSuccess).toHaveBeenCalled());
    expect(services.getEnrollments).toHaveBeenCalledWith('student-1');
    expect(services.createStudent).toHaveBeenCalledTimes(1);
    expect(services.createEnrollment).toHaveBeenCalledTimes(1);
  });

  it('keeps recovery available without another write when the enrollment reconciliation read fails', async () => {
    services.createEnrollment.mockRejectedValueOnce(new Error('Network error'));
    services.getEnrollments.mockRejectedValueOnce(new Error('Cannot check enrollment yet'));
    setup();
    fillForm();
    submitForm();
    fireEvent.click(await screen.findByRole('button', { name: 'Retry enrollment' }));

    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Cannot check enrollment yet'));
    expect(services.createStudent).toHaveBeenCalledTimes(1);
    expect(services.createEnrollment).toHaveBeenCalledTimes(1);
    expect(services.toastSuccess).not.toHaveBeenCalled();
    expect(screen.getByText('one-time-password')).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: 'Retry enrollment' }));
    await waitFor(() => expect(services.toastSuccess).toHaveBeenCalled());
    expect(services.getEnrollments).toHaveBeenCalledTimes(2);
    expect(services.createEnrollment).toHaveBeenCalledTimes(2);
    expect(services.createStudent).toHaveBeenCalledTimes(1);
  });
});
