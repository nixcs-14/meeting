"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./Dialog";
import { CalendarReservation } from "./CalendarView";
import { generateSlots } from "@/lib/constants";

const SLOTS = generateSlots();

interface NegotiationModalProps {
  reservation: CalendarReservation | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NegotiationModal({
  reservation,
  isOpen,
  onClose,
  onSuccess,
}: NegotiationModalProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [proposedDate, setProposedDate] = useState(todayStr);
  const [proposedStartTime, setProposedStartTime] = useState(SLOTS[0]);
  const [proposedEndTime, setProposedEndTime] = useState(SLOTS[SLOTS.length - 1]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Garde de type : si reservation est null, ne pas afficher
  if (!reservation) {
    return null;
  }

  // ✅ Maintenant TypeScript sait que reservation n'est pas null
  // On peut utiliser reservation en toute sécurité
  const { id, title, date, startTime, endTime, requesterName, requesterEmail } = reservation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validation : date non passée
    if (proposedDate < todayStr) {
      setError("Impossible de proposer une date passée.");
      setLoading(false);
      return;
    }

    // Validation : heure début < heure fin
    if (proposedStartTime >= proposedEndTime) {
      setError("L'heure de fin doit être après l'heure de début");
      setLoading(false);
      return;
    }

    // Validation : même jour
    if (proposedDate === date && 
        proposedStartTime === startTime && 
        proposedEndTime === endTime) {
      setError("Le créneau proposé est identique à l'original.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/negotiations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: id,
          proposedDate,
          proposedStartTime,
          proposedEndTime,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la demande");
        return;
      }

      onSuccess();
      onClose();
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle className="text-xl font-bold text-ms-text mb-2">
          🤝 Proposer un créneau alternatif
        </DialogTitle>

        <p className="text-sm text-ms-muted mb-4">
          Vous souhaitez proposer un nouveau créneau pour la réservation 
          <br />
          <span className="font-semibold text-ms-text">"{title}"</span>
          <br />
          du {new Date(date).toLocaleDateString('fr-FR')}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ms-muted mb-1">
              📅 Date proposée
            </label>
            <input
              type="date"
              min={todayStr}
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-ms-muted mb-1">
                🕐 Heure début
              </label>
              <select
                value={proposedStartTime}
                onChange={(e) => setProposedStartTime(e.target.value)}
                className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-ms-muted mb-1">
                🕐 Heure fin
              </label>
              <select
                value={proposedEndTime}
                onChange={(e) => setProposedEndTime(e.target.value)}
                className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
              >
                {SLOTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ms-muted mb-1">
              💬 Message pour le propriétaire
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez pourquoi vous souhaitez modifier ce créneau..."
              className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20 resize-none"
              rows={3}
            />
          </div>

          {error && (
            <div className="rounded-md bg-ms-redBg px-3 py-2 text-sm text-ms-red">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-md border border-ms-border px-4 py-2 text-sm font-semibold text-ms-text hover:bg-ms-bg transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              {loading ? "Envoi..." : "📤 Proposer"}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-ms-border">
          <p className="text-xs text-ms-muted">
            💡 Le propriétaire recevra votre proposition par email et pourra l'accepter ou la refuser.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}