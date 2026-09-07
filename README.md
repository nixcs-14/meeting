# Salle de Réunion UNDP — Next.js

Application de réservation de salle de réunion, style Microsoft Bookings :
connexion par e-mail (liste blanche), dashboard d'occupation, réservation
par créneau horaire, avec deux règles métier appliquées côté serveur :

1. **Pas de chevauchement horaire** — sur une même date, deux
   réservations ne peuvent pas avoir de créneaux qui se chevauchent
   (vérifié dans une transaction pour limiter le risque de course entre
   deux requêtes simultanées).
2. **Pas deux jours consécutifs pour la même personne** — vérifié à la
   création de chaque réservation.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- Prisma + **SQLite** (fichier local, zéro configuration de base externe)
- Sessions par cookie signé (JWT via `jose`), pas de mot de passe —
  authentification par simple vérification d'e-mail contre une liste
  blanche
- `@fullcalendar/react` pour le calendrier d'occupation

## Installation

```bash
npm install
cp .env.example .env
# éditer .env : SESSION_SECRET, AAF_WHITELIST (DATABASE_URL="file:./dev.db" fonctionne tel quel)

npx prisma migrate dev --name init
npm run dev
```

L'app est disponible sur http://localhost:3000 — elle redirige
automatiquement vers `/login`.

## Configuration

### Base de données

SQLite : rien à provisionner, `npx prisma migrate dev` crée directement le
fichier `prisma/dev.db`. Pratique pour un usage local ou sur un serveur
unique (VM, Docker) où le disque persiste entre les redémarrages.

⚠️ **Sur un hébergeur serverless (Vercel, Netlify…), le système de
fichiers est éphémère** : chaque déploiement (et parfois chaque requête)
repart d'une copie fraîche du dépôt, donc les réservations écrites en
base seraient perdues. Pour un déploiement serverless, il faudra soit
héberger l'app sur une VM/Docker classique avec un volume persistant
pour `prisma/dev.db`, soit revenir à une base hébergée (PostgreSQL —
il suffit de changer `provider = "sqlite"` en `"postgresql"` dans
`prisma/schema.prisma` et l'URL dans `.env`).

### Liste blanche des AAF

Deux options :
- Modifier `DEFAULT_WHITELIST` dans `src/lib/constants.ts`, **ou**
- Définir la variable d'environnement `AAF_WHITELIST` (liste d'e-mails
  séparés par des virgules) — elle prend le dessus sur la liste codée en
  dur.

### Secret de session

```bash
openssl rand -base64 32
```
À coller dans `SESSION_SECRET`.

## Déploiement

Comme indiqué plus haut, SQLite ne convient pas à un hébergement
serverless (Vercel, Netlify) à cause du système de fichiers éphémère.
Pour déployer :

- **VM / Docker classique** (le plus simple avec SQLite) : montez un
  volume persistant pointant sur le dossier `prisma/`, lancez
  `npx prisma migrate deploy` puis `npm run build && npm run start`.
- **Vercel ou autre serverless** : repassez sur PostgreSQL (voir
  ci-dessus), provisionnez une base (Neon, Supabase, Vercel Postgres),
  puis suivez le flux Vercel habituel avec `DATABASE_URL`,
  `SESSION_SECRET`, `AAF_WHITELIST` en variables d'environnement et
  `npx prisma migrate deploy` en étape de build.

Dans tous les cas, partagez l'URL déployée par e-mail aux AAF autorisés —
seule une adresse figurant dans la liste blanche pourra se connecter.

## Structure du projet

```
src/
  app/
    login/          page de connexion + server action + formulaire client
    dashboard/       KPIs + calendrier d'occupation (vue d'ensemble)
    reserve/          formulaire de réservation + "mes réservations"
    api/
      reservations/   GET (liste), POST (créer)
      reservations/[id]/  PATCH (modifier), DELETE (annuler) — propriétaire uniquement
      auth/logout/    déconnexion
    middleware.ts     protège /dashboard, /reserve, /api/reservations
  lib/
    auth.ts           signature/vérification du cookie de session (JWT)
    constants.ts       liste blanche, infos salle, créneaux horaires
    reservations.ts   règles métier (date unique, pas 2 jours de suite)
    db.ts             client Prisma
  components/          UI (Header, RoomHero, formulaires, calendrier…)
prisma/
  schema.prisma        modèle Reservation, un index sur `date`
```

## Notes

- Ce code a été écrit et relu attentivement mais **n'a pas pu être compilé
  ni testé dans cet environnement** (pas d'accès réseau pour installer les
  dépendances npm). Lancez `npm run build` après `npm install` pour
  attraper d'éventuelles erreurs de type avant de déployer.
- Toute personne de la liste blanche peut voir toutes les réservations
  (dashboard) mais ne peut modifier/supprimer que les siennes.
