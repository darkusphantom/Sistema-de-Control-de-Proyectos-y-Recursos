"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";
import type { Session } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Possible states of the session resolution lifecycle. */
export type SessionStatus = "loading" | "authenticated" | "anonymous";

/** Value exposed by the session context. */
export type SessionContextValue = {
  status: SessionStatus;
  session: Session | null;
  /** Signs out and clears the stored session. */
  signOut: () => Promise<void>;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SessionContext = createContext<SessionContextValue | null>(null);

const gateway = new StaticAuthGateway();

// ─── Provider ─────────────────────────────────────────────────────────────────

/** Props accepted by {@link SessionProvider}. */
export type SessionProviderProps = {
  children: ReactNode;
};

/**
 * Resolves the active session from `localStorage` and gates authenticated
 * routes in the `(main)` group.
 *
 * Comportamiento:
 * - Mientras resuelve (`status === "loading"`): renderiza un contenedor
 *   `aria-busy` en vez de `children` para evitar el flash del contenido antes
 *   del redirect.
 * - `status === "anonymous"`: llama `router.replace("/login")` para que
 *   `/dashboard` no aparezca en el historial del navegador.
 * - `status === "authenticated"`: renderiza `children` con normalidad.
 *
 * The session lives outside React state (in `localStorage`), so this component
 * follows the same external-store pattern as `theme.ts`: a single `useEffect`
 * reads the store on mount and writes the result into local state.
 *
 * @param props - Provider props.
 * @returns The session context provider wrapping the authenticated shell.
 */
export function SessionProvider({ children }: SessionProviderProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let cancelled = false;

    gateway.getSession().then((resolved) => {
      if (cancelled) return;

      if (resolved) {
        setSession(resolved);
        setStatus("authenticated");
      } else {
        setStatus("anonymous");
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status === "anonymous") {
      router.replace("/login");
    }
  }, [status, router]);

  async function signOut() {
    await gateway.signOut();
    setSession(null);
    setStatus("anonymous");
  }

  if (status === "loading") {
    return (
      <div
        aria-busy="true"
        className="min-h-dvh"
        aria-label="Cargando sesión"
      />
    );
  }

  if (status === "anonymous") {
    // The redirect effect above handles navigation; render nothing to avoid
    // showing the authenticated shell for a frame before redirecting.
    return null;
  }

  return (
    <SessionContext.Provider value={{ status, session, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current session context value.
 *
 * Must be called inside a `SessionProvider`. Throws if used outside of one
 * so that missing providers are caught during development.
 *
 * @returns The session context: `{ status, session, signOut }`.
 * @throws When called outside a `SessionProvider`.
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used inside a <SessionProvider>.");
  }
  return ctx;
}
