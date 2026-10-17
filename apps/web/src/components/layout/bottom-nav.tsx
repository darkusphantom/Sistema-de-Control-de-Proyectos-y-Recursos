"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { HomeIcon, UserIcon, ShieldIcon } from "@/components/ui/icons";
import { useSession } from "@/lib/session/session-provider";
import type { ReactNode } from "react";

/** Single navigation destination configuration. */
type NavDestination = {
  href: string | ((username: string) => string);
  label: string;
  icon: ReactNode;
  adminOnly?: boolean;
  matchPrefix?: string;
};

/**
 * Barra de navegación inferior fija mostrada en móvil (`< 768px`).
 *
 * Especificación de diseño (pendiente de rediseño en fase 2 del pivot):
 * - `md:hidden` — desaparece en desktop; el `Navbar` maneja la navegación.
 * - Tres destinos: Dashboard, Perfil y Administración (solo admin). Con un
 *   usuario no admin solo se muestran dos.
 * - El destino activo usa `--accent-teal` y `aria-current="page"`.
 * - `pb-[env(safe-area-inset-bottom)]` evita que la barra solape el indicador
 *   de inicio en iOS.
 * - `min-h-14` (56px) asegura objetivos táctiles alcanzables.
 *
 * @returns La barra de navegación inferior fija, oculta en ≥768px.
 */
export function BottomNav() {
  const pathname = usePathname();
  const { session } = useSession();

  const isAdmin = session?.user.role === "admin";
  const username = session?.user.username ?? "";

  const destinations: NavDestination[] = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: <HomeIcon className="size-6" />,
      matchPrefix: "/dashboard",
    },
    {
      href: (u) => `/profile/${u}`,
      label: "Perfil",
      icon: <UserIcon className="size-6" />,
      matchPrefix: "/profile",
    },
    {
      href: "/admin",
      label: "Admin",
      icon: <ShieldIcon className="size-6" />,
      matchPrefix: "/admin",
      adminOnly: true,
    },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-30 md:hidden bg-surface border-t border-border pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex list-none m-0 p-0">
        {destinations.map(({ href, label, icon, adminOnly, matchPrefix }) => {
          if (adminOnly && !isAdmin) return null;

          const resolvedHref =
            typeof href === "function" ? href(username) : href;
          const isActive = matchPrefix
            ? pathname.startsWith(matchPrefix)
            : pathname === resolvedHref;

          return (
            <li key={resolvedHref} className="flex-1">
              <Link
                href={resolvedHref}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-accent-teal" : "text-text-muted",
                )}
              >
                <span
                  className={cn(
                    "transition-colors",
                    isActive && "[&_svg]:fill-current",
                  )}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
