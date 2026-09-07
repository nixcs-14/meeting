import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  createReservation,
  listReservations,
  ReservationError,
} from "@/lib/reservations";

export async function GET() {
  const reservations = await listReservations();
  return NextResponse.json(
    reservations.map((r) => ({
      id: r.id,
      requesterEmail: r.requesterEmail,
      requesterName: r.requesterName,
      title: r.title,
      date: r.date.toISOString().slice(0, 10),
      startTime: r.startTime,
      endTime: r.endTime,
    }))
  );
}

const createSchema = z.object({
  requesterName: z.string().trim().min(1, "Nom obligatoire"),
  title: z.string().trim().min(1, "Objet obligatoire"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure de début invalide"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure de fin invalide"),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  try {
    const reservation = await createReservation({
      requesterEmail: session.email,
      ...parsed.data,
    });
    return NextResponse.json(reservation, { status: 201 });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
