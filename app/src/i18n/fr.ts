import type { Dict } from "./en";

const fr: Dict = {
  meta: {
    description: "Affronte tes amis et apprends à taper vite.",
    loginTitle: "Connexion",
  },
  header: {
    signIn: "Connexion",
    signOut: "Déconnexion",
    switchLanguage: "Passer la langue en anglais",
    languageShort: "EN",
    switchToLight: "Passer au thème clair",
    switchToDark: "Passer au thème sombre",
  },
  home: {
    kicker: "La frappe, en rythme",
    headingA: "Tape vite.",
    headingB: "Garde le rythme.",
    intro:
      "Affronte d'autres joueurs en temps réel, grimpe sur le podium et débloque de nouveaux styles à mesure que ta vitesse augmente.",
    waysToPlay: "Façons de jouer",
    create: {
      signInToHost: "Connecte-toi pour créer",
      pending: "Création...",
      error: "Impossible de créer la salle. Réessaie.",
    },
    join: {
      label: "Code de salle",
      placeholder: "ABC123",
      invalid: "Un code de salle compte 6 caractères.",
    },
    measures: [
      {
        title: "Course",
        text: "Rejoins une course publique et vois qui termine en premier.",
        action: "Lancer une course",
      },
      {
        title: "Rejoindre",
        text: "Un ami t'a donné un code de salle? Entre-le ici.",
        action: "Rejoindre la salle",
      },
      {
        title: "Entraînement",
        text: "Échauffe-toi seul, sans personne pour te regarder.",
        action: "S'entraîner seul",
      },
    ],
  },
  room: {
    title: "Salle",
    kicker: "Code de salle",
    copyCode: "Copier le code",
    copyLink: "Copier le lien",
    copied: "Copié",
    players: "Joueurs",
    host: "hôte",
    you: "toi",
    spectator: "spectateur",
    reconnecting: "reconnexion",
    waiting:
      "Partage le code et attends tes amis. Une course demande au moins 2 joueurs.",
    leave: "Quitter la salle",
    joining: "Connexion à la salle...",
    connectionLost: "Connexion perdue. Nouvelle tentative...",
    nameTitle: "Choisis un nom",
    nameHint:
      "Tu rejoins en tant qu'invité. C'est le nom que verront les autres joueurs.",
    nameLabel: "Ton nom",
    nameAction: "Rejoindre la salle",
    signInInstead: "Tu as un compte?",
    signIn: "Connexion",
    backHome: "Retour à l'accueil",
    errors: {
      not_found: "Cette salle n'existe pas ou est déjà fermée.",
      bad_request: "Ça ne ressemble pas à un code de salle.",
      not_signed_in: "Tu dois te connecter pour faire ça.",
      server_error: "Une erreur est survenue. Réessaie.",
    },
    closed: "Cette salle a été fermée.",
  },
  login: {
    tablistLabel: "Se connecter ou créer un compte",
    tabSignIn: "Connexion",
    tabSignUp: "Créer un compte",
    continueWith: "Continuer avec {name}",
    soon: "Bientôt",
    nudge:
      "Discord et GitHub sont la façon la plus rapide et la plus sûre d'entrer.",
    usePassword: "Utiliser plutôt un nom d'utilisateur et un mot de passe",
    or: "ou",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    passwordHint: "Au moins 8 caractères.",
    submitSignIn: "Se connecter",
    submitSignUp: "Créer le compte",
    pending: "Un instant...",
    guestPrompt: "Tu veux juste jeter un coup d'œil?",
    guestLink: "Continuer en invité",
    welcomeA: "Content de te",
    welcomeB: "revoir",
    welcomeC: "sur scène.",
    errors: {
      usernameFormat:
        "Le nom d'utilisateur doit compter de 3 à 20 caractères : lettres, chiffres, _ ou .",
      passwordShort: "Le mot de passe doit compter au moins 8 caractères.",
      badCredentials: "Nom d'utilisateur ou mot de passe incorrect.",
      taken: "Ce nom d'utilisateur est déjà pris.",
      generic: "Une erreur est survenue. Réessaie.",
    },
  },
};

export default fr;
