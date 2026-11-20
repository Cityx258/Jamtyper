import { db } from "../src/db";
import { passage } from "../src/db/corpus";
import { LANGUAGES, TEXT_THEMES, type Language, type TextTheme } from "../src/lib/race-settings";
import type { Passage } from "../src/lib/texts";

let passages: Passage[] = [];

export const corpus = () => passages;

export async function loadCorpus() {
  const rows = await db.select().from(passage);
  passages = rows.flatMap((r) =>
    LANGUAGES.includes(r.language as Language)
      ? [
          {
            language: r.language as Language,
            theme: TEXT_THEMES.includes(r.theme as TextTheme) ? (r.theme as TextTheme) : null,
            text: r.body,
            by: r.author,
          },
        ]
      : [],
  );
  console.log(`[corpus] loaded ${passages.length} passages`);
}
