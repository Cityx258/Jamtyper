# Sécurité

Ce que le site fait pour protéger les comptes, les sessions et les données (exigences 8.3 et 8.6), et ce qui reste connu.

## Transport

- Le site est servi en HTTPS par Render. En production, le serveur renvoie toute requête arrivée en HTTP vers la même adresse en HTTPS (redirection 301).
- L'en-tête `Strict-Transport-Security` (un an) dit au navigateur de ne plus jamais essayer HTTP.
- Les témoins de session sont marqués `Secure` en production (Better Auth le fait quand l'adresse du site est en HTTPS).

## Comptes et sessions

- Better Auth hache les mots de passe et gère les sessions. Le code du site ne voit jamais un mot de passe en clair hors du formulaire.
- Better Auth limite le nombre de requêtes d'authentification en production (connexion, inscription).
- **Récupération de mot de passe** : un code de 16 caractères (environ 80 bits d'aléa) est montré une seule fois à l'inscription. Seul son hachage SHA-256 est stocké, et la comparaison se fait en temps constant. Un code utilisé est remplacé tout de suite. Une réinitialisation ferme toutes les sessions du compte. Les essais sont limités à 5 par 15 minutes, par nom d'utilisateur et par adresse IP.
- **Méthodes de connexion** : un joueur peut lier Discord ou GitHub à son compte depuis `/settings`. Comme les comptes avec mot de passe ont une adresse fictive, le courriel du fournisseur n'a pas à correspondre. Un compte Discord ou GitHub déjà lié à un autre joueur est refusé. Délier demande une session de moins d'un jour, et Better Auth refuse de retirer la dernière méthode.
- Pas de courriel : les joueurs ont de 12 à 17 ans, et le site ne demande aucune donnée personnelle au-delà d'un nom d'utilisateur.

## Temps réel (socket.io)

- Une connexion n'est acceptée que si elle vient du site lui-même (en-tête `Origin`).
- L'identité vient du témoin de session, vérifié par Better Auth; un invité n'a qu'un identifiant aléatoire et ne peut pas héberger.
- Un message ne peut pas dépasser 16 Ko, et une connexion ne peut pas envoyer plus de 40 messages par seconde (le surplus est ignoré).
- Le serveur décide de tout : il valide chaque paramètre (`mergeSettings`), refuse une progression qui recule, dépasse le texte ou va plus vite que 25 caractères par seconde, et vérifie les droits d'hôte à chaque action.

## Navigateur

- En-têtes envoyés sur chaque page : `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` et `frame-ancestors 'none'` (le site ne peut pas être intégré dans une autre page), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` qui coupe caméra, micro, position et paiement.
- `X-Powered-By` n'est pas envoyé.
- React échappe tout le texte affiché, y compris les noms des joueurs et le texte personnalisé.

## Données

- Les requêtes passent par Drizzle, qui envoie les valeurs séparément du SQL (pas d'injection).
- Les jetons d'invitation et les codes de récupération ne sont stockés que hachés.
- Les secrets (base de données, Better Auth, OAuth) viennent de variables d'environnement. Render génère `BETTER_AUTH_SECRET`.

## Dépendances

`bun audit` est passé le 12 novembre 2026. Next.js a été mis à jour en 16.4.6 pour corriger des failles critiques. Il reste deux failles de gravité moyenne dans des outils de développement qui ne sont pas livrés en production :

- `esbuild`, utilisé par `drizzle-kit` pour générer les migrations (la faille touche le serveur de développement d'esbuild, que le projet n'utilise pas);
- `minimatch`, utilisé par ESLint.

## Limites connues

- Les limites d'essais et de messages sont gardées en mémoire : elles repartent à zéro au redémarrage du serveur et ne seraient pas partagées entre plusieurs serveurs. C'est suffisant pour un seul serveur (hypothèse de 100 joueurs).
- Pas de politique de sécurité du contenu (CSP) complète pour les scripts, parce que Next.js injecte des scripts en ligne. Le risque est réduit par l'échappement de React.
