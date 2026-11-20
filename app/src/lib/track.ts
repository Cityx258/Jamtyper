export type Track = {
  src: string;
  title: string;
  artist: string | null;
  license: string | null;
  link: string | null;
  id?: string;
};

export function fromFileName(file: string): { title: string; artist: string | null } {
  const name = file
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/_/g, " ")
    .replace(/^\d+\.\s+/, "")
    .replace(/\s*\[[^\]]*\]$/, "")
    .trim();
  const split = name.indexOf(" - ");
  if (split === -1) return { title: name, artist: null };
  return { artist: name.slice(0, split).trim() || null, title: name.slice(split + 3).trim() || name };
}
