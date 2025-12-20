import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page non trouvée - Pulse CRM',
  description: 'La page que vous recherchez n\'existe pas',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-lightgray dark:bg-dark px-4">
      <div className="text-center max-w-md w-full">
        <div className="mb-8 flex justify-center">
          <Image
            src="/404-illustration.png"
            alt="404 - Page non trouvée"
            width={400}
            height={400}
            className="w-full max-w-[400px] h-auto"
            priority
          />
        </div>
        <h1 className="text-3xl font-semibold mb-4 text-ld">Page non trouvée</h1>
        <p className="text-darklink mb-8">
          Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/dashboard"
          className="ui-button btn-primary inline-flex items-center gap-2"
        >
          Retour au tableau de bord
        </Link>
      </div>
    </div>
  );
}
