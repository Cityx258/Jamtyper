# ADR 0001 : Transport temps réel

- **Statut** : proposé, à confirmer selon l'hébergement choisi
- **Contexte du projet** : cahier des charges, exigences 2.5, 2.10 et 3.15 à 3.17, hypothèse 3 (100 joueurs simultanés, services gratuits)

## Contexte

Une course demande que chaque joueur voie la position des autres en temps réel et que le serveur contrôle l'état de la salle (voir [machine à états](../machine-a-etats.md)). Il faut aussi gérer les déconnexions, les reconnexions, les bots et les minuteries.

Le site est développé avec Next.js. Le déploiement visé par défaut est Vercel, mais Vercel exécute le code en fonctions sans état (*serverless*) qui ne peuvent pas garder une connexion WebSocket ouverte.

## Contraintes

1. Les messages doivent circuler dans les deux sens, avec une latence faible (quelques dizaines de millisecondes).
2. Le serveur doit garder en mémoire l'état des courses en cours et des minuteries.
3. Les outils doivent être gratuits dans la mesure du possible (exigence 8.4).
4. L'authentification doit s'appliquer aux connexions temps réel (cookie de session Better Auth).
5. La charge visée est modeste : jusqu'à 100 joueurs simultanés.

## Options considérées

| Option | Pour | Contre |
|---|---|---|
| **A. Socket.IO sur un serveur Node unique qui sert aussi Next.js** | Salles (*rooms*) intégrées, reconnexion automatique, repli sur *long polling*, un seul déploiement, un seul domaine donc le cookie de session fonctionne tel quel | Demande un hébergeur qui fait tourner un processus Node continu (pas Vercel). Une seule instance, sauf à ajouter un adaptateur Redis. |
| **B. WebSocket natif (`ws`) sur le même serveur Node** | Léger, standard, aucune abstraction | Il faut écrire soi-même les salles, la reconnexion et les battements de cœur. |
| **C. Événements envoyés par le serveur (SSE) plus requêtes HTTP** | Fonctionne sur Vercel, simple | Un seul sens en temps réel. À 10 mises à jour par seconde par joueur, le coût en requêtes est élevé et la latence moins stable. Fonctions *serverless* à durée limitée. |
| **D. Service géré (Ably, Pusher, PartyKit)** | Aucune infrastructure à gérer, compatible avec Vercel | Limites des forfaits gratuits, dépendance externe, l'état de la salle doit quand même vivre quelque part. La logique serveur (bots, minuteries) reste à héberger. |
| **E. WebSocket directement dans des fonctions Vercel** | Aucun serveur de plus | Non pris en charge : les connexions ne persistent pas. |

## Décision

**Option A : Socket.IO sur un serveur Node unique qui sert Next.js.**

Raisons :

- Les salles, la reconnexion et le repli de transport sont déjà résolus, ce qui laisse le temps pour la logique de jeu.
- Le serveur Node garde l'état des courses en mémoire, ce qui convient au modèle décrit dans [modèle de données](../modele-de-donnees.md) (état éphémère en mémoire, résultats écrits en base à la fin).
- Un seul déploiement et un seul domaine évitent les problèmes de cookies entre domaines pour l'authentification.
- 100 joueurs simultanés tiennent sans difficulté sur une seule instance.

## Conséquences

- **L'hébergement doit exécuter un processus Node continu.** Vercel ne convient pas pour la partie temps réel. Pour le point de contrôle 1, une plateforme comme Render, Railway ou Fly.io, ou un petit serveur privé avec HTTPS (Caddy), reste à choisir. Les forfaits gratuits varient et certains mettent le service en veille après une période d'inactivité, ce qui coupe les salles : à vérifier au moment du choix.
- **Le démarrage de l'application change** : `next start` est remplacé par un serveur Node personnalisé qui monte Next.js et Socket.IO. Le développement local continue avec bun.
- **Les connexions sont authentifiées** : le serveur lit le cookie de session au moment de la connexion. Sans session valide, la connexion est acceptée comme invité avec un nom temporaire (exigence 1.4).
- **Pas de mise à l'échelle horizontale pour l'instant.** Si plus d'une instance devenait nécessaire, il faudrait l'adaptateur Redis de Socket.IO et un affinage des sessions collantes. C'est hors du périmètre de l'hypothèse 3.
- **L'état en mémoire est perdu au redémarrage du serveur.** Une course en cours est alors abandonnée. C'est acceptable à ce stade; les salles persistées en base peuvent être rouvertes au lobby.

## Réévaluation

Cette décision est à revoir si l'hébergement retenu ne permet pas de processus continu, ou si la charge dépasse largement 100 joueurs simultanés. Dans ce cas, l'option D (service géré pour la diffusion, avec un petit serveur pour la logique) est la solution de repli.
