import { Metadata } from "next";
import { LoginForm } from "@/components/forms/login-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "Iniciar sesión | Sistema de Control de Proyectos y Recursos",
  description: "Accede al sistema para gestionar proyectos, inventario, solicitudes y reportes.",
};

/**
 * Login page (public auth route group).
 *
 * @returns The login page section.
 */
export default function LoginPage() {
  return (
    <AuthGuard>
      <LoginForm />
    </AuthGuard>
  );
}