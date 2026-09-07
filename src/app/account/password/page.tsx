import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Header from "@/components/Header";
import ChangePasswordForm from "./ChangePasswordForm";

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: { first?: string };
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const isFirstLogin = searchParams.first === "1";

  return (
    <main className="mx-auto max-w-lg px-3 py-6 sm:px-6">
      <Header email={session.email} />

      <div className="rounded-card border border-ms-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ms-muted">
          Sécurité du compte
        </div>
        <h3 className="mb-2 text-base font-bold text-ms-text sm:text-lg">
          Changer de mot de passe
        </h3>

        {isFirstLogin && (
          <p className="mb-4 rounded-md bg-ms-blue/10 px-3 py-2 text-sm text-ms-blueDark">
            Vous utilisez encore le mot de passe par défaut. Choisissez-en un
            nouveau avant de continuer.
          </p>
        )}

        <ChangePasswordForm />
      </div>
    </main>
  );
}
