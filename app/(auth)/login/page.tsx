import { LoginView } from '@/modules/auth';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - CRM Medya',
  description: 'Connectez-vous a votre CRM',
};

export default function LoginPage() {
  return <LoginView />;
}
