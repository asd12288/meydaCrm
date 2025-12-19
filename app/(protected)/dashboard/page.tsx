import { CardBox, PageHeader } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tableau de bord - Meyda',
};

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Bienvenue dans votre CRM"
      />

      <CardBox>
        <p className="text-darklink">
          Cette page affichera bientot vos statistiques et activites recentes.
        </p>
      </CardBox>
    </div>
  );
}
