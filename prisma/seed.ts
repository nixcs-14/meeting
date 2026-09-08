import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const emails = [
    "nicolas.ramahalefitra@undp.org",
    "sitraka.rasolohery@undp.org",
    "nekena.razafinjatovo@undp.org",
    "andrilalao.raminosoa@undp.org",
    "ramahalefitra.abelson.nicolas@gmail.com"
  ];
  
  const DEFAULT_PASSWORD = "UNDP-Salle-2026";
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  
  console.log('📝 Création des utilisateurs...');
  
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
  
  console.log('✅ Seed terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });