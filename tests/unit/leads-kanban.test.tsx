// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { LeadsKanban } from '@/components/leads/LeadsKanban';
import type { Lead, LeadStatus } from '@/types/analytics';

const mutations = vi.hoisted(() => ({
  update: vi.fn(),
  convert: vi.fn(),
  updatePending: false,
  convertPending: false,
}));

vi.mock('@/hooks/useLeads', () => ({
  useUpdateLead: () => ({ mutate: mutations.update, isPending: mutations.updatePending }),
  useConvertLead: () => ({ mutate: mutations.convert, isPending: mutations.convertPending }),
}));

vi.mock('@/i18n/index', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

function lead(id: string, status: LeadStatus): Lead {
  return {
    id,
    organization_id: 'org-1',
    full_name: `Lead ${id}`,
    phone: '+996700000001',
    source: 'WEBSITE',
    status,
    admin: 'admin-1',
    created_at: '2026-10-14T09:00:00.000Z',
    updated_at: '2026-10-14T09:00:00.000Z',
  };
}

const leads = [
  lead('new-1', 'NEW'),
  lead('contacted-1', 'CONTACTED'),
  lead('converted-1', 'CONVERTED'),
  lead('lost-1', 'LOST'),
];

function drop(status: LeadStatus, id: string) {
  const heading = screen.getByRole('heading', { name: `status_${status.toLowerCase()}` });
  const column = heading.parentElement?.parentElement?.parentElement;
  if (!column) throw new Error(`Missing Kanban column ${status}`);
  fireEvent.drop(column, { dataTransfer: { getData: () => id } });
}

beforeEach(() => {
  vi.clearAllMocks();
  mutations.updatePending = false;
  mutations.convertPending = false;
});

afterEach(cleanup);

describe('LeadsKanban business actions', () => {
  it('uses the student conversion command when dropped into CONVERTED', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', 'new-1');

    expect(mutations.convert).toHaveBeenCalledWith('new-1', expect.any(Object));
    expect(mutations.update).not.toHaveBeenCalled();
  });

  it('keeps ordinary column moves as status updates', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONTACTED', 'new-1');

    expect(mutations.update).toHaveBeenCalledWith(
      { id: 'new-1', data: { status: 'CONTACTED' } },
      expect.any(Object),
    );
    expect(mutations.convert).not.toHaveBeenCalled();
  });

  it.each(['', 'unknown-lead'])('ignores a drop without a known lead: %s', (id) => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', id);

    expect(mutations.update).not.toHaveBeenCalled();
    expect(mutations.convert).not.toHaveBeenCalled();
  });

  it('does not write when a card stays in the same column', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('NEW', 'new-1');

    expect(mutations.update).not.toHaveBeenCalled();
    expect(mutations.convert).not.toHaveBeenCalled();
  });

  it('keeps converted leads terminal even for a synthetic drop', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    const convertedCard = screen.getByText('Lead converted-1').closest('[draggable]');
    expect(convertedCard?.getAttribute('draggable')).toBe('false');
    drop('NEW', 'converted-1');
    drop('LOST', 'converted-1');

    expect(mutations.update).not.toHaveBeenCalled();
    expect(mutations.convert).not.toHaveBeenCalled();
  });

  it('requires a lost lead to be reopened before conversion', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', 'lost-1');
    expect(mutations.convert).not.toHaveBeenCalled();
    expect(mutations.update).not.toHaveBeenCalled();

    drop('NEW', 'lost-1');
    expect(mutations.update).toHaveBeenCalledWith(
      { id: 'lost-1', data: { status: 'NEW' } },
      expect.any(Object),
    );
  });

  it.each(['updatePending', 'convertPending'] as const)('blocks actions while %s', (pending) => {
    mutations[pending] = true;
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', 'new-1');
    drop('LOST', 'contacted-1');
    const convertButton = screen.getAllByTitle('convert')[0] as HTMLButtonElement;
    expect(convertButton.disabled).toBe(true);
    fireEvent.click(convertButton);

    expect(mutations.convert).not.toHaveBeenCalled();
    expect(mutations.update).not.toHaveBeenCalled();
  });

  it('blocks rapid drop/button repeats before mutation state rerenders', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', 'new-1');
    drop('CONVERTED', 'new-1');
    fireEvent.click(screen.getAllByTitle('convert')[0]);
    drop('LOST', 'contacted-1');

    expect(mutations.convert).toHaveBeenCalledTimes(1);
    expect(mutations.update).not.toHaveBeenCalled();
  });

  it('allows retry after a failed conversion settles without moving the card early', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONVERTED', 'new-1');
    const options = mutations.convert.mock.calls[0][1] as { onSettled: () => void };
    options.onSettled();
    drop('CONVERTED', 'new-1');

    expect(mutations.convert).toHaveBeenCalledTimes(2);
    expect(screen.getByText('Lead new-1')).toBeTruthy();
    expect(mutations.update).not.toHaveBeenCalled();
  });

  it('releases the shared guard after a status update settles', () => {
    render(<LeadsKanban leads={leads} isLoading={false} />);

    drop('CONTACTED', 'new-1');
    const options = mutations.update.mock.calls[0][1] as { onSettled: () => void };
    options.onSettled();
    drop('CONVERTED', 'contacted-1');

    expect(mutations.update).toHaveBeenCalledTimes(1);
    expect(mutations.convert).toHaveBeenCalledWith('contacted-1', expect.any(Object));
  });
});
