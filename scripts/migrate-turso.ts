import { createClient, type Client } from "@libsql/client";
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

// Définition déclarative des colonnes attendues par table.
// Ajouter une ligne ici suffit pour que la prochaine exécution du script
// applique automatiquement la colonne manquante sur Turso.
type ColumnDef = {
  name: string;
  // Clause SQL complète pour ADD COLUMN, ex: `TEXT NOT NULL DEFAULT ''`
  ddl: string;
};

const EXPECTED_COLUMNS: Record<string, ColumnDef[]> = {
  User: [
    { name: "passwordHash", ddl: `TEXT NOT NULL DEFAULT ''` },
    { name: "mustChangePassword", ddl: `BOOLEAN NOT NULL DEFAULT 1` },
  ],
  // Ajouter ici les futures colonnes pour Reservation / Negotiation
  // au fur et à mesure de l'évolution du schema.prisma
};

async function getExistingColumns(client: Client, table: string): Promise<Set<string>> {
  const result = await client.execute(`PRAGMA table_info("${table}")`);
  return new Set(result.rows.map((row) => String(row.name)));
}

async function syncColumns(client: Client, table: string, expected: ColumnDef[]) {
  const existing = await getExistingColumns(client, table);
  for (const col of expected) {
    if (existing.has(col.name)) {
      console.log(`   ⏭️  ${table}.${col.name} déjà présente`);
      continue;
    }
    console.log(`   ➕ Ajout de ${table}.${col.name}...`);
    await client.execute(`ALTER TABLE "${table}" ADD COLUMN "${col.name}" ${col.ddl}`);
    console.log(`   ✅ ${table}.${col.name} ajoutée`);
  }
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

    console.log("📦 Création des tables (si absentes)...");

    await client.execute(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "email" TEXT NOT NULL UNIQUE,
        "passwordHash" TEXT NOT NULL DEFAULT '',
        "mustChangePassword" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Table User OK");

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
    console.log("✅ Table Reservation OK");

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
    console.log("✅ Table Negotiation OK");

    // Créer les index
    await client.execute(`CREATE INDEX IF NOT EXISTS "Reservation_date_idx" ON "Reservation"("date")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Reservation_requesterEmail_idx" ON "Reservation"("requesterEmail")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "User_email_key" ON "User"("email")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Negotiation_reservationId_idx" ON "Negotiation"("reservationId")`);
    await client.execute(`CREATE INDEX IF NOT EXISTS "Negotiation_status_idx" ON "Negotiation"("status")`);
    console.log("✅ Index OK");

    // Étape clé : synchroniser les colonnes qui auraient pu manquer sur
    // une table créée AVANT une évolution du schema (cas typique : ajout
    // de passwordHash / mustChangePassword après coup).
    console.log("🔄 Synchronisation des colonnes...");
    for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
      console.log(`   📋 Table ${table}:`);
      await syncColumns(client, table, columns);
    }

    console.log("✅ Migration Turso terminée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  }
}

migrateTurso();