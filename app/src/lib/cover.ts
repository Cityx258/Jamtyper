"use client";

import { readCover, type Read } from "./cover-tags";

const CHUNK = 256 * 1024;
const KEEP = 24;
const covers = new Map<string, Promise<string | null>>();

function blobReader(blob: Blob): Read {
  return async (offset, length) => new Uint8Array(await blob.slice(offset, offset + length).arrayBuffer());
}

function rangeReader(src: string): Read {
  const chunks = new Map<number, Uint8Array>();
  let whole: Uint8Array | null = null;
  let size = Infinity;

  async function fetchChunks(first: number, last: number) {
    const res = await fetch(src, { headers: { Range: `bytes=${first * CHUNK}-${(last + 1) * CHUNK - 1}` } });
    if (!res.ok) throw new Error(`cover fetch ${res.status}`);
    const body = new Uint8Array(await res.arrayBuffer());
    if (res.status !== 206) {
      whole = body;
      size = body.length;
      return;
    }
    const total = Number(res.headers.get("Content-Range")?.split("/")[1]);
    if (Number.isFinite(total)) size = total;
    for (let n = first; n <= last; n++) {
      const piece = body.subarray((n - first) * CHUNK, (n - first + 1) * CHUNK);
      if (piece.length > 0) chunks.set(n, piece);
    }
  }

  return async (offset, length) => {
    const end = Math.min(offset + length, size);
    if (whole || end <= offset) return (whole ?? new Uint8Array()).slice(offset, end);
    const first = Math.floor(offset / CHUNK);
    const last = Math.floor((end - 1) / CHUNK);
    let missing = -1;
    for (let n = first; n <= last + 1; n++) {
      if (n <= last && !chunks.has(n)) {
        if (missing === -1) missing = n;
      } else if (missing !== -1) {
        await fetchChunks(missing, n - 1);
        if (whole) return (whole as Uint8Array).slice(offset, end);
        missing = -1;
      }
    }
    const out = new Uint8Array(Math.max(0, Math.min(end, size) - offset));
    for (let n = first; n <= last; n++) {
      const piece = chunks.get(n);
      if (!piece) break;
      const at = n * CHUNK;
      const from = Math.max(offset, at) - at;
      const to = Math.min(end, at + piece.length) - at;
      if (to > from) out.set(piece.subarray(from, to), at + from - offset);
    }
    return out;
  };
}

async function load(src: string): Promise<string | null> {
  try {
    const read = src.startsWith("blob:") ? blobReader(await (await fetch(src)).blob()) : rangeReader(src);
    const pic = await readCover(read);
    return pic ? URL.createObjectURL(new Blob([pic.data as BlobPart], { type: pic.type })) : null;
  } catch {
    return null;
  }
}

export function coverFor(src: string): Promise<string | null> {
  let cover = covers.get(src);
  if (cover) {
    covers.delete(src);
    covers.set(src, cover);
    return cover;
  }
  cover = load(src);
  covers.set(src, cover);
  if (covers.size > KEEP) {
    const [oldest, url] = covers.entries().next().value!;
    covers.delete(oldest);
    void url.then((u) => u && URL.revokeObjectURL(u));
  }
  return cover;
}
