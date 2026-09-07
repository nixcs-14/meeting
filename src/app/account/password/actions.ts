"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { changePassword } from "@/lib/users";

export type ChangePasswordState = {
  error?: string;
};

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Tous les champs sont obligatoires." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "Les deux mots de passe ne correspondent pas." };
  }

  const result = await changePassword(session!.email, currentPassword, newPassword);

  if (!result.ok) {
    return { error: result.error };
  }

  redirect("/dashboard");
}
