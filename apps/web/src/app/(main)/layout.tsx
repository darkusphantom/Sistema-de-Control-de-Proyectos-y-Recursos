import type { ReactNode } from "react";
import { SessionProvider } from "@/lib/session/session-provider";
import { Navbar } from "@/components/layout/navbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Footer } from "@/components/layout/footer";

/** Props accepted by {@link MainLayout}. */
type MainLayoutProps = {
  children: ReactNode;
  modal: ReactNode;
};

/**
 * Authenticated shell layout for the `(main)` route group.
 *
 * Structure:
 * 1. Skip link → focuses `#contenido` so keyboard users bypass the Navbar.
 * 2. `SessionProvider` — resolves the session from localStorage and redirects
 *    anonymous visitors to `/login` before rendering anything.
 * 3. `Navbar` — sticky, authenticated, with role-aware links.
 * 4. `<main id="contenido">` — receives `flex-1` and bottom padding that
 *    accommodates the fixed `BottomNav` on mobile without overlapping content.
 * 5. `BottomNav` — fixed bottom bar, hidden on ≥768px.
 * 6. `Footer` — institutional `contentinfo` landmark.
 *
 * The `modal` slot stays reserved for App Router parallel-route modals
 * (kept from the Red FaCyT pivot plan, decision #1).
 *
 * @param props - Layout props.
 * @returns The full authenticated shell.
 */
export default function MainLayout({ children, modal }: MainLayoutProps) {
  return (
    <>
      {/* Skip to content link — first focusable element */}
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-text focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Saltar al contenido
      </a>

      <SessionProvider>
        <div className="min-h-dvh flex flex-col bg-bg text-text">
          <Navbar />

          <main
            id="contenido"
            className="flex-1 pb-24 md:pb-0 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8"
          >
            {children}
          </main>

          <BottomNav />

          <Footer />
        </div>
        {modal}
      </SessionProvider>
    </>
  );
}
