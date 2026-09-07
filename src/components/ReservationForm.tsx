"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlots } from "@/lib/constants";

const SLOTS = generateSlots();
const todayStr = new Date().toISOString().slice(0, 10);

export default function ReservationForm() {
  const router = useRouter();
  const [requesterName, setRequesterName] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState(SLOTS[0]);
  const [endTime, setEndTime] = useState(SLOTS[SLOTS.length - 1]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!requesterName.trim()) {
      setError("Nom obligatoire");
      return;
    }
    if (!title.trim()) {
      setError("Objet de la réunion obligatoire");
      return;
    }
    if (startTime >= endTime) {
      setError("L'heure de fin doit être après l'heure de début");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterName, title, date, startTime, endTime }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }

      setSuccess(true);
      setTitle("");
      router.refresh();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ms-muted">
            Nom du demandeur
          </label>
          <input
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ms-muted">
            Objet de la réunion
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ms-muted">
            Date
          </label>
          <input
            type="date"
            min={todayStr}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ms-muted">
            Heure début
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ms-muted">
            Heure fin
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          >
            {SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-ms-redBg px-3 py-2 text-sm text-ms-red">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-md bg-ms-greenBg px-3 py-2 text-sm text-ms-green">
          ✅ Réservation confirmée
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-md bg-ms-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-ms-blueDark disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Envoi…" : "Confirmer la réservation"}
      </button>
    </form>
  );
}
