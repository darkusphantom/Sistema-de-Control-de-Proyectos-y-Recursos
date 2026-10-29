import type { DashboardRepository } from "./dashboard-repository";
import { StaticDashboardRepository } from "./dashboard-repository.static";
import type { UserRepository } from "./user-repository";
import { StaticUserRepository } from "./user-repository.static";

/**
 * Repositorios activos de la aplicación.
 *
 * Único punto de instanciación (*composition root*): conectar el backend es
 * sustituir el adaptador estático por el HTTP en estas dos líneas, sin tocar a
 * los consumidores (arquitectura hexagonal / patrón repositorio).
 *
 * Son singletons de módulo: sin asignaciones por render ni por request.
 */
export const userRepository: UserRepository = new StaticUserRepository();

export const dashboardRepository: DashboardRepository =
  new StaticDashboardRepository();
