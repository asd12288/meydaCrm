import { AccountView } from '@/modules/account';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Mon compte - Meyda',
};

export default function AccountPage() {
  return <AccountView />;
}
