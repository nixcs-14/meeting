"use server";

import { redirect } from "next/navigation";
import { isAuthorizedEmail } from "@/lib/constants";
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
  const next = String(formData.get("next") ?? "/dashboard");

  if (!rawEmail) {
    return { error: "Veuillez saisir votre adresse e-mail." };
  }
  if (!EMAIL_RE.test(rawEmail)) {
    return { error: "Adresse e-mail invalide." };
  }

  const email = rawEmail.toLowerCase();

  if (!isAuthorizedEmail(email)) {
    return {
      error:
        "Cette adresse n'est pas autorisée à accéder à l'application. Contactez l'administrateur si vous pensez qu'il s'agit d'une erreur.",
    };
  }

  await setSessionCookie(email);
  redirect(next.startsWith("/") ? next : "/dashboard");
}
