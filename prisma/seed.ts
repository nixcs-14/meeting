import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { getWhitelist } from "../src/lib/constants";

// Mot de passe par défaut partagé, attribué à tous les comptes créés par
// ce script. Chaque utilisateur devra le changer à sa première connexion
// (mustChangePassword=true). Peut être surchargé via la variable
// d'environnement DEFAULT_PASSWORD.
const DEFAULT_PASSWORD = process.env.DEFAULT_PASSWORD ?? "UNDP-Salle-2026";

async function main() {
  const emails = getWhitelist();
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  for (const email of emails) {
    await prisma.user.upsert({
      where: { email },
      update: {}, // ne touche pas aux comptes déjà créés (mot de passe déjà changé, etc.)
      create: {
        email,
        passwordHash,
        mustChangePassword: true,
      },
    });
  }

  console.log(`\n✅ ${emails.length} compte(s) créé(s) ou déjà présent(s) :`);
  emails.forEach((e) => console.log(`   - ${e}`));
  console.log(`\n🔑 Mot de passe par défaut pour les nouveaux comptes : ${DEFAULT_PASSWORD}`);
  console.log(
    "   Chaque utilisateur sera invité à le changer à sa première connexion.\n" +
      "   Communiquez ce mot de passe par un canal sûr (pas par e-mail en clair idéalement).\n"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
