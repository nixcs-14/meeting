import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { requestNegotiation, acceptNegotiation, rejectNegotiation } from "@/lib/negotiation";
import { z } from "zod";
import { prisma } from "@/lib/db";

const negotiationSchema = z.object({
  reservationId: z.string(),
  proposedStartTime: z.string().regex(/^\d{2}:\d{2}$/),
  proposedEndTime: z.string().regex(/^\d{2}:\d{2}$/),
  proposedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const parsed = negotiationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Requête invalide." },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: parsed.data.reservationId },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Réservation non trouvée." },
        { status: 404 }
      );
    }

    if (reservation.requesterEmail.toLowerCase() === session.email.toLowerCase()) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas négocier votre propre réservation." },
        { status: 403 }
      );
    }

    const result = await requestNegotiation({
      ...parsed.data,
      requesterEmail: session.email,
      requesterName: session.email.split('@')[0].replace('.', ' '),
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Erreur négociation:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');

    if (!id || !action) {
      return NextResponse.json({ error: "Paramètres manquants." }, { status: 400 });
    }

    if (action === 'accept') {
      const result = await acceptNegotiation(id);
      return NextResponse.json(result);
    } else if (action === 'reject') {
      const result = await rejectNegotiation(id);
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch (error) {
    console.error('Erreur PATCH négociation:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}