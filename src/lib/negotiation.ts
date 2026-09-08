import { prisma } from "./db";
import { notifyOwner } from "./email";

export type NegotiationRequest = {
  reservationId: string;
  requesterEmail: string;
  requesterName: string;
  proposedStartTime: string;
  proposedEndTime: string;
  proposedDate: string;
  message?: string;
};

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export async function requestNegotiation(input: NegotiationRequest) {
  try {
    const {
      reservationId,
      requesterEmail,
      requesterName,
      proposedStartTime,
      proposedEndTime,
      proposedDate,
      message,
    } = input;

    // Vérifier que prisma est disponible
    if (!prisma || !prisma.negotiation) {
      console.error('❌ Prisma ou modèle Negotiation non disponible');
      throw new Error("Service de base de données non disponible");
    }

    // Récupérer la réservation originale
    const originalReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
    });

    if (!originalReservation) {
      throw new Error("Réservation non trouvée");
    }

    // Vérifier que le créneau proposé est disponible
    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: toUtcDate(proposedDate),
        id: { not: reservationId },
      },
    });

    const conflicts = existingReservations.some(
      (r) => proposedStartTime < r.endTime && proposedEndTime > r.startTime
    );

    if (conflicts) {
      throw new Error("Le créneau proposé n'est pas disponible");
    }

    // Créer une demande de négociation
    const negotiation = await prisma.negotiation.create({
      data: {
        reservationId,
        requesterEmail: requesterEmail.toLowerCase(),
        requesterName,
        proposedStartTime,
        proposedEndTime,
        proposedDate: toUtcDate(proposedDate),
        message: message || "",
        status: "PENDING",
      },
    });

    // Notification UNIQUEMENT au propriétaire
    notifyOwner(
      originalReservation.requesterEmail,
      requesterName,
      originalReservation.title,
      proposedDate,
      proposedStartTime,
      proposedEndTime,
      message
    );

    return negotiation;
  } catch (error) {
    console.error('Erreur dans requestNegotiation:', error);
    throw error;
  }
}

export async function acceptNegotiation(negotiationId: string) {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: { reservation: true },
  });

  if (!negotiation) {
    throw new Error("Négociation non trouvée");
  }

  const updatedReservation = await prisma.reservation.update({
    where: { id: negotiation.reservationId },
    data: {
      date: negotiation.proposedDate,
      startTime: negotiation.proposedStartTime,
      endTime: negotiation.proposedEndTime,
    },
  });

  await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status: "ACCEPTED" },
  });

  return updatedReservation;
}

export async function rejectNegotiation(negotiationId: string) {
  const negotiation = await prisma.negotiation.findUnique({
    where: { id: negotiationId },
    include: { reservation: true },
  });

  if (!negotiation) {
    throw new Error("Négociation non trouvée");
  }

  await prisma.negotiation.update({
    where: { id: negotiationId },
    data: { status: "REJECTED" },
  });

  return true;
}

export async function getNegotiationsForReservation(reservationId: string) {
  return prisma.negotiation.findMany({
    where: { reservationId },
    orderBy: { createdAt: 'desc' },
  });
}