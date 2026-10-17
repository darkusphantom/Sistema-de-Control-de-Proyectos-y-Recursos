"use server";

import { revalidatePath } from "next/cache";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";
import { StaticUserRepository } from "@/lib/repositories/user-repository.static";
import { validateUpdateProfile, validateChangePassword } from "@/lib/validation/profile";

const userRepo = new StaticUserRepository();
const authGateway = new StaticAuthGateway();

export async function updateProfileAction(formData: FormData) {
  const session = await authGateway.getSession();
  if (!session) {
    return { success: false, error: "Debes iniciar sesión para editar tu perfil.", fieldErrors: {} };
  }

  const validation = validateUpdateProfile(formData);
  if (!validation.success) {
    return { success: false, error: "Revisa los campos del formulario.", fieldErrors: validation.errors };
  }

  try {
    const patch = {
      givenName: formData.get("givenName")?.toString(),
      familyName: formData.get("familyName")?.toString(),
      email: formData.get("email")?.toString(),
      bio: formData.get("bio")?.toString() || null,
      avatarUrl: formData.get("avatarUrl")?.toString() || null,
    };
    
    await userRepo.update(session.user.id, patch);
    
    revalidatePath("/profile/[username]", "page");
    return { success: true };
  } catch {
    return { success: false, error: "No pudimos guardar los cambios. Intenta de nuevo.", fieldErrors: {} };
  }
}

export async function changePasswordAction(formData: FormData) {
  const session = await authGateway.getSession();
  if (!session) {
    return { success: false, error: "Debes iniciar sesión para cambiar la contraseña.", fieldErrors: {} };
  }

  const validation = validateChangePassword(formData);
  if (!validation.success) {
    return { success: false, error: "Revisa los campos del formulario.", fieldErrors: validation.errors };
  }

  try {
    const currentPassword = formData.get("currentPassword")?.toString() || "";
    const newPassword = formData.get("newPassword")?.toString() || "";

    const result = await authGateway.changePassword(currentPassword, newPassword);
    if (!result.success) {
      return { success: false, error: result.error || "No pudimos guardar los cambios. Intenta de nuevo.", fieldErrors: result.fieldErrors || {} };
    }
    
    return { success: true };
  } catch {
    return { success: false, error: "No pudimos guardar los cambios. Intenta de nuevo.", fieldErrors: {} };
  }
}

export async function removeAvatarAction() {
  const session = await authGateway.getSession();
  if (!session) {
    return { success: false, error: "Debes iniciar sesión para editar tu perfil." };
  }

  try {
    await userRepo.update(session.user.id, { avatarUrl: null });
    revalidatePath("/profile/[username]", "page");
    return { success: true };
  } catch {
    return { success: false, error: "No pudimos guardar los cambios. Intenta de nuevo." };
  }
}
