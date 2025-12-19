import { LoginForm } from '../ui/login-form';
import { ThemeSwitcher } from '@/modules/shared';

export function LoginView() {
  return (
    <div className="relative overflow-hidden h-screen">
      {/* Theme toggle in top right corner */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeSwitcher />
      </div>

      <div className="grid grid-cols-12 gap-3 h-screen bg-white dark:bg-dark">
        {/* Left side - decorative */}
        <div className="xl:col-span-4 lg:col-span-4 col-span-12 bg-primary lg:block hidden relative overflow-hidden">
          <div className="flex flex-col items-center justify-center h-full text-white p-8">
            <h1 className="text-3xl font-bold mb-4">CRM Medya</h1>
            <p className="text-center opacity-90">
              Gerez vos leads efficacement
            </p>
          </div>
        </div>

        {/* Right side - login form */}
        <div className="xl:col-span-8 lg:col-span-8 col-span-12 sm:px-12 px-4">
          <div className="flex h-screen items-center px-3 lg:justify-start justify-center">
            <div className="max-w-[420px] w-full mx-auto">
              {/* Logo */}
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary">CRM Medya</h2>
              </div>

              <h3 className="text-2xl font-bold my-3 text-ld">Connexion</h3>
              <p className="text-darklink text-sm font-medium">
                Accedez a votre tableau de bord
              </p>

              <LoginForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
