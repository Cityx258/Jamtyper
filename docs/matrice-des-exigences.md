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
| 6 | Écrans de fin, statistiques, récompenses | Fait |
| 7 | Bilinguisme, thèmes, responsive, optionnel | Fait, sauf la direction artistique (en cours) |
| 8 | Tests, déploiement, sécurité, documentation | Fait |

## Comment lire les tableaux

**État**

- **Fait** : l'exigence est complètement remplie.
- **Partiel** : une partie seulement est faite; la remarque dit ce qui manque.
- **À faire** : pas commencé.
- **Optionnel** : marqué optionnel dans le cahier des charges et pas commencé.

**Vérifié par**, pour ce qui est fait :

- **Navigateur** : essayé dans Chromium avec plusieurs joueurs, et regardé en captures d'écran.
- **Script** : essayé contre un vrai serveur et la base locale avec un script qui joue plusieurs joueurs (socket.io ou requêtes HTTP).
- **Tests** : couvert par la suite de tests automatisés (`bun test`, lancée à chaque poussée).

Le cahier des charges a deux exigences numérotées 7.2 (thème, puis responsive) et aucune 8.2; la seconde 7.2 est notée **7.2 bis**.

## 1. Comptes utilisateurs

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 1.1 | Compte par nom d'utilisateur et mot de passe | 1 | Fait | Script | Page `/login`, Better Auth avec le plugin *username*. Mot de passe haché en base. |
| 1.2 | Compte via OAuth (Discord, GitHub) | 1 | Fait | | Un bouton n'est actif que si ses clés sont configurées sur le serveur. |
| 1.3 | Décourager le mot de passe au profit d'OAuth | 1 | Fait | Navigateur | OAuth est proposé en premier; l'inscription par mot de passe est derrière un lien. |
| 1.4 | Participer à une course sans compte | 2 | Fait | Navigateur | Un invité choisit un nom et rejoint par code, par lien ou par course rapide. Il ne peut pas être hôte et ses courses ne sont pas enregistrées. |
| 1.5 | Page de statistiques personnelles | 6 | Fait | Navigateur | Page `/profile` : courses, victoires, meilleure et moyenne MPM, précision, carte des touches manquées, courses récentes. |
| 1.6 | Page de paramètres pour ajouter une seconde méthode | 6 | Fait | Navigateur, tests | Page `/settings`, liée depuis le profil. On y lie ou délie Discord et GitHub; un compte Discord ou GitHub peut ajouter un nom d'utilisateur et un mot de passe (et reçoit alors un code de récupération). On ne peut pas retirer sa dernière méthode de connexion. Testé sans vraies clés Discord : le lien envoie bien vers Discord. |
| 1.7 | Récupération de mot de passe (comptes à mot de passe) | 8 | Fait | Navigateur, tests | Code de récupération montré une fois à l'inscription (pas de courriel : voir `docs/securite.md`). Page « Mot de passe oublié? », nouveau code sur le profil. Une réinitialisation ferme toutes les sessions et remplace le code. 5 essais par 15 minutes. |

## 2. Fonctionnement d'une course

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 2.1 | Tout utilisateur connecté peut créer une course | 2 | Fait | Navigateur | Refusé aux invités. |
| 2.2 | Minimum 2 coureurs, pas de maximum | 2 | Fait | Script, tests | Les bots comptent dans le minimum, mais il faut au moins un humain (voir la machine à états). |
| 2.3 | L'hôte peut courir ou seulement observer | 3 | Fait | Navigateur | Bouton « Regarder plutôt » dans le lobby, sans approbation pour l'hôte. |
| 2.4 | Demande pour devenir spectateur, avec approbation | 3 | Fait | Script | L'hôte accepte ou refuse. Revenir comme coureur est libre. |
| 2.5 | Positions en temps réel | 2 | Fait | Navigateur | socket.io, voir l'ADR 0001. |
| 2.6 | Compte à rebours avant le départ | 2 | Fait | Navigateur | 5 secondes, annulable par l'hôte. |
| 2.7 | Paramètres visibles de tous pendant la configuration | 2 | Fait | Navigateur | En lecture seule pour les joueurs, mis à jour en direct. Un texte personnalisé reste caché jusqu'au départ. |
| 2.8 | Copier-coller désactivé | 2 | Fait | Navigateur, tests | Coller, déposer, copier et couper sont bloqués. Le serveur refuse aussi une progression trop rapide pour un humain. |
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
| 3.3 | Langue du texte, y compris langages de programmation | 4 | Fait | Script | Anglais, français, JavaScript, Python, Java et C# (les trois premiers langages de programmation sont ceux de l'hypothèse 5). Le code tient sur une ligne, comme la zone de frappe. |
| 3.4 | Thème du texte | 4 | Fait | Script | Tout, musique, nature, science, pour les mots et les citations. |
| 3.5 | Niveau de difficulté | 4 | Fait | Script | Facile, moyen, difficile (chiffres, symboles, majuscules). Pour les mots aléatoires seulement. |
| 3.6 | Longueur de la course | 4 | Fait | Script | 10 à 200 mots. |
| 3.7 | Liste noire de caractères | 4 | Fait | Script | Si plus aucun texte n'est possible, l'hôte est averti et le départ est refusé. |
| 3.8 | Priorité de caractères | 4 | Fait | Script | Tirage pondéré : un mot vaut 1 + 3 par caractère prioritaire qu'il contient. |
| 3.9 | Limite de temps | 4 | Fait | Script | 30 s, 1, 2, 3, 5 ou 10 minutes. |
| 3.10 | Texte généré par algorithme, différent à chaque course | 4 | Fait | Script, tests | Tirage aléatoire cryptographique à chaque départ. |
| 3.11 | Continuer ou non après une erreur, sans pénalité disproportionnée | 4 | Fait | Navigateur, tests | « À corriger » ou « On continue ». En mode continu, une faute ne compte pas dans la vitesse (MPM net) : elle coûte un caractère, pas plus. |
| 3.12 | Mode mort instantanée | 7 | Fait | Navigateur | La première faute élimine le joueur (bots compris). Un bandeau rappelle le mode pendant la course. |
| 3.13 | Objectif de temps | 7 | Fait | Navigateur | 30 s à 2 min. Affiché pendant la course; les résultats montrent le temps de chacun et qui a battu l'objectif. |
| 3.14 | Équipes | 7 | Fait | Navigateur | Deux équipes (Sol et Fa), réparties automatiquement, modifiables par l'hôte. Les bots équilibrent les équipes. L'équipe avec la meilleure moyenne MPM gagne. |
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
| 6.3 | Écran de podium | 6 | Fait | Navigateur, tests | Les trois premiers sur des marches (1re au centre, plus haute), avec leur note et leur MPM, au-dessus du tableau des résultats. Seuls les coureurs qui ont terminé ou atteint la limite de temps peuvent monter sur le podium. |
| 6.4 | Écran de statistiques | 6 | Fait | Navigateur, tests | MPM, précision et temps de chaque coureur, plus un graphique de la vitesse de chacun pendant la course (10 points par seconde, à partir de la 1re seconde). Ta ligne est en couleur, les autres en gris; un survol montre le temps et la vitesse de chacun. Les points ne sont envoyés qu'à la fin de la course et ne sont pas gardés en base. |
| 6.5 | Carte de chaleur des touches manquées | 6 | Fait | Navigateur | À la fin de chaque course et cumulée sur le profil. |
| 6.6 | Relancer avec les mêmes participants ou fermer la salle | 6 | Fait | Script | Boutons « Relancer » et « Fermer la salle » pour l'hôte. |
| 6.7 | Récompenses et objets déblocables | 6 | Fait | Navigateur, tests | Chaque joueur est une note de musique, affichée à côté de son nom (lobby, course, résultats). Ronde au départ, puis une nouvelle note toutes les 5 victoires : blanche, noire, croche, double croche, triple croche (25 victoires). L'écran de résultats annonce un déblocage; le profil permet de choisir parmi les notes débloquées. Les invités sont des rondes; les bots ont une note selon leur niveau. Le profil montre aussi la vitesse dans le temps : un point par course terminée (les 200 dernières) et une ligne qui suit la moyenne de chaque jour (selon le fuseau du joueur), avec un survol qui donne la course et la moyenne du jour. |

## 7. Langues, apparence et accessibilité

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 7.1 | Site en français et en anglais | 7 | Fait | Navigateur | Bouton EN/FR dans l'en-tête, choix gardé dans un témoin. Tous les textes passent par `src/i18n`, y compris la page 404 et les titres d'onglet. |
| 7.2 | Thème clair et thème sombre | 7 | Fait | Navigateur | Bouton dans l'en-tête, choix gardé dans un témoin. |
| 7.2 bis | Site responsive | 7 | Fait | Navigateur | Chaque page (accueil, connexion, entraînement, profil, lobby, course, résultats) vérifiée à 360, 768 et 1280 pixels, en français et en anglais, sans défilement horizontal. |
| 7.3 | Design unique, sans apparence générée par IA | 7 | Partiel | Navigateur, tests | Direction artistique musicale, en cours. Pendant une course, chaque coureur a sa propre portée (clé de sol, mesures, double barre de fin) et sa note avatar avance dessus, posée sur une hauteur au hasard. Les notes plus courtes qu'un temps remplissent un temps entier : une croche joue 2 hauteurs, une double croche 4, une triple croche 8, toutes au hasard. Les hauteurs viennent toujours de la gamme pentatonique de do majeur, donc la mélodie reste dans la tonalité. La note d'un coureur joue quand il termine; à la fin, toutes les notes jouent dans l'ordre d'arrivée et s'affichent sur une portée (qui passe à la ligne sur téléphone), avec un bouton pour la rejouer. Chaque course fait donc une nouvelle mélodie. |
| 7.4 | Nom et logo créés par le développeur | 7 | Fait | | Nom : JamTyper. Logo dessiné à la main (`images/logo.jpg`), vectorisé en `app/public/logo.svg`. |
| 7.5 | Effets sonores (optionnel, liste de priorités) | 7 | Fait | Navigateur | Coupés par défaut, bouton dans l'en-tête. Compte à rebours, départ, faute, arrivée, élimination. Sons générés par le navigateur, sans fichier audio. |

## 8. Technique, sécurité et exploitation

| N° | Exigence | Priorité | État | Vérifié par | Remarque |
|---|---|---|---|---|---|
| 8.1 | React, Next.js, Tailwind CSS, PostgreSQL | 1 | Fait | | Next.js 16, React 19, Tailwind 4, PostgreSQL 17, Drizzle. |
| 8.3 | Accès en HTTPS seulement | 1 | Fait | Script | Render sert le site en HTTPS. Le serveur redirige aussi toute requête HTTP vers HTTPS et envoie `Strict-Transport-Security`. |
| 8.4 | Outils gratuits dans la mesure du possible | 1 | Fait | | Render (offre gratuite), GitHub, et des bibliothèques libres. |
| 8.5 | Tests automatisés; chaque poussée sur la branche principale lance les tests et déploie | 8 | Fait | | 57 tests unitaires (`app/tests`) : paramètres, textes, bots, boosts, équipes, codes, règles de course. GitHub Actions lance lint, types, tests et construction à chaque poussée; Render ne déploie que si tout passe (`autoDeployTrigger: checksPass`). |
| 8.6 | Sécurité (authentification, sessions, données) | 8 | Fait | Script | Revue faite, détail dans `docs/securite.md` : HTTPS forcé, en-têtes de sécurité, limites de taille et de débit sur socket.io, secrets hachés, dépendances auditées (Next.js mis à jour pour des failles critiques). |
| 8.7 | Structure maintenable et évolutive | 8 | Fait | | Code séparé en `db`, `lib`, `i18n`, `components` et `server`. `README.md` explique l'installation, les scripts, les tests et le déploiement. Documentation dans `docs/`. |
