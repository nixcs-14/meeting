import LogoutButton from "./LogoutButton";

function initialsFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const parts = local.split(".");
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "U";
}

export default function Header({ email }: { email: string }) {
  return (
    <header className="mb-6 flex flex-col gap-3 rounded-card border border-ms-border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="flex items-center gap-3">
        <div className="text-2xl sm:text-3xl">📅</div>
        <div>
          <h1 className="text-base font-bold text-ms-text sm:text-xl">
            Salle de Réunion UNDP
          </h1>
          <p className="hidden text-xs text-ms-muted sm:block sm:text-sm">
            Réservation et gestion de la salle de réunion
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-ms-border bg-ms-bg py-1 pl-1 pr-3 text-xs sm:text-sm">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ms-blue text-[11px] font-bold text-white">
            {initialsFromEmail(email)}
          </span>
          <span className="max-w-[180px] truncate">{email}</span>
        </div>
        <LogoutButton />
      </div>
    </header>
  );
}
