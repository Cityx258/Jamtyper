import type { Language } from "../race-settings";

export const WORDS: Record<Language, string[]> = {
  en: [
    "time", "music", "drum", "beat", "song", "play", "band", "tune", "note",
    "rhythm", "jazz", "guitar", "piano", "voice", "stage", "light", "sound",
    "fast", "slow", "loud", "quiet", "happy", "bright", "night", "day",
    "river", "city", "street", "house", "window", "garden", "summer", "winter",
    "friend", "school", "class", "paper", "pencil", "travel", "train",
    "planet", "ocean", "forest", "mountain", "rocket", "orange", "yellow",
    "purple", "green", "simple", "little", "great", "every", "always", "never",
    "today", "tomorrow", "dance", "jump", "run", "walk", "write", "read",
  ],
  fr: [
    "maison", "chat", "chien", "école", "été", "hiver", "ville", "rue",
    "jardin", "soleil", "lune", "étoile", "ami", "livre", "crayon", "papier",
    "table", "fenêtre", "porte", "musique", "chanson", "voix", "danse",
    "rythme", "piano", "guitare", "rapide", "lent", "fort", "doux", "heureux",
    "grand", "petit", "jour", "nuit", "matin", "soir", "demain", "hier",
    "toujours", "jamais", "aussi", "très", "encore", "déjà", "après", "avant",
    "ici", "là", "eau", "feu", "terre", "ciel", "arbre", "fleur", "forêt",
    "mer", "rivière", "montagne", "pomme", "pain", "fromage", "café", "lait",
    "jouer", "courir", "marcher", "lire", "écrire", "chanter", "parler",
    "penser", "aimer", "voir", "savoir", "faire", "prendre", "donner",
    "trouver", "élève", "classe", "fête", "garçon", "fille", "tête", "bientôt",
  ],
  javascript: [
    "const", "let", "function", "return", "if", "else", "for", "while",
    "class", "new", "this", "await", "async", "import", "export", "from",
    "default", "null", "undefined", "true", "false", "typeof", "map()",
    "filter()", "reduce()", "push()", "length", "console.log()", "document",
    "window", "Promise", "JSON.parse()", "=>", "===", "!==", "&&", "||",
    "{}", "[]", "();", "try", "catch", "throw", "switch", "case", "break",
  ],
  python: [
    "def", "return", "if", "elif", "else", "for", "while", "in", "not",
    "and", "or", "class", "self", "import", "from", "as", "with", "try",
    "except", "finally", "lambda", "yield", "None", "True", "False",
    "print()", "len()", "range()", "list", "dict", "str", "int", "append()",
    "items()", "keys()", "pass", "break", "continue", "global", "==", "!=",
    "**", "//", "[]", "{}", "():",
  ],
};
