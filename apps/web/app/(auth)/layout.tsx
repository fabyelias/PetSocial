import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <span className="text-2xl">🐾</span>
            </div>
            <span className="text-2xl font-bold text-white">PetSocial</span>
          </Link>
        </div>

        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Conecta con una comunidad
            <br />
            de amantes de mascotas
          </h1>
          <p className="text-primary-100 text-lg max-w-md">
            Comparte los mejores momentos de tu mascota, encuentra amigos
            peludos y descubre contenido increíble.
          </p>

          {/* Stats */}
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">50K+</div>
              <div className="text-primary-200 text-sm">Mascotas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">1M+</div>
              <div className="text-primary-200 text-sm">Fotos compartidas</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">100K+</div>
              <div className="text-primary-200 text-sm">Usuarios activos</div>
            </div>
          </div>
        </div>

        <div className="text-primary-200 text-sm">
          © 2026 PetSocial. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho - Formulario */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
