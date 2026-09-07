import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const session = await getSession();
  if (session) {
    redirect(searchParams.next ?? "/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-ms-border bg-white p-10 text-center shadow-raised sm:p-10">
        <div className="mb-2 text-4xl">📅</div>
        <h1 className="mb-1 text-xl font-bold text-ms-text">
          Salle de Réunion UNDP
        </h1>
        <p className="mb-6 text-sm text-ms-muted">
          Connectez-vous avec votre adresse e-mail pour réserver ou consulter
          la salle. Accès réservé aux AAF autorisés.
        </p>
        <LoginForm next={searchParams.next} />
      </div>
    </main>
  );
}
