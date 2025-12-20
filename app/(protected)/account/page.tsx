import { AccountView } from '@/modules/account';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon compte - Pulse CRM',
};

export default function AccountPage() {
  return <AccountView />;
}
