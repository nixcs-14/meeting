import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

async function migrateTurso() {
  console.log("🚀 Démarrage de la migration Turso...");

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (!tursoUrl || !tursoToken) {
    console.error("❌ TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN manquants");
    process.exit(1);
  }

  const libsql = createClient({ url: tursoUrl, authToken: tursoToken });
  const adapter = new PrismaLibSQL(libsql);
  const prisma = new PrismaClient({ adapter });

  try {
    // Appliquer les migrations
    console.log("📦 Application des migrations...");
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Reservation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "requesterEmail" TEXT NOT NULL,
        "requesterName" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "date" DATETIME NOT NULL,
        "startTime" TEXT NOT NULL,
        "endTime" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Negotiation" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "reservationId" TEXT NOT NULL,
        "requesterEmail" TEXT NOT NULL,
        "requesterName" TEXT NOT NULL,
        "proposedDate" DATETIME NOT NULL,
        "proposedStartTime" TEXT NOT NULL,
        "proposedEndTime" TEXT NOT NULL,
        "message" TEXT,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Reservation_date_idx" ON "Reservation"("date")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Reservation_requesterEmail_idx" ON "Reservation"("requesterEmail")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Negotiation_reservationId_idx" ON "Negotiation"("reservationId")
    `;
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "Negotiation_status_idx" ON "Negotiation"("status")
    `;

    console.log("✅ Migration Turso terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTurso();