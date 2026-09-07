"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { generateSlots } from "@/lib/constants";

const SLOTS = generateSlots();

export type MyReservation = {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
};

export default function ReservationList({
  reservations,
}: {
  reservations: MyReservation[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (reservations.length === 0) {
    return (
      <p className="text-sm text-ms-muted">
        Vous n&apos;avez aucune réservation à venir.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {reservations.map((r) => (
        <ReservationRow
          key={r.id}
          reservation={r}
          isEditing={editingId === r.id}
          onEdit={() => setEditingId(r.id)}
          onCancelEdit={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null);
            router.refresh();
          }}
          onDeleted={() => router.refresh()}
          onError={setError}
        />
      ))}
      {error && (
        <p className="rounded-md bg-ms-redBg px-3 py-2 text-sm text-ms-red">
          {error}
        </p>
      )}
    </ul>
  );
}

function ReservationRow({
  reservation,
  isEditing,
  onEdit,
  onCancelEdit,
  onSaved,
  onDeleted,
  onError,
}: {
  reservation: MyReservation;
  isEditing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onError: (msg: string | null) => void;
}) {
  const [title, setTitle] = useState(reservation.title);
  const [startTime, setStartTime] = useState(reservation.startTime);
  const [endTime, setEndTime] = useState(reservation.endTime);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    onError(null);
    if (startTime >= endTime) {
      onError("L'heure de fin doit être après l'heure de début");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, startTime, endTime }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Erreur lors de la mise à jour.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    onError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Erreur lors de la suppression.");
        return;
      }
      onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-card border border-ms-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-ms-text">{reservation.title}</div>
          <div className="text-sm text-ms-muted">
            {reservation.date} · {reservation.startTime} – {reservation.endTime}
          </div>
        </div>
        {!isEditing && (
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="rounded-md border border-ms-border px-3 py-1.5 text-xs font-semibold hover:bg-ms-bg"
            >
              ✏️ Modifier
            </button>
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-md border border-ms-border px-3 py-1.5 text-xs font-semibold text-ms-red hover:bg-ms-redBg disabled:opacity-60"
            >
              🗑️ Supprimer
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div className="mt-4 space-y-3 border-t border-ms-border pt-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="rounded-md border border-ms-border px-3 py-2 text-sm"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="rounded-md border border-ms-border px-3 py-2 text-sm"
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={busy}
              className="rounded-md bg-ms-blue px-4 py-1.5 text-xs font-semibold text-white hover:bg-ms-blueDark disabled:opacity-60"
            >
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              onClick={onCancelEdit}
              className="rounded-md border border-ms-border px-4 py-1.5 text-xs font-semibold hover:bg-ms-bg"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
