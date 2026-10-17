import { AdminView } from "@/components/admin/admin-view";

/**
 * Página de administración para la ruta `/admin`.
 *
 * Restringida a usuarios con rol `admin_sistema`. Los usuarios sin ese rol
 * son redirigidos automáticamente a `/dashboard`.
 *
 * @returns La vista del panel de administración.
 */
export default function AdminPage() {
  return <AdminView />;
}
