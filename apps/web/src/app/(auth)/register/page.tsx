import { Metadata } from "next";
import { RegisterForm } from "@/components/forms/register-form";
import { AuthGuard } from "@/components/auth/auth-guard";

export const metadata: Metadata = {
  title: "Crear cuenta | Sistema de Control de Proyectos y Recursos",
  description: "Regístrate para gestionar proyectos, inventario, solicitudes y reportes.",
};

/**
 * Register page (public auth route group).
 *
 * @returns The register page section.
 */
export default function RegisterPage() {
  return (
    <AuthGuard>
      <RegisterForm />
    </AuthGuard>
  );
}