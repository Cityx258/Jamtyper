import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";

export type Track = {
  src: string;
  title: string;
  artist: string | null;
  license: string | null;
  link: string | null;
};

const AUDIO = /\.(mp3|ogg|opus|m4a|wav|webm|flac)$/i;
const DIR = path.join(process.cwd(), "public", "music");

const credit = z.object({
  title: z.string().trim().min(1).optional(),
  artist: z.string().trim().min(1).optional(),
  license: z.string().trim().min(1).optional(),
  link: z.url({ protocol: /^https?$/ }).optional(),
});

const creditsFile = z.record(z.string(), credit);

async function readCredits(): Promise<z.infer<typeof creditsFile>> {
  try {
    const parsed = creditsFile.safeParse(JSON.parse(await readFile(path.join(DIR, "credits.json"), "utf8")));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function fromFileName(file: string): { title: string; artist: string | null } {
  const name = file.replace(AUDIO, "").replace(/_/g, " ").trim();
  const split = name.indexOf(" - ");
  if (split === -1) return { title: name, artist: null };
  return { artist: name.slice(0, split).trim() || null, title: name.slice(split + 3).trim() || name };
}

export const musicTracks = cache(async (): Promise<Track[]> => {
  let files: string[];
  try {
    files = await readdir(DIR);
  } catch {
    return [];
  }
  const credits = await readCredits();
  return files
    .filter((f) => AUDIO.test(f))
    .sort()
    .map((f) => {
      const guess = fromFileName(f);
      const c = credits[f] ?? {};
      return {
        src: `/music/${encodeURIComponent(f)}`,
        title: c.title ?? guess.title,
        artist: c.artist ?? guess.artist,
        license: c.license ?? null,
        link: c.link ?? null,
      };
    });
});
