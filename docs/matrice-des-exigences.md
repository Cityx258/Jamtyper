# Matrice des exigences

État au point de contrôle 1. Chaque exigence du cahier des charges est reliée à sa priorité et à son état d'avancement.

## Légende

| État | Signification |
|---|---|
| **Vérifié (navigateur)** | Essayé dans un vrai navigateur (Chromium sans interface) avec plusieurs sessions, et regardé en captures d'écran. |
| **Vérifié (requêtes)** | Testé contre le serveur et la base locale avec des requêtes HTTP. Pas encore regardé visuellement dans un navigateur. |
| **Codé** | Le code existe et compile (typage et lint sans erreur). Pas encore vérifié à la main de bout en bout. |
| **Partiel** | Une partie seulement est faite, détail en remarque. |
| **À faire** | Pas commencé. |
| **Optionnel** | Marqué optionnel dans le cahier des charges, pas commencé. |

Aucun test automatisé n'existe encore, et le site n'a pas encore été regardé visuellement dans un navigateur : les vérifications faites jusqu'ici sont des requêtes HTTP contre le serveur de développement et la base locale.

Les numéros reprennent ceux du cahier des charges. Celui-ci contient deux exigences numérotées 7.2 (thème, puis responsive) et aucune 8.2; la seconde 7.2 est notée **7.2 bis** ici.

## Comptes utilisateurs (priorité 1 sauf indication)

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 1.1 | Compte par nom d'utilisateur et mot de passe | 1 | Vérifié (requêtes) | Page `/login`, Better Auth avec le plugin *username*. Inscription, connexion, mauvais mot de passe, nom déjà pris et mot de passe haché en base ont été essayés. |
| 1.2 | Compte via OAuth (Discord, GitHub) | 1 | Partiel | Boutons présents mais désactivés (« Bientôt »). |
| 1.3 | Décourager le mot de passe au profit d'OAuth | 1 | Codé | OAuth en premier; le formulaire d'inscription par mot de passe est derrière un lien. |
| 1.4 | Participer à une course sans compte | 2 | Partiel | Un invité peut rejoindre une salle par code en choisissant un nom (vérifié dans le navigateur). Les courses elles-mêmes n'existent pas encore. |
| 1.5 | Page de statistiques personnelles | 6 | À faire | |
| 1.6 | Page de paramètres pour ajouter une seconde méthode | 6 | À faire | Le schéma `account` le permet déjà. |
| 1.7 | Récupération de mot de passe (comptes à mot de passe) | 8 | À faire | |

## Fonctionnement général d'une course

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 2.1 | Tout utilisateur connecté peut créer une course | 2 | Partiel | La création de salle fonctionne (vérifiée dans le navigateur) et est refusée aux invités. La course elle-même reste à faire. |
| 2.2 | Minimum 2 coureurs, pas de maximum | 2 | À faire | Règle décrite dans la machine à états. |
| 2.3 | L'hôte peut courir ou seulement observer | 3 | À faire | |
| 2.4 | Demande pour devenir spectateur, avec approbation | 3 | À faire | |
| 2.5 | Positions en temps réel | 2 | À faire | ADR 0001. |
| 2.6 | Compte à rebours avant le départ | 2 | À faire | |
| 2.7 | Paramètres visibles de tous pendant la configuration | 2 | À faire | |
| 2.8 | Copier-coller désactivé | 2 | À faire | |
| 2.9 | Statistiques en temps réel par coureur | 2 | À faire | |
| 2.10 | Reconnexion pendant une course | 3 | Partiel | Délai de grâce de 30 s dans la salle d'attente : un rafraîchissement ou une coupure reprend la même place (vérifié). Pas encore pendant une course. |
| 2.11 | Abandon d'une course | 3 | À faire | |
| 2.12 | Expulsion d'un coureur par l'hôte | 3 | À faire | |
| 2.13 | Arrivée tardive : spectateur | 3 | À faire | |
| 2.14 | Mode d'entraînement individuel | 2 | Partiel | Bouton « S'entraîner seul » sur l'accueil, sans action. |

## Configuration de course (hôte)

| N° | Exigence | Priorité | État |
|---|---|---|---|
| 3.1 | Source du texte (citation, mots aléatoires, personnalisé) | 4 | À faire |
| 3.2 | Critères des mots aléatoires (accents, ponctuation) | 4 | À faire |
| 3.3 | Langue du texte, y compris langages de programmation | 4 | À faire |
| 3.4 | Thème du texte | 4 | À faire |
| 3.5 | Niveau de difficulté | 4 | À faire |
| 3.6 | Longueur de la course | 4 | À faire |
| 3.7 | Liste noire de caractères | 4 | À faire |
| 3.8 | Priorité de caractères | 4 | À faire |
| 3.9 | Limite de temps | 4 | À faire |
| 3.10 | Texte généré par algorithme, différent à chaque course | 4 | À faire |
| 3.11 | Continuer ou non après une erreur, sans pénalité disproportionnée | 4 | À faire |
| 3.12 | Mode mort instantanée | 7 | Optionnel |
| 3.13 | Objectif de temps | 7 | Optionnel |
| 3.14 | Équipes | 7 | Optionnel |

## Bots

| N° | Exigence | Priorité | État |
|---|---|---|---|
| 3.15 | Bots ajoutés automatiquement si pas assez de joueurs | 5 | À faire |
| 3.16 | Difficulté des bots configurable | 5 | À faire |
| 3.17 | Vitesse des bots variable dans le temps | 5 | À faire |

## Boosts

| N° | Exigence | Priorité | État |
|---|---|---|---|
| 4.1 | Au moins deux mécanismes de boost | 5 | À faire |

## Rejoindre une course

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 5.1 | Course publique | 3 | À faire | |
| 5.2 | Course semi-publique par code de salle | 3 | Vérifié (navigateur) | Salle créée avec un code de 6 caractères, rejointe par code ou par lien, liste des joueurs mise à jour en direct chez tous. Tables `room` et `room_member` en base. |
| 5.3 | Course privée par lien à usage unique | 3 | À faire | Table `invite_link` prévue. |
| 5.4 | Démarrer une course depuis l'accueil | 3 | Partiel | Le bouton « Lancer une course » crée une salle (connexion requise). Pas encore de course publique ni de mise en relation automatique. |

## Fin de course

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 6.1 | Fin quand tous ont terminé ou limite de temps | 2 | À faire | Priorité des conditions définie dans la machine à états. |
| 6.2 | Minuterie de clôture après le premier arrivé | 2 | À faire | |
| 6.3 | Écran de podium | 6 | À faire | |
| 6.4 | Écran de statistiques | 6 | À faire | |
| 6.5 | Carte de chaleur des touches manquées | 6 | À faire | |
| 6.6 | Relancer avec les mêmes participants ou fermer la salle | 6 | À faire | |
| 6.7 | Récompenses et objets déblocables | 6 | À faire | |

## Multilinguisme, apparence et accessibilité

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 7.1 | Site en français et en anglais | 7 | Vérifié (requêtes) | Bouton EN/FR dans l'en-tête, choix gardé dans un témoin. Couvre l'accueil et la connexion. |
| 7.2 | Thème clair et thème sombre | 7 | Vérifié (requêtes) | Bouton dans l'en-tête, choix gardé dans un témoin. |
| 7.2 bis | Site responsive | 7 | Partiel | Mises en page pensées pour téléphone, tablette et ordinateur; pas encore vérifiées sur de vrais écrans. |
| 7.3 | Design unique, sans apparence générée par IA | 7 | Partiel | Direction artistique en cours (voir document de design). |
| 7.4 | Nom et logo créés par le développeur | 7 | Codé | Nom : JamTyper. Logo dessiné à la main par le développeur (`images/logo.jpg`), vectorisé en `app/public/logo.svg` et affiché dans l'en-tête. |

## Technique, sécurité et exploitation

| N° | Exigence | Priorité | État | Remarque |
|---|---|---|---|---|
| 8.1 | React, Next.js, Tailwind CSS, PostgreSQL | 1 | Codé | Next.js 16, React 19, Tailwind 4, PostgreSQL 17 (Docker en local), Drizzle. |
| 8.3 | Accès en HTTPS seulement | 1 | À faire | Dépend de l'hébergement, pas encore choisi. |
| 8.4 | Outils gratuits dans la mesure du possible | 1 | Codé | Tout l'outillage actuel est gratuit. L'hébergement reste à choisir. |
| 8.5 | Tests unitaires, intégration et déploiement continus | 8 | À faire | |
| 8.6 | Sécurité (authentification, sessions, données) | 8 | Partiel | Better Auth gère le hachage et les sessions. Pas encore de revue de sécurité. |
| 8.7 | Structure maintenable et évolutive | 8 | Partiel | Séparation `db`, `lib`, `i18n`, `components`. Documentation d'architecture dans `docs/`. |

## Résumé par priorité

| Priorité | Contenu | État |
|---|---|---|
| 1 | HTTPS, authentification, début de la direction artistique | Authentification vérifiée (requêtes), direction artistique en cours, HTTPS à faire |
| 2 | Course de base à 2 joueurs | À faire |
| 3 | Gestion des salles | Partiel : création, code, rejoindre, reconnexion en salle d'attente (vérifiés). Reste : salles publiques et privées, spectateurs, expulsion. |
| 4 | Options avancées de course | À faire |
| 5 | Bots et boosts | À faire |
| 6 | Écrans de fin, statistiques, récompenses | À faire |
| 7 | Bilinguisme, thèmes, responsive, optionnel | Bilinguisme et thèmes vérifiés (requêtes) |
| 8 | Tests, déploiement, sécurité, documentation | À faire |
