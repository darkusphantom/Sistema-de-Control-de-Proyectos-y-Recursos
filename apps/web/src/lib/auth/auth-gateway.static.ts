import { AuthGateway } from "./auth-gateway";
import { AuthResult, Session } from "@/lib/types";
import { mockUsers } from "@/data/users";

const SESSION_KEY = "facy:session";

/**
 * Indica si el bundle corre en producción.
 *
 * Next sustituye `process.env.NODE_ENV` en build, así que la comprobación es
 * una constante en el bundle final (coste cero en runtime).
 */
function isProduction(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV === "production";
}

/**
 * A static, in-memory implementation of the AuthGateway.
 * Used during the frontend static phase before the real backend is connected.
 * It uses `localStorage` to simulate session persistence in the browser.
 *
 * Fail-closed: en un build de producción las operaciones de autenticación
 * lanzan y `getSession` devuelve `null`, de modo que la maqueta no puede
 * autenticar a nadie aunque se olvide sustituirla. El build sí funciona, para
 * no bloquear una demo; el gate que impide publicarla vive en CI.
 */
export class StaticAuthGateway implements AuthGateway {
  /**
   * Bloquea el uso de la maqueta en producción.
   * @throws Error si `NODE_ENV === "production"`.
   */
  private assertNotProduction(): void {
    if (isProduction()) {
      throw new Error(
        "La autenticación estática está deshabilitada en producción: conecta el adaptador HTTP de la API.",
      );
    }
  }

  async signIn(credentials: FormData): Promise<AuthResult> {
    this.assertNotProduction();
    const username = credentials.get("username")?.toString() || "";
    const password = credentials.get("password")?.toString() || "";

    // For static gateway, we pretend any non-empty password is valid if the user exists
    const user = mockUsers.find(u => u.username === username);

    if (!user || !password) {
      return { success: false, error: "El usuario o la contraseña no coinciden." };
    }

    const session: Session = {
      user: { id: user.id, username: user.username, role: user.role },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, session };
  }

  async signUp(credentials: FormData): Promise<AuthResult> {
    this.assertNotProduction();
    const email = credentials.get("email")?.toString().toLowerCase() || "";
    const givenName = credentials.get("given-name")?.toString() || "";
    const familyName = credentials.get("family-name")?.toString() || "";

    const existingEmail = mockUsers.find(u => u.email.toLowerCase() === email);
    if (existingEmail) {
      return {
        success: false,
        error: "No pudimos crear la cuenta. Intenta de nuevo.",
        fieldErrors: { email: "Ya existe una cuenta con ese correo." }
      };
    }

    const newUser = {
      id: `u-${Date.now()}`,
      username: `${givenName.toLowerCase()}.${familyName.toLowerCase()}`,
      email,
      givenName,
      familyName,
      role: "coordinador" as const,
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    const session: Session = {
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    if (typeof window !== "undefined") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }

    return { success: true, session };
  }

  async getSession(): Promise<Session | null> {
    // En producción no hay sesión simulada: la app queda como anónima.
    if (isProduction() || typeof window === "undefined") return null;

    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    try {
      const session = JSON.parse(stored) as Session;
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  async signOut(): Promise<void> {
    if (typeof window !== "undefined") {
      localStorage.removeItem(SESSION_KEY);
    }
  }

  /**TODO: Implementar la logica para cambiar la contrasena */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async changePassword(_currentPassword: string, _newPassword: string): Promise<AuthResult> {
    this.assertNotProduction();
    const session = await this.getSession();
    if (!session) {
      return { success: false, error: "No hay sesión activa." };
    }
    // Static phase limitation: success is simulated, current password is not verified.
    return { success: true, session };
  }
}
