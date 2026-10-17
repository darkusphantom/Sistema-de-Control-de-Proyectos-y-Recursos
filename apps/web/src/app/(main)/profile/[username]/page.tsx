import { notFound } from "next/navigation";
import { UserProfileView } from "@/components/profile/user-profile-view";
import { StaticUserRepository } from "@/lib/repositories/user-repository.static";
import { StaticAuthGateway } from "@/lib/auth/auth-gateway.static";

const userRepo = new StaticUserRepository();
const authGateway = new StaticAuthGateway();

type ProfilePageProps = {
  params: Promise<{ username: string }>;
};

/**
 * User profile page — `/profile/[username]`.
 *
 * Shows identity data and self-service editing. The "mis publicaciones"
 * section was removed in the Red FaCyT pivot; project-scoped activity will
 * replace it once the projects module exists.
 *
 * @param props - Page props with the dynamic username segment.
 * @returns The profile view, or 404 when the username does not exist.
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  // Decodificamos el username para manejar caracteres especiales en la URL
  // y removemos el prefijo '@' por si el usuario lo tipeó manualmente en la barra de direcciones.
  const decodedUsername = decodeURIComponent(username).replace(/^@/, "");
  const user = await userRepo.findByUsername(decodedUsername);

  if (!user) {
    notFound();
  }

  const session = await authGateway.getSession();
  const isOwnProfile = session?.user.id === user.id;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      <UserProfileView user={user} isOwnProfile={isOwnProfile} />
    </div>
  );
}
