import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyCredentials(
  email: string,
  password: string
): Promise<{ ok: true; mustChangePassword: boolean } | { ok: false }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) return { ok: false };

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false };

  return { ok: true, mustChangePassword: user.mustChangePassword };
}

export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) return { ok: false, error: "Compte introuvable." };

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) return { ok: false, error: "Mot de passe actuel incorrect." };

  if (newPassword.length < 8) {
    return {
      ok: false,
      error: "Le nouveau mot de passe doit faire au moins 8 caractères.",
    };
  }

  await prisma.user.update({
    where: { email: email.toLowerCase() },
    data: {
      passwordHash: await hashPassword(newPassword),
      mustChangePassword: false,
    },
  });

  return { ok: true };
}
