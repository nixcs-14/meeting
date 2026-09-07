import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import Header from "@/components/Header";
import ReservationForm from "@/components/ReservationForm";
import ReservationList from "@/components/ReservationList";

export default async function ReservePage() {
  const session = await getSession();
  const email = session!.email;

  const all = await listReservations();
  const mine = all
    .filter((r) => r.requesterEmail.toLowerCase() === email.toLowerCase())
    .filter((r) => r.date.toISOString().slice(0, 10) >= new Date().toISOString().slice(0, 10))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((r) => ({
      id: r.id,
      title: r.title,
      date: r.date.toISOString().slice(0, 10),
      startTime: r.startTime,
      endTime: r.endTime,
    }));

  return (
    <main className="mx-auto max-w-3xl px-3 py-6 sm:px-6">
      <Header email={email} />

      <div className="mb-4">
        <Link href="/dashboard" className="text-sm text-ms-blue hover:underline">
          ← Retour au tableau de bord
        </Link>
      </div>

      <div className="mb-6 rounded-card border border-ms-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ms-muted">
          Nouvelle réservation
        </div>
        <h3 className="mb-4 text-base font-bold text-ms-text sm:text-lg">
          Réservez un créneau
        </h3>
        <ReservationForm />
      </div>

      <div className="rounded-card border border-ms-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ms-muted">
          Mes réservations
        </div>
        <h3 className="mb-4 text-base font-bold text-ms-text sm:text-lg">
          Vos prochaines réservations
        </h3>
        <ReservationList reservations={mine} />
      </div>
    </main>
  );
}
