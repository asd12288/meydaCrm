import { CardBox, PageHeader } from '@/modules/shared';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon compte - CRM Medya',
};

export default function AccountPage() {
  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Gerez vos parametres personnels"
      />

      <CardBox>
        <p className="text-darklink">
          Les parametres du compte seront implementes plus tard.
        </p>
      </CardBox>
    </div>
  );
}
