"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link } from "lucide-react";

type MyReservation = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  requesterName: string;
  requesterEmail: string;
};

export default function MyReservationsList({
  reservations,
}: {
  reservations: MyReservation[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-ms-muted">Vous n&apos;avez pas encore de réservations.</p>
        <Link
          href="/reserve"
          className="mt-4 inline-block rounded-md bg-ms-blue px-4 py-2 text-sm font-semibold text-white hover:bg-ms-blueDark"
        >
          + Créer ma première réservation
        </Link>
      </div>
    );
  }

  async function handleDelete(id: string) {
    if (!confirm("Voulez-vous vraiment supprimer cette réservation ?")) return;
    
    setDeleting(id);
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Erreur lors de la suppression");
        return;
      }
      
      router.refresh();
    } catch (error) {
      alert("Erreur lors de la suppression");
    } finally {
      setDeleting(null);
    }
  }

  function handleEdit(id: string) {
    router.push(`/reserve?edit=${id}`);
  }

  // Vérifier si une date est passée
  function isPast(date: string): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate < today;
  }

  return (
    <div className="space-y-3">
      {reservations.map((r) => {
        const past = isPast(r.date);
        
        return (
          <div
            key={r.id}
            className={`rounded-card border p-4 transition-colors ${
              past 
                ? "border-gray-200 bg-gray-50 opacity-60" 
                : "border-ms-border bg-white hover:shadow-md"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-ms-text">{r.title}</span>
                  {past && (
                    <span className="text-xs text-ms-red">(Passée)</span>
                  )}
                </div>
                <div className="text-sm text-ms-muted">
                  {new Date(r.date).toLocaleDateString("fr-FR", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {" · "}
                  {r.startTime} – {r.endTime}
                </div>
                <div className="text-xs text-ms-muted">
                  Demandeur: {r.requesterName}
                </div>
              </div>
              
              {!past && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(r.id)}
                    className="rounded-md bg-ms-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-ms-blueDark transition-colors"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
                    className="rounded-md bg-ms-red px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                  >
                    {deleting === r.id ? "..." : "🗑️ Supprimer"}
                  </button>
                </div>
              )}
              
              {past && (
                <span className="text-xs text-ms-muted">
                  ⚠️ Réservation passée
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}