"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction, type ChangePasswordState } from "./actions";

const initialState: ChangePasswordState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-ms-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-ms-blueDark disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Enregistrement…" : "Changer le mot de passe"}
    </button>
  );
}

export default function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePasswordAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold text-ms-muted">
          Mot de passe actuel
        </label>
        <input
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ms-muted">
          Nouveau mot de passe
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
        />
        <p className="mt-1 text-xs text-ms-muted">Au moins 8 caractères.</p>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-ms-muted">
          Confirmer le nouveau mot de passe
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full rounded-md border border-ms-border px-3 py-2 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
        />
      </div>

      {state?.error && (
        <p className="rounded-md bg-ms-redBg px-3 py-2 text-sm text-ms-red">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
