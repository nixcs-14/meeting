import { prisma } from "./db";
import { notifyCreator, inviteParticipants } from "./email";

export class ReservationError extends Error {
  code:
    | "TIME_CONFLICT"
    | "CONSECUTIVE_DAY"
    | "INVALID_RANGE"
    | "PAST_DATE"
    | "NOT_FOUND"
    | "FORBIDDEN";
  constructor(code: ReservationError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

function toUtcDate(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function isPastDate(dateStr: string): boolean {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return dateStr < todayStr;
}

export type CreateReservationInput = {
  requesterEmail: string;
  requesterName: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participants?: string[]; // Non stocké en base, uniquement pour les emails
};

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

async function hasConsecutiveDayConflictTx(
  tx: TxClient,
  requesterEmail: string,
  dateStr: string,
  excludeReservationId?: string
): Promise<boolean> {
  const date = toUtcDate(dateStr);
  const dayBefore = addDays(date, -1);
  const dayAfter = addDays(date, 1);

  const existing = await tx.reservation.findMany({
    where: {
      requesterEmail: requesterEmail.toLowerCase(),
      date: { in: [dayBefore, dayAfter] },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    select: { id: true },
  });

  return existing.length > 0;
}

async function hasTimeOverlapTx(
  tx: TxClient,
  dateStr: string,
  startTime: string,
  endTime: string,
  excludeReservationId?: string
): Promise<boolean> {
  const date = toUtcDate(dateStr);

  const sameDay = await tx.reservation.findMany({
    where: {
      date,
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
    select: { startTime: true, endTime: true },
  });

  return sameDay.some((r) => startTime < r.endTime && endTime > r.startTime);
}

export async function createReservation(input: CreateReservationInput) {
  const { requesterEmail, requesterName, title, date, startTime, endTime, participants } = input;

  // Vérifier que la date n'est pas dans le passé
  if (isPastDate(date)) {
    throw new ReservationError("PAST_DATE", "Impossible de réserver une date passée.");
  }

  if (startTime >= endTime) {
    throw new ReservationError(
      "INVALID_RANGE",
      "L'heure de fin doit être après l'heure de début."
    );
  }

  const reservation = await prisma.$transaction(async (tx) => {
    const consecutive = await hasConsecutiveDayConflictTx(tx, requesterEmail, date);
    if (consecutive) {
      throw new ReservationError(
        "CONSECUTIVE_DAY",
        "Vous ne pouvez pas réserver la salle deux jours de suite."
      );
    }

    const overlap = await hasTimeOverlapTx(tx, date, startTime, endTime);
    if (overlap) {
      throw new ReservationError(
        "TIME_CONFLICT",
        "Ce créneau chevauche une réservation déjà existante sur cette date."
      );
    }

    return await tx.reservation.create({
      data: {
        requesterEmail: requesterEmail.toLowerCase(),
        requesterName,
        title,
        date: toUtcDate(date),
        startTime,
        endTime,
      },
    });
  });

  // Notifications
  const participantsList = participants?.filter(p => p.trim()) || [];
  const creatorEmail = requesterEmail;

  // Inviter les participants
  if (participantsList.length > 0) {
    inviteParticipants(
      creatorEmail,
      participantsList,
      title,
      date,
      startTime,
      endTime
    );
  }

  // Notifier le créateur
  notifyCreator(
    creatorEmail,
    title,
    date,
    startTime,
    endTime,
    participantsList
  );

  return reservation;
}

export type UpdateReservationInput = {
  id: string;
  requesterEmail: string;
  title: string;
  startTime: string;
  endTime: string;
};

export async function updateReservation(input: UpdateReservationInput) {
  const { id, requesterEmail, title, startTime, endTime } = input;

  // Vérifier que la date n'est pas dans le passé
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (existing && isPastDate(existing.date.toISOString().slice(0, 10))) {
    throw new ReservationError(
      "PAST_DATE",
      "Impossible de modifier une réservation passée."
    );
  }

  if (startTime >= endTime) {
    throw new ReservationError(
      "INVALID_RANGE",
      "L'heure de fin doit être après l'heure de début."
    );
  }

  let reservationData: any;

  await prisma.$transaction(async (tx) => {
    const existing = await tx.reservation.findUnique({ where: { id } });
    if (!existing) {
      throw new ReservationError("NOT_FOUND", "Réservation introuvable.");
    }
    if (existing.requesterEmail.toLowerCase() !== requesterEmail.toLowerCase()) {
      throw new ReservationError(
        "FORBIDDEN",
        "Vous ne pouvez modifier que vos propres réservations."
      );
    }

    const dateStr = existing.date.toISOString().slice(0, 10);

    const overlap = await hasTimeOverlapTx(tx, dateStr, startTime, endTime, id);
    if (overlap) {
      throw new ReservationError(
        "TIME_CONFLICT",
        "Ce créneau chevauche une réservation déjà existante sur cette date."
      );
    }

    reservationData = await tx.reservation.update({
      where: { id },
      data: { title, startTime, endTime },
    });
  });

  return reservationData;
}

export async function deleteReservation(id: string, requesterEmail: string) {
  const existing = await prisma.reservation.findUnique({ where: { id } });
  if (!existing) return;
  if (existing.requesterEmail.toLowerCase() !== requesterEmail.toLowerCase()) {
    throw new ReservationError(
      "FORBIDDEN",
      "Vous ne pouvez supprimer que vos propres réservations."
    );
  }

  // Vérifier que la date n'est pas dans le passé
  if (isPastDate(existing.date.toISOString().slice(0, 10))) {
    throw new ReservationError(
      "PAST_DATE",
      "Impossible de supprimer une réservation passée."
    );
  }

  await prisma.reservation.delete({ where: { id } });
}

export async function listReservations() {
  return prisma.reservation.findMany({ orderBy: { date: "asc" } });
}