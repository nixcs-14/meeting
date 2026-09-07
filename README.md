# Salle de Réunion UNDP — Next.js

Application de réservation de salle de réunion, style Microsoft Bookings :
connexion par e-mail **+ mot de passe**, dashboard d'occupation, réservation
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
- Prisma + **SQLite / Turso** (libSQL) — SQLite en local, Turso (hébergé,
  compatible serverless) en production
- Comptes utilisateurs avec mot de passe haché (**bcrypt**) — voir
  "Comptes et mots de passe" ci-dessous
- Sessions par cookie signé (JWT via `jose`)
- `@fullcalendar/react` pour le calendrier d'occupation

## Installation (développement local)

```bash
npm install
cp .env.example .env
# éditer .env : SESSION_SECRET, AAF_WHITELIST, DEFAULT_PASSWORD
# (DATABASE_URL="file:./dev.db" fonctionne tel quel, TURSO_* pas nécessaires en local)

npx prisma migrate dev --name init
npm run prisma:seed
npm run dev
```

`npm run prisma:seed` crée un compte pour chaque adresse de
`AAF_WHITELIST`, avec le mot de passe défini dans `DEFAULT_PASSWORD`
(affiché aussi dans la console à la fin du script). Chaque personne est
invitée à le changer dès sa première connexion (page
`/account/password`, redirection automatique).

L'app est disponible sur http://localhost:3000 — elle redirige
automatiquement vers `/login`. Tant que `TURSO_DATABASE_URL` n'est pas
défini, `src/lib/db.ts` utilise le fichier SQLite local — aucun compte
Turso n'est nécessaire pour développer.

## Comptes et mots de passe

- Les comptes vivent dans la table `User` (e-mail + hash bcrypt du mot
  de passe), créée par `npx prisma migrate dev` et peuplée par
  `npm run prisma:seed`.
- **Tous les comptes créés par le seed partagent le même mot de passe
  par défaut** (`DEFAULT_PASSWORD`). C'est volontairement simple pour le
  démarrage, mais chaque compte a `mustChangePassword=true` : à la
  première connexion, l'utilisateur est automatiquement redirigé vers
  `/account/password` et ne peut pas y échapper tant qu'il n'a pas
  choisi un nouveau mot de passe (au moins 8 caractères).
- Il n'y a pas (encore) de "mot de passe oublié" — pour réinitialiser un
  compte bloqué, relancez le seed après avoir supprimé la ligne
  correspondante dans la table `User` (via `npx prisma studio`), ou
  ajoutez manuellement une commande d'admin si le besoin se confirme.
- Communiquez le mot de passe par défaut par un canal séparé de l'URL de
  l'app (pas dans le même e-mail), pour limiter le risque si le message
  est transféré par erreur.

## Configuration

### Base de données

- **En local** : SQLite classique, rien à provisionner. `npx prisma
  migrate dev` crée directement `prisma/dev.db`.
- **En production (Vercel)** : SQLite ne fonctionne pas sur un hébergeur
  serverless — le système de fichiers est éphémère, donc un fichier
  `.db` écrit à l'exécution serait perdu au déploiement suivant (ou même
  entre deux requêtes). L'app utilise donc **Turso**, une base hébergée
  compatible SQLite (libSQL), via un driver adapter Prisma. Voir la
  section Déploiement ci-dessous.

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

## Déploiement sur Vercel (avec Turso)

### 1. Créer la base Turso

```bash
# Installer le CLI Turso (macOS/Linux) :
curl -sSfL https://get.tur.so/install.sh | bash

turso auth login
turso db create salle-reunion

turso db show salle-reunion --url
# → copier cette valeur dans TURSO_DATABASE_URL

turso db tokens create salle-reunion
# → copier ce jeton dans TURSO_AUTH_TOKEN
```

### 2. Appliquer le schéma à Turso

Le CLI `prisma migrate deploy` ne fonctionne pas directement contre
Turso (connexion HTTP, pas compatible avec le moteur de migration
Prisma). Il faut générer le SQL et l'appliquer via le CLI Turso :

```bash
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel prisma/schema.prisma \
  --script > baseline.sql

turso db shell salle-reunion < baseline.sql
```

Puis créez les comptes sur la base Turso (le script utilise
automatiquement Turso si `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` sont
définis dans votre environnement local au moment de l'exécuter) :

```bash
TURSO_DATABASE_URL="libsql://..." TURSO_AUTH_TOKEN="..." npm run prisma:seed
```

**À chaque changement de `schema.prisma`** par la suite, régénérez un
diff (cette fois entre l'ancien et le nouveau schéma, ou entre la base
Turso introspectée et le nouveau schéma) et rejouez-le de la même façon
via `turso db shell`. Ce n'est pas automatique comme `migrate deploy` —
si ça devient pénible à la main, `prisma migrate diff --from-url
"$TURSO_DATABASE_URL" --to-schema-datamodel prisma/schema.prisma
--script` permet de diffuser directement depuis l'état actuel de Turso.

### 3. Déployer sur Vercel

1. Poussez ce dossier sur un dépôt Git (GitHub/GitLab).
2. Importez le projet sur [vercel.com](https://vercel.com).
3. Dans les variables d'environnement du projet Vercel, ajoutez :
   - `SESSION_SECRET`
   - `AAF_WHITELIST`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `DATABASE_URL` — mettez n'importe quelle valeur type
     `file:./dev.db` : elle n'est lue qu'au moment du `prisma generate`
     pendant le build (nécessaire pour que le générateur ait une URL
     valide), la connexion réelle en production passe par
     `TURSO_DATABASE_URL`.
4. Déployez. Si le build échoue sur `prisma generate`, vérifiez que
   `DATABASE_URL` est bien définie (même avec une valeur factice).

Partagez ensuite l'URL déployée par e-mail aux AAF autorisés — seule une
adresse figurant dans la liste blanche pourra se connecter.

## Alternative : VM / Docker avec SQLite classique

Si vous préférez éviter Turso, l'app fonctionne aussi telle quelle sur
une VM ou un conteneur Docker avec un disque persistant : montez un
volume sur `prisma/`, laissez `TURSO_DATABASE_URL` non défini (le
fallback SQLite local s'applique automatiquement), lancez
`npx prisma migrate deploy` puis `npm run build && npm run start`.

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
