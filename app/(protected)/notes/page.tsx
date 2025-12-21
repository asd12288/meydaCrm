import { Metadata } from 'next';
import { NotesView } from '@/modules/notes';

export const metadata: Metadata = {
  title: 'Mes notes - Pulse CRM',
  description: 'Gérez vos notes personnelles',
};

export default function NotesPage() {
  return <NotesView />;
}
