"use client";

import { Dialog, DialogContent, DialogTitle } from "./Dialog";
import { CalendarReservation } from "./CalendarView";

interface ReservationModalProps {
  reservation: CalendarReservation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onNegotiate?: () => void;
  isOwner?: boolean;
}

export default function ReservationModal({
  reservation,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onNegotiate,
  isOwner = false,
}: ReservationModalProps) {
  // ✅ Garde de type
  if (!reservation) {
    return null;
  }

  const { id, title, date, startTime, endTime, requesterName, requesterEmail } = reservation;

  function calculerDuree(start: string, end: string): string {
    const [startH, startM] = start.split(":").map(Number);
    const [endH, endM] = end.split(":").map(Number);
    
    let diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
    
    if (diffMinutes < 0) diffMinutes += 24 * 60;
    
    const heures = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    
    if (heures === 0) return `${minutes} min`;
    if (minutes === 0) return `${heures}h`;
    return `${heures}h${minutes}`;
  }

  // ✅ Vérification de la date passée
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reservationDate = new Date(date);
  reservationDate.setHours(0, 0, 0, 0);
  const isPast = reservationDate < today;

  // ✅ Debug logs
  console.log("📅 Date réservation:", date);
  console.log("📅 Date aujourd'hui:", today.toISOString().slice(0, 10));
  console.log("🔍 isPast:", isPast);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md rounded-lg bg-white p-6 shadow-xl">
        <DialogTitle className="text-xl font-bold text-ms-text mb-2">
          📅 Détails de la réservation
        </DialogTitle>

        <div className="space-y-4 mt-4">
          <div className="border-b border-ms-border pb-3">
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Objet
            </div>
            <div className="mt-1 text-base font-medium text-ms-text">
              {title}
            </div>
          </div>

          <div className="border-b border-ms-border pb-3">
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Demandeur
            </div>
            <div className="mt-1 text-base text-ms-text">
              {requesterName}
            </div>
          </div>

          <div className="border-b border-ms-border pb-3">
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Email
            </div>
            <div className="mt-1 text-base text-ms-text">
              {requesterEmail}
            </div>
          </div>

          <div className="border-b border-ms-border pb-3">
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Date
            </div>
            <div className="mt-1 text-base text-ms-text">
              {new Date(date).toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
              {isPast && (
                <span className="ml-2 inline-block rounded bg-ms-redBg px-2 py-0.5 text-xs text-ms-red">
                  ⚠️ Passée
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-ms-border pb-3">
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Horaire
            </div>
            <div className="mt-1 text-base text-ms-text">
              {startTime} – {endTime}
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-ms-muted uppercase tracking-wide">
              Durée
            </div>
            <div className="mt-1 text-base text-ms-text">
              {calculerDuree(startTime, endTime)}
            </div>
          </div>

        
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-ms-border pt-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-ms-border px-4 py-2 text-sm font-semibold text-ms-text hover:bg-ms-bg transition-colors"
          >
            Fermer
          </button>
          
          {/* ✅ BOUTONS POUR LE PROPRIÉTAIRE (réservations non passées) */}
          {isOwner && !isPast && (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(id)}
                  className="flex-1 rounded-md bg-ms-blue px-4 py-2 text-sm font-semibold text-white hover:bg-ms-blueDark transition-colors"
                >
                  ✏️ Modifier
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(id)}
                  className="flex-1 rounded-md bg-ms-red px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors"
                >
                  🗑️ Supprimer
                </button>
              )}
            </>
          )}

          {/* ✅ BOUTON POUR LES AUTRES (réservations non passées) */}
          {!isOwner && !isPast && onNegotiate && (
            <button
              onClick={onNegotiate}
              className="flex-1 rounded-md bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              🤝 Proposer un créneau
            </button>
          )}

          {/* ✅ MESSAGE POUR LES RÉSERVATIONS PASSÉES */}
          {isPast && (
            <p className="w-full text-center text-sm text-ms-muted">
              ⚠️ Cette réservation est passée
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}