# Modèle de données

Base de données : PostgreSQL, accédée avec Drizzle ORM (`app/src/db/schema.ts`).

Les tables sont séparées en deux groupes :

- **Existantes** : générées pour Better Auth (comptes, sessions). Elles sont déjà dans le schéma.
- **Prévues** : nécessaires au point de contrôle 1 (salles) puis aux priorités suivantes. Elles ne sont pas encore créées.

## Principe : ce qui est persisté et ce qui reste en mémoire

L'état d'une course en cours (position de chaque coureur, progression de la frappe, minuteries) change plusieurs fois par seconde. Il vit **en mémoire dans le serveur temps réel** (voir [ADR 0001](adr/0001-temps-reel.md)) et n'est pas écrit dans PostgreSQL à chaque frappe.

Les hauteurs de note tirées pour chaque coureur (la mélodie de la course) restent aussi en mémoire : elles ne servent qu'à l'écran de course et de résultats.

PostgreSQL conserve ce qui doit survivre à un redémarrage : comptes, salles, résultats de course, statistiques et objets débloqués. Le résultat d'une course est écrit une seule fois, quand elle se termine.

## Diagramme

```mermaid
erDiagram
    USER ||--o{ SESSION : "ouvre"
    USER ||--o{ ACCOUNT : "possède"
    USER ||--o{ ROOM : "héberge"
    USER ||--o{ ROOM_MEMBER : "participe"
    USER ||--o{ RACE_RESULT : "obtient"
    USER ||--o| PLAYER_NOTE : "choisit"
    USER ||--o| RECOVERY_CODE : "garde"
    ROOM ||--o{ ROOM_MEMBER : "contient"
    ROOM ||--o{ RACE : "accueille"
    ROOM ||--o{ INVITE_LINK : "génère"
    RACE ||--o{ RACE_RESULT : "produit"

    USER {
        text id PK
        text name
        text email UK
        text username UK
        text display_username
        timestamp created_at
    }
    SESSION {
        text id PK
        text user_id FK
        text token UK
        timestamp expires_at
    }
    ACCOUNT {
        text id PK
        text user_id FK
        text provider_id "credential, discord, github"
        text account_id
        text password "hash, comptes à mot de passe seulement"
    }
    ROOM {
        uuid id PK
        text code UK "code de salle, 6 caractères"
        text host_id FK
        text visibility "public, semi_public, private"
        text status "lobby, countdown, racing, finishing, results, closed"
        jsonb settings "paramètres de course choisis par l'hôte"
        timestamp created_at
        timestamp closed_at
    }
    ROOM_MEMBER {
        uuid id PK
        uuid room_id FK
        text user_id FK "nul pour un invité"
        text guest_name "nul pour un joueur connecté"
        text role "racer, spectator"
        timestamp joined_at
        timestamp left_at
    }
    INVITE_LINK {
        uuid id PK
        uuid room_id FK
        text token_hash UK "SHA-256 du jeton, jamais le jeton lui-même"
        text created_by FK
        timestamp created_at
        timestamp expires_at "24 heures"
        timestamp used_at "usage unique"
        uuid used_by FK "room_member qui l'a utilisé"
    }
    RACE {
        uuid id PK
        uuid room_id FK
        text text_body "texte généré pour cette course"
        jsonb settings "copie des paramètres au départ"
        timestamp started_at
        timestamp ended_at
    }
    RACE_RESULT {
        uuid id PK
        uuid race_id FK
        text user_id FK "nul pour un invité ou un bot"
        text display_name
        boolean is_bot
        int position
        numeric wpm
        numeric accuracy
        jsonb missed_keys "pour la carte de chaleur"
        text outcome "finished, forfeited, kicked, eliminated, timed_out"
    }
    PLAYER_NOTE {
        text user_id PK, FK
        text note "whole, half, quarter, eighth, sixteenth, thirtySecond"
    }
    RECOVERY_CODE {
        text user_id PK, FK
        text code_hash "SHA-256 du code, jamais le code lui-même"
        timestamp created_at
    }
```

## Tables existantes

| Table | Rôle | Remarques |
|---|---|---|
| `user` | Compte utilisateur | `username` et `display_username` viennent du plugin *username* de Better Auth. |
| `session` | Sessions ouvertes | Jeton unique, expiration, supprimées avec l'utilisateur. |
| `account` | Méthodes d'authentification d'un utilisateur | Une ligne par méthode : `credential`, `discord`, `github`. Un joueur peut en avoir plusieurs (exigence 1.6, page `/settings`). |
| `verification` | Jetons de vérification de Better Auth | Gérée par Better Auth; pas utilisée par la récupération de mot de passe. |
| `recovery_code` | Code de récupération d'un compte à mot de passe (exigence 1.7) | Une ligne par utilisateur. Seul le hachage SHA-256 est stocké; le code est montré une seule fois et remplacé à chaque utilisation. |
| `room` | Une salle : code, hôte, visibilité, état, paramètres | Exigences 2.1, 2.7, 5.1 à 5.4. |
| `room_member` | Qui est dans la salle et avec quel rôle (coureur ou spectateur) | `user_id` est nul pour un invité. Exigences 1.4, 2.3, 2.4, 2.13. |
| `invite_link` | Lien d'invitation à usage unique pour une course privée | Seul le hachage du jeton est stocké; le lien est consommé dans la même transaction que l'ajout du membre, ce qui empêche deux personnes d'utiliser le même lien. Exigence 5.3. |
| `race` | Une course jouée dans une salle : le texte et les paramètres au départ | Exigences 3.10, 6.6. |
| `race_result` | Le résultat d'un joueur ou d'un bot pour une course | `outcome` vaut `finished`, `forfeited`, `kicked`, `eliminated` ou `timed_out`. Exigences 1.5, 6.3 à 6.5. |
| `player_note` | La note de musique choisie par un joueur (exigence 6.7) | Les notes débloquées ne sont pas stockées : elles se déduisent du nombre de victoires dans `race_result` (une toutes les 5). Sans ligne, le joueur affiche sa note la plus récente. |

Comme Better Auth exige un courriel, les comptes créés avec nom d'utilisateur et mot de passe reçoivent une adresse interne de la forme `nom@users.invalid`. Elle n'est jamais utilisée pour envoyer un message. C'est pour ça que la récupération de mot de passe passe par un code plutôt que par courriel.

## Choix de conception

- **Une salle peut accueillir plusieurs courses.** À la fin d'une course, l'hôte relance avec les mêmes participants (exigence 6.6). `room` et `race` sont donc deux tables distinctes.
- **Les invités n'ont pas de ligne dans `user`.** Ils sont identifiés par un `guest_name` et par leur connexion. Leur progression n'est pas conservée après leur départ (hypothèse 2).
- **Les bots ne sont pas des utilisateurs.** Ils n'apparaissent que dans `race_result` (`is_bot = true`) et ne comptent pas dans les statistiques d'un joueur (hypothèse 1).
- **Les paramètres sont stockés en JSON** (`settings`). Les options de l'hôte (exigences 3.x) sont nombreuses et vont évoluer; un champ JSON validé par le code évite une migration à chaque nouvelle option. La copie dans `race.settings` garde la trace de ce qui a réellement été joué. Le texte réellement joué est déjà dans `race.text_body`, donc la copie ne garde que la longueur du texte personnalisé.
- **Le code de salle** est unique, court et sans caractères ambigus (pas de `0`/`O`, `1`/`I`).
