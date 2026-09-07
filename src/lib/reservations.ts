import { prisma } from "./db";

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
  // Stocke la date à minuit UTC pour éviter les décalages de fuseau horaire.
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
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
};

// Client de transaction Prisma (mêmes méthodes que `prisma`, mais lié à
// la transaction en cours pour que les lectures et l'écriture voient un
// état cohérent de la base).
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

/**
 * Vérifie qu'aucune réservation existante sur cette date ne chevauche le
 * créneau demandé. Deux créneaux se chevauchent si start < autreFin ET
 * fin > autreDébut — la comparaison de chaînes "HH:MM" fonctionne
 * directement grâce au format à largeur fixe.
 */
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
  const { requesterEmail, requesterName, title, date, startTime, endTime } = input;

  if (isPastDate(date)) {
    throw new ReservationError("PAST_DATE", "Impossible de réserver une date passée.");
  }

  if (startTime >= endTime) {
    throw new ReservationError(
      "INVALID_RANGE",
      "L'heure de fin doit être après l'heure de début."
    );
  }

  // La vérification + l'insertion sont regroupées dans une transaction
  // interactive : sur SQLite les écritures sont de toute façon
  // sérialisées (un seul fichier, un writer à la fois), donc ceci
  // élimine la fenêtre de course entre la vérification et l'insertion.
  return prisma.$transaction(async (tx) => {
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

    return tx.reservation.create({
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
}

export type UpdateReservationInput = {
  id: string;
  requesterEmail: string; // pour vérifier que la personne modifie bien sa propre résa
  title: string;
  startTime: string;
  endTime: string;
};

export async function updateReservation(input: UpdateReservationInput) {
  const { id, requesterEmail, title, startTime, endTime } = input;

  if (startTime >= endTime) {
    throw new ReservationError(
      "INVALID_RANGE",
      "L'heure de fin doit être après l'heure de début."
    );
  }

  return prisma.$transaction(async (tx) => {
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

    return tx.reservation.update({
      where: { id },
      data: { title, startTime, endTime },
    });
  });
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
  await prisma.reservation.delete({ where: { id } });
}

export async function listReservations() {
  return prisma.reservation.findMany({ orderBy: { date: "asc" } });
}
