# AT Calendar

Calendrier partagé personnel pour Aurélie et Terry. Un seul calendrier commun, deux comptes,
notifications push, import/export `.ics`.

## Stack

- **Next.js** (App Router, TypeScript, Tailwind) — frontend + API routes
- **PostgreSQL** + **Prisma** — base de données
- **Auth.js** (Credentials + sessions en base) — 2 comptes, pas d'inscription publique
- **react-big-calendar** + **rrule.js** — vues calendrier et récurrence (RFC 5545)
- **next-intl** (FR/EN) + **next-themes** (clair/sombre)
- **Web Push (VAPID)** — notifications navigateur/PWA (pas d'email pour l'instant)
- **Docker Compose** : app + PostgreSQL + Caddy (HTTPS auto) + Watchtower (auto-update) + backup cron
- **GitHub Actions** → images publiées sur `ghcr.io`

## Développement local

```bash
npm install
docker run -d --name atcalendrier-db -e POSTGRES_USER=atcalendrier -e POSTGRES_PASSWORD=changeme -e POSTGRES_DB=atcalendrier -p 5432:5432 postgres:16-alpine

cp .env.example .env   # déjà fait, ajuste si besoin
npx prisma migrate dev --name init
npm run db:seed        # crée les 2 comptes (voir variables SEED_* ci-dessous)
npm run dev
```

Comptes de dev par défaut : `aurelie@atcalendrier.fr` / `terry@atcalendrier.fr`, mot de passe `changeme`
(personnalisables via `SEED_AURELIE_EMAIL`, `SEED_AURELIE_PASSWORD`, `SEED_TERRY_EMAIL`,
`SEED_TERRY_PASSWORD`).

Pour les notifications push en dev, génère des clés VAPID :

```bash
npx web-push generate-vapid-keys
```

et renseigne `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `NEXT_PUBLIC_VAPID_PUBLIC_KEY` dans `.env`.

## Déploiement (VPS + Docker Compose)

1. Crée le repo sur GitHub, pousse le code : la CI (`.github/workflows/docker-publish.yml`)
   construit et publie automatiquement `ghcr.io/<owner>/atcalendrier` (+ variante `-migrate`)
   à chaque push sur `main` ou tag `vX.Y.Z`.
2. Sur le VPS : installe Docker (ou Podman + `podman-compose`), copie `docker-compose.yml`,
   `Caddyfile`, `backup/` et un fichier `.env` basé sur `.env.production.example`.
3. Authentifie le VPS auprès de `ghcr.io` si le paquet est privé :
   `docker login ghcr.io -u <user> -p <PAT avec scope read:packages>`.
4. `docker compose up -d` — Watchtower surveille `ghcr.io` toutes les 5 minutes et redéploie
   automatiquement les nouvelles images (label `com.centurylinklabs.watchtower.enable=true`
   sur le service `app`).
5. Pointe le DNS de `atcalendrier.fr` vers le VPS ; Caddy obtient et renouvelle le certificat
   HTTPS automatiquement (`DOMAIN=atcalendrier.fr` dans `.env`).

Les sauvegardes PostgreSQL (`pg_dump` compressé) sont écrites dans `./backups` toutes les 24h
(configurable via `BACKUP_INTERVAL_SECONDS` / `BACKUP_RETENTION_DAYS`).

## Roadmap

- [ ] Auto-hébergement futur (le même `docker-compose.yml` doit fonctionner tel quel avec Podman)
- [ ] Rappels par email (SMTP) — prévu, pas implémenté
- [ ] Vue "Jour"
