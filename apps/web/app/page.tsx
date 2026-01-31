import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-xl">🐾</span>
            </div>
            <span className="text-xl font-bold text-white">PetSocial</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-white/90 hover:text-white font-medium"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="bg-white text-primary-600 px-4 py-2 rounded-xl font-medium hover:bg-gray-100 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            La red social
            <br />
            para tu mascota
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto">
            Conecta con miles de mascotas, comparte los mejores momentos y
            descubre una comunidad de amantes de los animales.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group flex items-center gap-2 bg-white text-primary-600 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-gray-100 transition-colors"
            >
              Crear cuenta gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="text-white border-2 border-white/30 px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-white/10 transition-colors"
            >
              Explorar
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Comparte fotos y videos
            </h3>
            <p className="text-white/70">
              Sube los mejores momentos de tu mascota y compártelos con la
              comunidad.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🐕</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Encuentra amigos peludos
            </h3>
            <p className="text-white/70">
              Conecta con otras mascotas de tu zona y organiza encuentros para
              jugar.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">💬</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              Mensajería instantánea
            </h3>
            <p className="text-white/70">
              Chatea con otros dueños, comparte consejos y coordina citas de
              juego.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-12 mt-32">
          <div className="text-center">
            <div className="text-4xl font-bold text-white">50K+</div>
            <div className="text-white/70 mt-1">Mascotas registradas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">1M+</div>
            <div className="text-white/70 mt-1">Fotos compartidas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">100K+</div>
            <div className="text-white/70 mt-1">Usuarios activos</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-white/60 text-sm">
          <p>© 2026 PetSocial. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-white">
              Términos
            </Link>
            <Link href="/privacy" className="hover:text-white">
              Privacidad
            </Link>
            <Link href="/help" className="hover:text-white">
              Ayuda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
