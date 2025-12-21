import { LoginForm } from '../ui/login-form';
import { ThemeSwitcher, Logo, HoverVideo } from '@/modules/shared';

export function LoginView() {
  return (
    <div className="relative min-h-screen bg-lightgray dark:bg-dark">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      {/* Centered login card */}
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-95">
          {/* Logo centered above the card */}
          <div className="flex items-center justify-center gap-1 mb-6">
            <HoverVideo
              src="/pulse-logo.webm"
              width={80}
              height={80}
              alt="Pulse CRM Animation"
              className="rounded"
            />
            <Logo size="xl" />
          </div>

          {/* Login card */}
          <div className="bg-white dark:bg-darkgray rounded-lg shadow-md px-6 py-5">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-ld">Connexion</h1>
              <p className="text-darklink text-sm mt-1">
                Accédez à votre tableau de bord
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Footer text */}
          <p className="text-center text-darklink text-xs mt-4">
            Pulse CRM - Rapide, Fiable, Sécurisé
          </p>
        </div>
      </div>
    </div>
  );
}
