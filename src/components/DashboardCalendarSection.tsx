"use client";

import { useState } from "react";
import CalendarView, { CalendarReservation } from "./CalendarView";

export default function DashboardCalendarSection({
  reservations,
}: {
  reservations: CalendarReservation[];
}) {
  const [selected, setSelected] = useState<CalendarReservation | null>(null);

  function handleClick(id: string) {
    const r = reservations.find((res) => res.id === id) ?? null;
    setSelected(r);
  }

  return (
    <div>
      <CalendarView reservations={reservations} onEventClick={handleClick} />

      {selected && (
        <div className="mt-4 rounded-card border border-ms-border bg-ms-bg p-4 text-sm">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-semibold text-ms-text">{selected.title}</span>
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-ms-muted hover:text-ms-text"
            >
              Fermer ✕
            </button>
          </div>
          <div className="text-ms-muted">
            {selected.requesterName} · {selected.date} · {selected.startTime}–
            {selected.endTime}
          </div>
        </div>
      )}
    </div>
  );
}
