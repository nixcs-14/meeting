import Link from "next/link";
import { getSession } from "@/lib/auth";
import { listReservations } from "@/lib/reservations";
import Header from "@/components/Header";
import RoomHero from "@/components/RoomHero";
import StatCard from "@/components/StatCard";
import DashboardCalendarSection from "@/components/DashboardCalendarSection";

export default async function DashboardPage() {
  const session = await getSession();
  const email = session!.email;

  const reservations = await listReservations();

  const calendarData = reservations.map((r) => ({
    id: r.id,
    title: r.title,
    requesterName: r.requesterName,
    date: r.date.toISOString().slice(0, 10),
    startTime: r.startTime,
    endTime: r.endTime,
  }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayCount = calendarData.filter((r) => r.date === todayStr).length;

  const upcoming = calendarData
    .filter((r) => r.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextWeekCount = upcoming.filter((r) => {
    const diff =
      (new Date(r.date).getTime() - new Date(todayStr).getTime()) /
      (1000 * 60 * 60 * 24);
    return diff >= 0 && diff < 7;
  }).length;

  const myUpcoming = reservations
    .filter((r) => r.requesterEmail.toLowerCase() === email.toLowerCase())
    .filter((r) => r.date.toISOString().slice(0, 10) >= todayStr)
    .sort((a, b) => a.date.getTime() - b.date.getTime())[0];

  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6">
      <Header email={email} />
      <RoomHero />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <StatCard label="Aujourd'hui" value={todayCount} hint="réservation(s)" />
        <StatCard label="7 prochains jours" value={nextWeekCount} hint="réservation(s)" />
        <StatCard
          label="Ma prochaine résa"
          value={myUpcoming ? myUpcoming.date.toISOString().slice(0, 10) : "—"}
          hint={myUpcoming ? `${myUpcoming.startTime}–${myUpcoming.endTime}` : "aucune"}
        />
        <StatCard label="Total à venir" value={upcoming.length} hint="au calendrier" />
      </div>

      <div className="mb-6 flex justify-end">
        <Link
          href="/reserve"
          className="rounded-md bg-ms-blue px-5 py-2.5 text-sm font-semibold text-white hover:bg-ms-blueDark"
        >
          + Nouvelle réservation
        </Link>
      </div>

      <div className="rounded-card border border-ms-border bg-white p-4 shadow-card sm:p-6">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-ms-muted">
          Vue d&apos;ensemble
        </div>
        <h3 className="mb-4 text-base font-bold text-ms-text sm:text-lg">
          Calendrier des réservations
        </h3>
        <DashboardCalendarSection reservations={calendarData} />
      </div>
    </main>
  );
}
