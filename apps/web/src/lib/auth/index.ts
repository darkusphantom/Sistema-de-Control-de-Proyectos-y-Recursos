import type { AuthGateway } from "./auth-gateway";
import { StaticAuthGateway } from "./auth-gateway.static";

/**
 * Gateway de autenticación activo de la aplicación.
 *
 * Único punto de instanciación (*composition root*): los consumidores importan
 * esta constante en lugar de construir el adaptador. Conectar la API real se
 * reduce a cambiar la línea de abajo por `new HttpAuthGateway(...)`.
 *
 * Es un singleton de módulo: no se asigna nada por render ni por request.
 */
export const authGateway: AuthGateway = new StaticAuthGateway();
