# JamTyper

Course de dactylographie en temps réel pour les élèves du secondaire (12 à 17 ans). On rejoint une salle avec un code, on tape le même texte que les autres en même temps, et on voit tout le monde avancer.

Projet du cours Web5 (420-5U3-SO), Cégep de Sorel-Tracy.

## Technologies

- **Next.js 16** et **React 19** pour les pages, **Tailwind CSS 4** pour le style
- **socket.io** pour les courses en temps réel, sur un serveur Node personnalisé (`app/server`)
- **PostgreSQL 17** avec **Drizzle** pour la base de données
- **Better Auth** pour les comptes (nom d'utilisateur et mot de passe, Discord, GitHub)
- **Bun** pour installer, lancer les scripts et les tests

## Structure

```
app/
  server/          serveur temps réel : salles, courses, bots, boosts
  src/app/         pages Next.js (accueil, connexion, salle, profil, entraînement)
  src/components/  composants React
  src/lib/         logique partagée : paramètres, génération de texte, équipes, protocole
  src/db/          schéma Drizzle et migration
  src/i18n/        textes en anglais et en français
  drizzle/         migrations SQL
  tests/           tests unitaires
docs/              matrice des exigences, machine à états, modèle de données, sécurité, ADR
notes/             cahier des charges
```

## Lancer le projet en local

Il faut [Bun](https://bun.sh) et Docker.

```sh
cd app
cp .env.example .env          # puis mettre un vrai BETTER_AUTH_SECRET (openssl rand -base64 32)
docker compose up -d          # PostgreSQL sur le port 5432
bun install
bun run db:migrate            # crée les tables
bun run dev                   # http://localhost:3000
```

Discord et GitHub sont optionnels : sans leurs clés dans `.env`, leurs boutons restent désactivés.

## Scripts

| Commande | Rôle |
|---|---|
| `bun run dev` | Serveur de développement |
| `bun run build` | Construit le site et le serveur temps réel |
| `bun run start` | Lance la version construite |
| `bun test` | Tests unitaires |
| `bun run lint` | ESLint |
| `bun run typecheck` | Vérification des types TypeScript |
| `bun run db:generate` | Génère une migration après un changement de schéma |
| `bun run db:migrate` | Applique les migrations |

## Tests et déploiement

Les tests (`app/tests`) couvrent les paramètres de course, la génération de texte, les bots, les boosts, les équipes, les codes de salle et de récupération, et les règles d'une course (départ, anti-triche, fin, mort instantanée). La base de données est simulée, donc ils n'ont pas besoin de PostgreSQL.

À chaque poussée sur `master`, GitHub Actions (`.github/workflows/ci.yml`) lance le lint, la vérification des types, les tests et la construction. Render (`render.yaml`) ne déploie que si ces vérifications passent. Au démarrage, le conteneur applique les migrations avant de lancer le serveur.

## Documentation

- [Matrice des exigences](docs/matrice-des-exigences.md) : chaque exigence, sa priorité et son état
- [Machine à états](docs/machine-a-etats.md) : salles, courses, joueurs, bots, équipes
- [Modèle de données](docs/modele-de-donnees.md)
- [Sécurité](docs/securite.md)
- [ADR 0001 : transport temps réel](docs/adr/0001-temps-reel.md)
