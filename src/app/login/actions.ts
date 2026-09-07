"use server";

import { redirect } from "next/navigation";
import { verifyCredentials } from "@/lib/users";
import { setSessionCookie } from "@/lib/auth";

export type LoginState = {
  error?: string;
};

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const rawEmail = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!rawEmail) {
    return { error: "Veuillez saisir votre adresse e-mail." };
  }
  if (!EMAIL_RE.test(rawEmail)) {
    return { error: "Adresse e-mail invalide." };
  }
  if (!password) {
    return { error: "Veuillez saisir votre mot de passe." };
  }

  const email = rawEmail.toLowerCase();

  const result = await verifyCredentials(email, password);

  if (!result.ok) {
    // Message volontairement générique : ne pas révéler si c'est l'e-mail
    // ou le mot de passe qui est incorrect (évite l'énumération de comptes).
    return { error: "Adresse e-mail ou mot de passe incorrect." };
  }

  await setSessionCookie(email);

  if (result.mustChangePassword) {
    redirect("/account/password?first=1");
  }

  redirect(next.startsWith("/") ? next : "/dashboard");
}
