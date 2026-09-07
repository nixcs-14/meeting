import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  deleteReservation,
  updateReservation,
  ReservationError,
} from "@/lib/reservations";

const updateSchema = z.object({
  title: z.string().trim().min(1, "Objet obligatoire"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure de début invalide"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Heure de fin invalide"),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
      { status: 400 }
    );
  }

  try {
    const updated = await updateReservation({
      id: params.id,
      requesterEmail: session.email,
      ...parsed.data,
    });
    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    await deleteReservation(params.id, session.email);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof ReservationError) {
      return NextResponse.json({ error: e.message, code: e.code }, { status: 403 });
    }
    console.error(e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
