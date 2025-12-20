import { LoginForm } from '../ui/login-form';
import { ThemeSwitcher, Logo } from '@/modules/shared';

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
          <div className="flex justify-center mb-4">
            <Logo width={200} height={35} />
          </div>

          {/* Login card */}
          <div className="bg-white dark:bg-darkgray rounded-lg shadow-md px-6 py-5">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold text-ld">Connexion</h1>
              <p className="text-darklink text-sm mt-1">
                Accedez a votre tableau de bord
              </p>
            </div>

            <LoginForm />
          </div>

          {/* Footer text */}
          <p className="text-center text-darklink text-xs mt-4">
            Meyda - CRM Solution
          </p>
        </div>
      </div>
    </div>
  );
}
