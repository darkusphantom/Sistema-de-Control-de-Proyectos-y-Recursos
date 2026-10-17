import Link from "next/link";

/**
 * Landing page placeholder — pivot a "Sistema de Control de Proyectos".
 *
 * La bienvenida estilo gaceta de Red FaCyT fue retirada en el pivot; esta
 * página es un marcador mínimo para mantener viva la ruta `/` hasta que el
 * agente `designer` entregue el nuevo brief y wireframes (fase 2 del pivot).
 *
 * @returns Marcador público de bienvenida con enlace a login.
 */
export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold text-text">
        Sistema de Control de Proyectos y Recursos
      </h1>
      <p className="text-text-muted max-w-md">
        La nueva bienvenida se está diseñando. Mientras tanto, puedes acceder al
        sistema.
      </p>
      <Link
        href="/login"
        className="rounded-md bg-accent px-6 py-2 font-medium text-white"
      >
        Iniciar sesión
      </Link>
    </main>
  );
}
