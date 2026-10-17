"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";

const gateway = new StaticAuthGateway();

/**
 * Guard de cliente para las páginas públicas de auth.
 * Si ya existe una sesión, reemplaza la entrada del historial y redirige a
 * /dashboard.
 *
 * Nota: cuando el backend esté conectado, esta guarda debe resolverse en
 * middleware para evitar el parpadeo del redirect en cliente.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    gateway.getSession().then((session) => {
      if (session) {
        router.replace("/dashboard");
      } else {
        setIsChecking(false);
      }
    });
  }, [router]);

  if (isChecking) {
    return null; // Or a subtle loader, but null prevents flash of form
  }

  return <>{children}</>;
}
