// Liste blanche des AAF autorisés. Peut être surchargée par la variable
// d'environnement AAF_WHITELIST (liste séparée par des virgules).
const DEFAULT_WHITELIST = [
  "nicolas.ramahalefitra@undp.org",
  "sitraka.rasolohery@undp.org",
  "nekena.razafinjatovo@undp.org",
  "andrilalao.raminosoa@undp.org",
  "ramahalefitra.abelson.nicolas@gmail.com"
];

export function getWhitelist(): string[] {
  const fromEnv = process.env.AAF_WHITELIST;
  if (fromEnv && fromEnv.trim().length > 0) {
    return fromEnv.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return DEFAULT_WHITELIST.map((e) => e.toLowerCase());
}

export function isAuthorizedEmail(email: string): boolean {
  return getWhitelist().includes(email.trim().toLowerCase());
}

export const ROOM_NAME = "Salle de Réunion — Bureau UNDP";
export const ROOM_CAPACITY = "12 personnes";

export const DAY_START = "08:00";
export const DAY_END = "17:00";
export const SLOT_MINUTES = 30;

export function generateSlots(): string[] {
  const slots: string[] = [];
  const [startH, startM] = DAY_START.split(":").map(Number);
  const [endH, endM] = DAY_END.split(":").map(Number);

  let current = startH * 60 + startM;
  const end = endH * 60 + endM;

  while (current <= end) {
    const h = Math.floor(current / 60)
      .toString()
      .padStart(2, "0");
    const m = (current % 60).toString().padStart(2, "0");
    slots.push(`${h}:${m}`);
    current += SLOT_MINUTES;
  }

  return slots;
}

export const SESSION_COOKIE_NAME = "salle_session";
