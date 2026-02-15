import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Última actualización: Febrero 2026</p>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Aceptación de los términos</h2>
            <p className="text-gray-700 leading-relaxed">
              Al acceder y utilizar PetSocial, aceptas estar sujeto a estos términos y condiciones.
              Si no estás de acuerdo con alguno de estos términos, no debes utilizar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Uso del servicio</h2>
            <p className="text-gray-700 leading-relaxed">
              PetSocial es una plataforma social para mascotas. Debes tener al menos 13 años para crear
              una cuenta. Eres responsable de mantener la seguridad de tu cuenta y contraseña.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. Contenido del usuario</h2>
            <p className="text-gray-700 leading-relaxed">
              Eres responsable del contenido que publicas. No se permite contenido que sea ilegal, ofensivo,
              que promueva el maltrato animal, o que viole los derechos de terceros. Nos reservamos el derecho
              de eliminar contenido que viole estas normas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. Propiedad intelectual</h2>
            <p className="text-gray-700 leading-relaxed">
              Conservas los derechos sobre el contenido que publicas. Al publicar contenido, nos otorgas
              una licencia no exclusiva para mostrarlo en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Conducta del usuario</h2>
            <p className="text-gray-700 leading-relaxed">
              No se permite el acoso, spam, suplantación de identidad, ni cualquier actividad que
              interfiera con el funcionamiento normal de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Terminación</h2>
            <p className="text-gray-700 leading-relaxed">
              Podemos suspender o terminar tu cuenta si violas estos términos. Puedes eliminar tu
              cuenta en cualquier momento desde la configuración.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Limitación de responsabilidad</h2>
            <p className="text-gray-700 leading-relaxed">
              PetSocial se proporciona &quot;tal cual&quot;. No garantizamos la disponibilidad ininterrumpida del
              servicio ni somos responsables de las interacciones entre usuarios.
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
