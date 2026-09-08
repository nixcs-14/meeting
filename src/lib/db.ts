import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Vérifier si on doit utiliser Turso
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  // EN PRODUCTION ou si Turso est configuré
  if (tursoUrl && tursoToken) {
    console.log("🔗 Connexion à Turso");
    try {
      const libsql = createClient({
        url: tursoUrl,
        authToken: tursoToken,
      });
      const adapter = new PrismaLibSQL(libsql);
      return new PrismaClient({ adapter });
    } catch (error) {
      console.error("❌ Erreur connexion Turso:", error);
      throw error;
    }
  }

  // EN DÉVELOPPEMENT : SQLite local
  console.log("🔗 Connexion à SQLite local");
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}