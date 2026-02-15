import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-sm">🐾</span>
            </div>
            <span className="text-lg font-bold text-gray-900">PetSocial</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Información que recopilamos</h2>
            <p className="text-gray-700 leading-relaxed">
              Recopilamos la información que nos proporcionas al crear una cuenta, como tu correo electrónico,
              nombre y los datos de tus mascotas. También recopilamos contenido que publicas, como fotos, videos
              y comentarios.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Cómo usamos tu información</h2>
            <p className="text-gray-700 leading-relaxed">
              Utilizamos tu información para proporcionar y mejorar nuestros servicios, personalizar tu experiencia,
              mostrar contenido relevante y mantener la seguridad de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Compartir información</h2>
            <p className="text-gray-700 leading-relaxed">
              No vendemos tu información personal. El contenido que publiques como público será visible para
              otros usuarios. Podemos compartir datos anonimizados con fines analíticos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Seguridad</h2>
            <p className="text-gray-700 leading-relaxed">
              Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal
              contra acceso no autorizado, pérdida o alteración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Tus derechos</h2>
            <p className="text-gray-700 leading-relaxed">
              Puedes acceder, modificar o eliminar tu información personal en cualquier momento desde la
              configuración de tu cuenta. También puedes solicitar una copia de tus datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Contacto</h2>
            <p className="text-gray-700 leading-relaxed">
              Si tienes preguntas sobre esta política de privacidad, puedes contactarnos a través de
              la sección de ayuda en la aplicación.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>© 2026 PetSocial. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
