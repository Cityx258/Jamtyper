# Matrice des exigences

Chaque exigence du cahier des charges, sa priorité et où elle en est. Les numéros sont ceux du cahier des charges.

## Où en est le projet

| Priorité | Contenu | État |
|---|---|---|
| 1 | HTTPS, authentification, début de la direction artistique | Fait, sauf la direction artistique (en cours) |
| 2 | Course de base à 2 joueurs | Fait |
| 3 | Gestion des salles | Fait |
| 4 | Options avancées de course | Fait |
| 5 | Bots et boosts | Fait |
| 6 | Écrans de fin, statistiques, récompenses | Partiel : il manque le podium, les graphiques, les récompenses et la page de paramètres |
| 7 | Bilinguisme, thèmes, responsive, optionnel | Partiel : bilinguisme et thèmes faits |
| 8 | Tests, déploiement, sécurité, documentation | À faire |

## Comment lire les tableaux

**État**

- **Fait** : l'exigence est complètement remplie.
- **Partiel** : une partie seulement est faite; la remarque dit ce qui manque.
- **À faire** : pas commencé.
- **Optionnel** : marqué optionnel dans le cahier des charges et pas commencé.

**Vérifié par**, pour ce qui est fait :

- **Navigateur** : essayé dans Chromium avec plusieurs joueurs, et regardé en captures d'écran.
- **Script** : essayé contre un vrai serveur et la base locale avec un script qui joue plusieurs joueurs (socket.io ou requêtes HTTP).
- **Tests** : couvert par la suite de tests automatisés.

Le cahier des charges a deux exigences numérotées 7.2 (thème, puis responsive) et aucune 8.2; la seconde 7.2 est notée **7.2 bis**.

## 1. Comptes utilisateurs

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 1.1 | Compte par nom d'utilisateur et mot de passe | 1 | Fait | Script | Page `/login`, Better Auth avec le plugin *username*. Mot de passe haché en base. |
| 1.2 | Compte via OAuth (Discord, GitHub) | 1 | Fait | | Un bouton n'est actif que si ses clés sont configurées sur le serveur. |
| 1.3 | Décourager le mot de passe au profit d'OAuth | 1 | Fait | Navigateur | OAuth est proposé en premier; l'inscription par mot de passe est derrière un lien. |
| 1.4 | Participer à une course sans compte | 2 | Fait | Navigateur | Un invité choisit un nom et rejoint par code, par lien ou par course rapide. Il ne peut pas être hôte et ses courses ne sont pas enregistrées. |
| 1.5 | Page de statistiques personnelles | 6 | Fait | Navigateur | Page `/profile` : courses, victoires, meilleure et moyenne MPM, précision, carte des touches manquées, courses récentes. |
| 1.6 | Page de paramètres pour ajouter une seconde méthode | 6 | À faire | | Le schéma `account` permet déjà plusieurs méthodes par compte. |
| 1.7 | Récupération de mot de passe (comptes à mot de passe) | 8 | À faire | | |

## 2. Fonctionnement d'une course

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 2.1 | Tout utilisateur connecté peut créer une course | 2 | Fait | Navigateur | Refusé aux invités. |
| 2.2 | Minimum 2 coureurs, pas de maximum | 2 | Fait | Script | Les bots comptent dans le minimum, mais il faut au moins un humain (voir la machine à états). |
| 2.3 | L'hôte peut courir ou seulement observer | 3 | Fait | Navigateur | Bouton « Regarder plutôt » dans le lobby, sans approbation pour l'hôte. |
| 2.4 | Demande pour devenir spectateur, avec approbation | 3 | Fait | Script | L'hôte accepte ou refuse. Revenir comme coureur est libre. |
| 2.5 | Positions en temps réel | 2 | Fait | Navigateur | socket.io, voir l'ADR 0001. |
| 2.6 | Compte à rebours avant le départ | 2 | Fait | Navigateur | 5 secondes, annulable par l'hôte. |
| 2.7 | Paramètres visibles de tous pendant la configuration | 2 | Fait | Navigateur | En lecture seule pour les joueurs, mis à jour en direct. Un texte personnalisé reste caché jusqu'au départ. |
| 2.8 | Copier-coller désactivé | 2 | Fait | Navigateur | Coller, déposer, copier et couper sont bloqués. Le serveur refuse aussi une progression trop rapide pour un humain. |
| 2.9 | Statistiques en temps réel par coureur | 2 | Fait | Navigateur | MPM et progression de chaque coureur pendant la course. |
| 2.10 | Reconnexion pendant une course | 3 | Fait | Script | Un coureur déconnecté reste en course jusqu'à la fin et reprend où il était. Les autres le voient « reconnexion ». |
| 2.11 | Abandon d'une course | 3 | Fait | Script | Bouton « Abandonner »; le joueur est classé après les arrivants. |
| 2.12 | Expulsion d'un coureur par l'hôte | 3 | Fait | Script | Dans le lobby et pendant la course, avec confirmation. Le joueur ne peut plus revenir dans la salle. |
| 2.13 | Arrivée tardive : spectateur | 3 | Fait | Script | Redevient coureur au retour dans le lobby. |
| 2.14 | Mode d'entraînement individuel | 2 | Fait | Navigateur | Page `/practice`, sans salle ni enregistrement. |

## 3. Configuration de course (hôte)

Tous ces réglages sont dans le panneau « Paramètres de la course » du lobby. Le serveur les valide (`src/lib/race-settings.ts`) et génère le texte (`src/lib/texts.ts`).

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 3.1 | Source du texte (citation, mots aléatoires, personnalisé) | 4 | Fait | Script | Citations du domaine public avec leur auteur. Texte personnalisé limité à 1000 caractères et nettoyé (œ devient oe, guillemets et tirets simplifiés). |
| 3.2 | Critères des mots aléatoires (accents, ponctuation) | 4 | Fait | Script | Accents (français seulement) et ponctuation (majuscules, virgules, fins de phrase). |
| 3.3 | Langue du texte, y compris langages de programmation | 4 | Fait | Script | Anglais, français, JavaScript, Python. Le code tient sur une ligne, comme la zone de frappe. |
| 3.4 | Thème du texte | 4 | Fait | Script | Tout, musique, nature, science, pour les mots et les citations. |
| 3.5 | Niveau de difficulté | 4 | Fait | Script | Facile, moyen, difficile (chiffres, symboles, majuscules). Pour les mots aléatoires seulement. |
| 3.6 | Longueur de la course | 4 | Fait | Script | 10 à 200 mots. |
| 3.7 | Liste noire de caractères | 4 | Fait | Script | Si plus aucun texte n'est possible, l'hôte est averti et le départ est refusé. |
| 3.8 | Priorité de caractères | 4 | Fait | Script | Tirage pondéré : un mot vaut 1 + 3 par caractère prioritaire qu'il contient. |
| 3.9 | Limite de temps | 4 | Fait | Script | 30 s, 1, 2, 3, 5 ou 10 minutes. |
| 3.10 | Texte généré par algorithme, différent à chaque course | 4 | Fait | Script | Tirage aléatoire cryptographique à chaque départ. |
| 3.11 | Continuer ou non après une erreur, sans pénalité disproportionnée | 4 | Fait | Navigateur | « À corriger » ou « On continue ». En mode continu, une faute ne compte pas dans la vitesse (MPM net) : elle coûte un caractère, pas plus. |
| 3.12 | Mode mort instantanée | 7 | Optionnel | | |
| 3.13 | Objectif de temps | 7 | Optionnel | | |
| 3.14 | Équipes | 7 | Optionnel | | |
| 3.15 | Bots ajoutés automatiquement si pas assez de joueurs | 5 | Fait | Script | Option « Bots », activée par défaut. Étiquette « bot », pas d'expulsion, exclus des statistiques du joueur. |
| 3.16 | Difficulté des bots configurable | 5 | Fait | Script | Facile, moyen, expert, impossible (environ 25, 45, 75 et 140 MPM), avec des fautes. |
| 3.17 | Vitesse des bots variable dans le temps | 5 | Fait | Script | Départ lent, rythme qui change, accélérations brèves, pauses après les espaces et la ponctuation. |

## 4. Boosts

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 4.1 | Au moins deux mécanismes de boost | 5 | Fait | Navigateur | Option « Boosts », activée par défaut. **Raccourci** : le dernier coureur, à 15 % ou plus du meneur, saute 2 mots (au plus aux 10 s). **Brouillard** : un meneur humain à 15 % ou plus devant tous les autres voit le texte flou après son mot en cours pendant 3 s (au plus aux 12 s). Les deux restent légers pour ne pas devenir injustes. |

## 5. Rejoindre une course

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 5.1 | Course publique | 3 | Fait | Script | L'hôte choisit Publique, Avec le code ou Sur invitation. |
| 5.2 | Course semi-publique par code de salle | 3 | Fait | Navigateur | Code de 6 caractères, rejoint par code ou par lien. |
| 5.3 | Course privée par lien à usage unique | 3 | Fait | Script | Jeton haché en base, valable 24 h, utilisable une seule fois même en cas de clics simultanés. |
| 5.4 | Démarrer une course depuis l'accueil | 3 | Fait | Script | « Lancer une course » rejoint la salle publique la plus remplie, sinon en crée une. |

## 6. Fin de course

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 6.1 | Fin quand tous ont terminé ou limite de temps | 2 | Fait | Script | Ordre des conditions défini dans la machine à états. |
| 6.2 | Minuterie de clôture après le premier arrivé | 2 | Fait | Script | |
| 6.3 | Écran de podium | 6 | À faire | | L'écran de résultats donne déjà le classement en tableau. |
| 6.4 | Écran de statistiques | 6 | Partiel | Navigateur | MPM et précision de chaque coureur. Pas encore de graphique de la course. |
| 6.5 | Carte de chaleur des touches manquées | 6 | Fait | Navigateur | À la fin de chaque course et cumulée sur le profil. |
| 6.6 | Relancer avec les mêmes participants ou fermer la salle | 6 | Fait | Script | Boutons « Relancer » et « Fermer la salle » pour l'hôte. |
| 6.7 | Récompenses et objets déblocables | 6 | À faire | | |

## 7. Langues, apparence et accessibilité

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 7.1 | Site en français et en anglais | 7 | Fait | Navigateur | Bouton EN/FR dans l'en-tête, choix gardé dans un témoin. |
| 7.2 | Thème clair et thème sombre | 7 | Fait | Navigateur | Bouton dans l'en-tête, choix gardé dans un témoin. |
| 7.2 bis | Site responsive | 7 | Partiel | | Pensé pour téléphone, tablette et ordinateur, mais pas encore vérifié à ces tailles. |
| 7.3 | Design unique, sans apparence générée par IA | 7 | Partiel | | Direction artistique en cours. |
| 7.4 | Nom et logo créés par le développeur | 7 | Fait | | Nom : JamTyper. Logo dessiné à la main (`images/logo.jpg`), vectorisé en `app/public/logo.svg`. |

## 8. Technique, sécurité et exploitation

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 8.1 | React, Next.js, Tailwind CSS, PostgreSQL | 1 | Fait | | Next.js 16, React 19, Tailwind 4, PostgreSQL 17, Drizzle. |
| 8.3 | Accès en HTTPS seulement | 1 | Partiel | | Hébergé sur Render (`render.yaml`), qui sert le site en HTTPS. Le serveur n'impose pas encore HTTPS lui-même. |
| 8.4 | Outils gratuits dans la mesure du possible | 1 | Fait | | Render (offre gratuite), GitHub, et des bibliothèques libres. |
| 8.5 | Tests automatisés; chaque poussée sur la branche principale lance les tests et déploie | 8 | À faire | | |
| 8.6 | Sécurité (authentification, sessions, données) | 8 | Partiel | | Better Auth gère le hachage et les sessions. Pas encore de revue de sécurité. |
| 8.7 | Structure maintenable et évolutive | 8 | Partiel | | Code séparé en `db`, `lib`, `i18n`, `components` et `server`. Documentation dans `docs/`. |
