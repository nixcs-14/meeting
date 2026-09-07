"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-ms-blue px-5 py-2.5 font-semibold text-white transition-colors hover:bg-ms-blueDark disabled:opacity-60"
    >
      {pending ? "Connexion…" : "Continuer"}
    </button>
  );
}

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction] = useFormState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-3 text-left">
      <input type="hidden" name="next" value={next ?? "/dashboard"} />
      <label htmlFor="email" className="sr-only">
        Adresse e-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        placeholder="prenom.nom@undp.org"
        className="w-full rounded-md border border-ms-border px-4 py-2.5 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
      />

      <label htmlFor="password" className="sr-only">
        Mot de passe
      </label>
      <input
        id="password"
        name="password"
        type="password"
        required
        placeholder="Mot de passe"
        autoComplete="current-password"
        className="w-full rounded-md border border-ms-border px-4 py-2.5 text-sm outline-none focus:border-ms-blue focus:ring-2 focus:ring-ms-blue/20"
      />

      {state?.error && (
        <p className="rounded-md bg-ms-redBg px-3 py-2 text-sm text-ms-red">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
