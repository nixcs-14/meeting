import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";
import bcrypt from 'bcryptjs';

async function seedTurso() {
  console.log("🌱 Démarrage du seed Turso...");

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
    const emails = [
      "nicolas.ramahalefitra@undp.org",
      "sitraka.rasolohery@undp.org",
      "nekena.razafinjatovo@undp.org",
      "andrilalao.raminosoa@undp.org",
      "ramahalefitra.abelson.nicolas@gmail.com"
    ];
    
    const DEFAULT_PASSWORD = "UNDP-Salle-2026";
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    
    console.log('📝 Création des utilisateurs sur Turso...');
    
    for (const email of emails) {
      try {
        await prisma.user.upsert({
          where: { email },
          update: {},
          create: {
            email,
            passwordHash,
            mustChangePassword: true,
          },
        });
        console.log(`✅ ${email} créé`);
      } catch (error) {
        console.error(`❌ Erreur pour ${email}:`, error);
      }
    }
    
    // Vérifier le nombre d'utilisateurs
    const userCount = await prisma.user.count();
    console.log(`📊 Total d'utilisateurs: ${userCount}`);
    
    console.log('✅ Seed Turso terminé avec succès !');
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedTurso();