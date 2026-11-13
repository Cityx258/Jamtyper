import type { CodeLanguage, NaturalLanguage, TextTheme } from "../race-settings";

const en = {
  general: [
    "time", "music", "drum", "beat", "song", "play", "band", "tune", "note",
    "rhythm", "jazz", "guitar", "piano", "voice", "stage", "light", "sound",
    "fast", "slow", "loud", "quiet", "happy", "bright", "night", "day",
    "river", "city", "street", "house", "window", "garden", "summer", "winter",
    "friend", "school", "class", "paper", "pencil", "travel", "train",
    "planet", "ocean", "forest", "mountain", "rocket", "orange", "yellow",
    "purple", "green", "simple", "little", "great", "every", "always", "never",
    "today", "tomorrow", "dance", "jump", "run", "walk", "write", "read",
  ],
  music: [
    "melody", "harmony", "rhythm", "tempo", "chord", "guitar", "piano", "drum",
    "violin", "trumpet", "flute", "bass", "song", "singer", "band", "concert",
    "stage", "note", "scale", "beat", "lyric", "chorus", "verse", "album",
    "record", "studio", "microphone", "speaker", "volume", "loud", "quiet",
    "sharp", "flat", "major", "minor", "solo", "duet", "orchestra",
    "conductor", "jazz", "rock", "blues", "pop", "rap", "dance", "tune",
    "playlist", "headphones",
  ],
  nature: [
    "tree", "forest", "river", "lake", "ocean", "mountain", "valley", "flower",
    "leaf", "grass", "rain", "snow", "wind", "cloud", "storm", "sun", "moon",
    "star", "sky", "bird", "fish", "wolf", "bear", "deer", "fox", "rabbit",
    "insect", "bee", "butterfly", "rock", "sand", "beach", "island", "desert",
    "jungle", "garden", "seed", "root", "branch", "spring", "summer",
    "autumn", "winter", "wild", "green", "fresh", "earth",
  ],
  science: [
    "atom", "cell", "energy", "force", "gravity", "light", "wave", "mass",
    "speed", "planet", "galaxy", "star", "orbit", "rocket", "telescope",
    "microscope", "laboratory", "experiment", "theory", "data", "graph",
    "formula", "chemistry", "physics", "biology", "molecule", "electron",
    "proton", "magnet", "circuit", "battery", "robot", "computer", "code",
    "gene", "virus", "fossil", "climate", "oxygen", "carbon", "hydrogen",
    "measure", "test", "result", "research", "discovery", "science",
  ],
};

const fr = {
  general: [
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
  music: [
    "mélodie", "harmonie", "rythme", "tempo", "accord", "guitare", "piano",
    "tambour", "violon", "trompette", "flûte", "basse", "chanson", "chanteur",
    "groupe", "concert", "scène", "note", "gamme", "battement", "parole",
    "refrain", "couplet", "album", "disque", "studio", "micro", "volume",
    "fort", "doux", "dièse", "bémol", "majeur", "mineur", "solo", "duo",
    "orchestre", "chef", "jazz", "rock", "blues", "danse", "air",
    "écouteurs", "musique", "clavier",
  ],
  nature: [
    "arbre", "forêt", "rivière", "lac", "océan", "montagne", "vallée", "fleur",
    "feuille", "herbe", "pluie", "neige", "vent", "nuage", "orage", "soleil",
    "lune", "étoile", "ciel", "oiseau", "poisson", "loup", "ours", "cerf",
    "renard", "lapin", "insecte", "abeille", "papillon", "roche", "sable",
    "plage", "île", "désert", "jungle", "jardin", "graine", "racine",
    "branche", "printemps", "été", "automne", "hiver", "sauvage", "vert",
    "frais", "terre",
  ],
  science: [
    "atome", "cellule", "énergie", "force", "gravité", "lumière", "onde",
    "masse", "vitesse", "planète", "galaxie", "étoile", "orbite", "fusée",
    "télescope", "microscope", "laboratoire", "expérience", "théorie",
    "donnée", "graphique", "formule", "chimie", "physique", "biologie",
    "molécule", "électron", "proton", "aimant", "circuit", "batterie",
    "robot", "ordinateur", "code", "gène", "virus", "fossile", "climat",
    "oxygène", "carbone", "hydrogène", "mesure", "test", "résultat",
    "recherche", "découverte", "science",
  ],
};

export const THEMED_WORDS: Record<NaturalLanguage, Record<TextTheme, string[]>> = { en, fr };

export const CODE_WORDS: Record<CodeLanguage, string[]> = {
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
  java: [
    "public", "private", "static", "void", "class", "interface", "extends",
    "implements", "new", "return", "if", "else", "for", "while", "switch",
    "case", "break", "final", "this", "super", "null", "true", "false",
    "int", "double", "boolean", "String", "List", "Map", "ArrayList",
    "HashMap", "System.out.println()", "main()", "size()", "add()", "get()",
    "try", "catch", "throw", "throws", "import", "package", "==", "!=",
    "&&", "||", "{}", "[]", "();",
  ],
  csharp: [
    "public", "private", "static", "void", "class", "interface", "namespace",
    "using", "new", "return", "if", "else", "for", "foreach", "while", "in",
    "var", "int", "double", "bool", "string", "null", "true", "false",
    "async", "await", "Task", "List", "Dictionary", "Console.WriteLine()",
    "Main()", "Count", "Add()", "get;", "set;", "this", "base", "override",
    "try", "catch", "throw", "=>", "==", "!=", "&&", "||", "{}", "[]", "();",
  ],
};
