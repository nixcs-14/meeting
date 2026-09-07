import { ROOM_CAPACITY, ROOM_NAME, DAY_START, DAY_END } from "@/lib/constants";

export default function RoomHero() {
  return (
    <div className="mb-6 rounded-card bg-gradient-to-br from-ms-blue to-ms-blueDark p-5 text-white sm:p-7">
      <h2 className="text-lg font-bold sm:text-xl">{ROOM_NAME}</h2>
      <p className="hidden text-sm opacity-90 sm:block">
        Capacité : {ROOM_CAPACITY} · Ouverte de {DAY_START} à {DAY_END}, du
        lundi au vendredi · Une réservation par jour, pas deux jours
        consécutifs pour la même personne.
      </p>
    </div>
  );
}
