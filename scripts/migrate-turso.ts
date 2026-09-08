import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";

// Charger le fichier .env
try {
  const envFile = readFileSync(".env", "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)\s*$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.replace(/^("|')(.*)\1$/, "$2");
    if (process.env[key] === undefined) process.env[key] = value;
  }
} catch {
  // Les variables peuvent être fournies directement par l'environnement.
}

async function migrateTurso() {
  console.log("🚀 Démarrage de la migration Turso...");
  console.log("📁 Variables d'environnement chargées");

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  console.log("🔑 TURSO_DATABASE_URL:", tursoUrl ? "✅ Définie" : "❌ Manquante");
  console.log("🔑 TURSO_AUTH_TOKEN:", tursoToken ? "✅ Défini" : "❌ Manquant");

  if (!tursoUrl || !tursoToken) {
    console.error("❌ TURSO_DATABASE_URL ou TURSO_AUTH_TOKEN manquants");
    console.error("📋 Assurez-vous que ces variables sont définies dans .env");
    console.error("   TURSO_DATABASE_URL=libsql://salle-reunion-undp.turso.io");
    console.error("   TURSO_AUTH_TOKEN=votre-token");
    process.exit(1);
  }

  try {
    const client = createClient({ url: tursoUrl, authToken: tursoToken });

    console.log("📦 Création des tables...");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL,
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table User créée");

    await client.execute(`
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
    `);
    console.log("✅ Table Reservation créée");

    await client.execute(`
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
    `);
    console.log("✅ Table Negotiation créée");

    // Créer les index
    await client.execute(`CREATE INDEX IF NOT EXISTS "Reservation_date_idx" ON "Reservation"("date")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Reservation_requesterEmail_idx" ON "Reservation"("requesterEmail")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Negotiation_reservationId_idx" ON "Negotiation"("reservationId")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Negotiation_status_idx" ON "Negotiation"("status")`);
    console.log("✅ Index créés");

    console.log("✅ Migration Turso terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

migrateTurso();