import { Metadata } from 'next';
import { LeadsWorkspace } from '@/components/leads/LeadsWorkspace';

export const metadata: Metadata = {
  title: 'Leads | Bilim Nuru',
  description: 'Manage potential students and boost conversion with AI.',
};

export default function LeadsPage() {
  return <LeadsWorkspace />;
}
