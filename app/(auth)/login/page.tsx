import { LoginView } from '@/modules/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Pulse CRM',
  description: 'Connectez-vous à votre CRM',
};

export default function LoginPage() {
  return <LoginView />;
}
