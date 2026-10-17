import { User } from "@/lib/types";

/**
 * Mock user dataset for the static frontend phase.
 * Credentials (passwords) are strictly NOT stored here.
 *
 * Distribution (docs/design/wireframes_feed.md §4.6):
 * - 1 admin
 * - 1 aprobador
 * - 3 coordinadores (one of which is the default session user)
 */
export const mockUsers: User[] = [
  {
    id: "u-1",
    username: "admin",
    email: "admin@facyt.edu",
    givenName: "Administrador",
    familyName: "Sistema",
    role: "admin_sistema",
    createdAt: "2026-01-01T00:00:00Z",
  },
  {
    id: "u-2",
    username: "j.perez",
    email: "juan@facyt.edu",
    givenName: "Juan",
    familyName: "Pérez",
    role: "aprobador",
    createdAt: "2026-01-15T00:00:00Z",
  },
  {
    id: "u-3",
    username: "m.rivas",
    email: "maria@correo.com",
    givenName: "María",
    familyName: "Rivas",
    role: "coordinador",
    createdAt: "2026-09-01T00:00:00Z",
  },
  {
    id: "u-4",
    username: "c.torres",
    email: "carlos@correo.com",
    givenName: "Carlos",
    familyName: "Torres",
    role: "coordinador",
    createdAt: "2026-09-02T00:00:00Z",
  },
  {
    id: "u-5",
    username: "l.gomez",
    email: "luisa@correo.com",
    givenName: "Luisa",
    familyName: "Gómez",
    role: "coordinador",
    createdAt: "2026-09-03T00:00:00Z",
  },
];

