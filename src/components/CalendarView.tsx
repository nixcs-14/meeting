"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import { DAY_END, DAY_START } from "@/lib/constants";

export type CalendarReservation = {
  id: string;
  title: string;
  requesterName: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
};

export default function CalendarView({
  reservations,
  onEventClick,
}: {
  reservations: CalendarReservation[];
  onEventClick?: (id: string) => void;
}) {
  const events = reservations.map((r) => ({
    id: r.id,
    title: `${r.title} (${r.requesterName})`,
    start: `${r.date}T${r.startTime}:00`,
    end: `${r.date}T${r.endTime}:00`,
  }));

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="timeGridWeek"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      slotMinTime={`${DAY_START}:00`}
      slotMaxTime={`${DAY_END}:00`}
      height={620}
      events={events}
      eventClick={(info) => onEventClick?.(info.event.id)}
      locale={frLocale}
      buttonText={{ today: "Aujourd'hui" }}
    />
  );
}
