export type Read = (offset: number, length: number) => Promise<Uint8Array>;

export type Picture = { type: string; data: Uint8Array };

export type Tags = { cover: Picture | null; lyrics: string | null };

const NONE: Tags = { cover: null, lyrics: null };

const MAX_TAG = 32 * 1024 * 1024;
const FRONT_COVER = 3;

const ascii = (b: Uint8Array, start: number, end: number) => String.fromCharCode(...b.subarray(start, end));
const u32 = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u24 = (b: Uint8Array, i: number) => (b[i] << 16) | (b[i + 1] << 8) | b[i + 2];
const u32le = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const synchsafe = (b: Uint8Array, i: number) => (b[i] << 21) | (b[i + 1] << 14) | (b[i + 2] << 7) | b[i + 3];

export function sniffImage(b: Uint8Array): string | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && ascii(b, 1, 4) === "PNG") return "image/png";
  if (ascii(b, 0, 4) === "GIF8") return "image/gif";
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return "image/webp";
  if (ascii(b, 0, 2) === "BM") return "image/bmp";
  return null;
}

function picture(data: Uint8Array): Picture | null {
  const type = sniffImage(data);
  return type && data.length > 0 ? { type, data } : null;
}

export async function readTags(read: Read): Promise<Tags> {
  const head = await read(0, 12);
  if (head.length < 12) return NONE;
  if (ascii(head, 0, 3) === "ID3") return id3(read, head);
  if (ascii(head, 0, 4) === "fLaC") return flac(read);
  if (ascii(head, 0, 4) === "OggS") return ogg(read);
  if (ascii(head, 4, 8) === "ftyp") return mp4(read);
  return NONE;
}

export async function readCover(read: Read): Promise<Picture | null> {
  return (await readTags(read)).cover;
}

export async function readLyrics(read: Read): Promise<string | null> {
  return (await readTags(read)).lyrics;
}

function clean(text: string): string | null {
  const out = text.replace(/\0+$/, "").replace(/\r\n?/g, "\n").trim();
  return out || null;
}

function unsync(b: Uint8Array): Uint8Array {
  const out = new Uint8Array(b.length);
  let n = 0;
  for (let i = 0; i < b.length; i++) {
    out[n++] = b[i];
    if (b[i] === 0xff && b[i + 1] === 0x00) i++;
  }
  return out.subarray(0, n);
}

function textEnd(b: Uint8Array, from: number, wide: boolean): number {
  if (!wide) {
    const end = b.indexOf(0, from);
    return end === -1 ? b.length : end + 1;
  }
  for (let i = from; i + 1 < b.length; i += 2) if (b[i] === 0 && b[i + 1] === 0) return i + 2;
  return b.length;
}

function decodeText(b: Uint8Array, encoding: number): string {
  if (encoding === 0) return String.fromCharCode(...b);
  if (encoding === 1) return new TextDecoder("utf-16").decode(b);
  if (encoding === 2) return new TextDecoder("utf-16be").decode(b);
  return new TextDecoder().decode(b);
}

function uslt(body: Uint8Array): string | null {
  const encoding = body[0];
  const i = textEnd(body, 4, encoding === 1 || encoding === 2);
  return clean(decodeText(body.subarray(i), encoding));
}

function apic(body: Uint8Array, v2: boolean): { kind: number; pic: Picture | null } {
  const encoding = body[0];
  let i = 1;
  if (v2) i += 3;
  else i = textEnd(body, i, false);
  const kind = body[i++];
  i = textEnd(body, i, encoding === 1 || encoding === 2);
  return { kind, pic: picture(body.subarray(i)) };
}

async function id3(read: Read, head: Uint8Array): Promise<Tags> {
  const version = head[3];
  const flags = head[5];
  const size = synchsafe(head, 6);
  if (version < 2 || version > 4 || size > MAX_TAG) return NONE;
  let tag = await read(10, size);
  if (version < 4 && flags & 0x80) tag = unsync(tag);
  let i = 0;
  if (version === 3 && flags & 0x40) i = 4 + u32(tag, 0);
  if (version === 4 && flags & 0x40) i = synchsafe(tag, 0);
  let found: Picture | null = null;
  let front: Picture | null = null;
  let lyrics: string | null = null;
  const v2 = version === 2;
  const headerSize = v2 ? 6 : 10;
  while (i + headerSize <= tag.length) {
    const id = ascii(tag, i, v2 ? i + 3 : i + 4);
    if (!/^[A-Z0-9]+$/.test(id)) break;
    const length = v2 ? u24(tag, i + 3) : version === 4 ? synchsafe(tag, i + 4) : u32(tag, i + 4);
    const frameFlags = v2 ? 0 : tag[i + 9];
    let body = tag.subarray(i + headerSize, i + headerSize + length);
    i += headerSize + length;
    const isPicture = id === (v2 ? "PIC" : "APIC");
    const isLyrics = id === (v2 ? "ULT" : "USLT");
    if (!isPicture && !isLyrics) continue;
    const packed = version === 3 ? frameFlags & 0xc0 : version === 4 ? frameFlags & 0x0c : 0;
    if (packed) continue;
    if (version === 4 && frameFlags & 0x01) body = body.subarray(4);
    if (version === 4 && frameFlags & 0x02) body = unsync(body);
    if (isLyrics) {
      lyrics ??= uslt(body);
      continue;
    }
    const { kind, pic } = apic(body, v2);
    if (!pic) continue;
    if (kind === FRONT_COVER) front ??= pic;
    found ??= pic;
  }
  return { cover: front ?? found, lyrics };
}

export function flacPicture(b: Uint8Array): { kind: number; pic: Picture | null } {
  if (b.length < 32) return { kind: -1, pic: null };
  const kind = u32(b, 0);
  let i = 4;
  i += 4 + u32(b, i);
  i += 4 + u32(b, i);
  i += 16;
  const length = u32(b, i);
  i += 4;
  return { kind, pic: i + length <= b.length ? picture(b.subarray(i, i + length)) : null };
}

async function flac(read: Read): Promise<Tags> {
  let offset = 4;
  let found: Picture | null = null;
  let front: Picture | null = null;
  let lyrics: string | null = null;
  for (let n = 0; n < 128; n++) {
    const header = await read(offset, 4);
    if (header.length < 4) break;
    const last = header[0] & 0x80;
    const type = header[0] & 0x7f;
    const length = u24(header, 1);
    if (type === 6 && length <= MAX_TAG) {
      const { kind, pic } = flacPicture(await read(offset + 4, length));
      if (pic && kind === FRONT_COVER) front ??= pic;
      if (pic) found ??= pic;
    }
    if (type === 4 && length <= MAX_TAG) lyrics ??= vorbisComments(await read(offset + 4, length), 0).lyrics;
    offset += 4 + length;
    if (last) break;
  }
  return { cover: front ?? found, lyrics };
}

function base64(text: string): Uint8Array | null {
  try {
    const raw = atob(text.replace(/\s/g, ""));
    const out = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  } catch {
    return null;
  }
}

async function oggCommentPacket(read: Read): Promise<Uint8Array | null> {
  let offset = 0;
  let serial = -1;
  const parts: Uint8Array[] = [];
  let packet = 0;
  let size = 0;
  for (let page = 0; page < 4096; page++) {
    const header = await read(offset, 27);
    if (header.length < 27 || ascii(header, 0, 4) !== "OggS") return null;
    const pageSerial = u32le(header, 14);
    if (serial === -1) serial = pageSerial;
    const count = header[26];
    const table = await read(offset + 27, count);
    const bodyLength = table.reduce((sum, n) => sum + n, 0);
    const bodyStart = offset + 27 + count;
    offset = bodyStart + bodyLength;
    if (pageSerial !== serial) continue;
    const body = await read(bodyStart, bodyLength);
    let at = 0;
    for (const lace of table) {
      if (packet === 1) {
        parts.push(body.subarray(at, at + lace));
        size += lace;
        if (size > MAX_TAG) return null;
      }
      at += lace;
      if (lace < 255) {
        if (packet === 1) {
          const out = new Uint8Array(size);
          let n = 0;
          for (const p of parts) {
            out.set(p, n);
            n += p.length;
          }
          return out;
        }
        packet++;
      }
    }
  }
  return null;
}

async function ogg(read: Read): Promise<Tags> {
  const packet = await oggCommentPacket(read);
  if (!packet) return NONE;
  if (ascii(packet, 0, 8) === "OpusTags") return vorbisComments(packet, 8);
  if (packet[0] === 3 && ascii(packet, 1, 7) === "vorbis") return vorbisComments(packet, 7);
  return NONE;
}

const LYRIC_KEYS = ["LYRICS", "UNSYNCEDLYRICS", "SYNCEDLYRICS"];

function vorbisComments(packet: Uint8Array, start: number): Tags {
  let i = start;
  i += 4 + u32le(packet, i);
  const count = u32le(packet, i);
  i += 4;
  const decoder = new TextDecoder();
  let found: Picture | null = null;
  let front: Picture | null = null;
  let lyrics: string | null = null;
  for (let n = 0; n < count && i + 4 <= packet.length; n++) {
    const length = u32le(packet, i);
    const entry = packet.subarray(i + 4, i + 4 + length);
    i += 4 + length;
    const eq = entry.indexOf(0x3d);
    if (eq === -1) continue;
    const key = ascii(entry, 0, eq).toUpperCase();
    if (LYRIC_KEYS.includes(key)) {
      lyrics ??= clean(decoder.decode(entry.subarray(eq + 1)));
      continue;
    }
    if (key !== "METADATA_BLOCK_PICTURE" && key !== "COVERART") continue;
    const bytes = base64(decoder.decode(entry.subarray(eq + 1)));
    if (!bytes) continue;
    if (key === "COVERART") {
      found ??= picture(bytes);
      continue;
    }
    const { kind, pic } = flacPicture(bytes);
    if (pic && kind === FRONT_COVER) front ??= pic;
    if (pic) found ??= pic;
  }
  return { cover: front ?? found, lyrics };
}

type Box = { type: string; start: number; end: number };

function* boxes(b: Uint8Array, start: number, end: number): Generator<Box> {
  let i = start;
  while (i + 8 <= end) {
    let size = u32(b, i);
    let header = 8;
    if (size === 1) {
      size = u32(b, i + 8) * 2 ** 32 + u32(b, i + 12);
      header = 16;
    } else if (size === 0) size = end - i;
    if (size < header || i + size > end) return;
    yield { type: ascii(b, i + 4, i + 8), start: i + header, end: i + size };
    i += size;
  }
}

function child(b: Uint8Array, parent: Box | null, type: string): Box | null {
  if (!parent) return null;
  for (const box of boxes(b, parent.start, parent.end)) if (box.type === type) return box;
  return null;
}

async function mp4(read: Read): Promise<Tags> {
  let offset = 0;
  for (let n = 0; n < 64; n++) {
    const header = await read(offset, 16);
    if (header.length < 8) return NONE;
    let size = u32(header, 0);
    let skip = 8;
    if (size === 1) {
      size = u32(header, 8) * 2 ** 32 + u32(header, 12);
      skip = 16;
    }
    if (size < skip) return NONE;
    if (ascii(header, 4, 8) === "moov") {
      if (size > MAX_TAG) return NONE;
      const moov = await read(offset, size);
      return mp4Tags(moov, { type: "moov", start: skip, end: moov.length });
    }
    offset += size;
  }
  return NONE;
}

function mp4Tags(b: Uint8Array, moov: Box): Tags {
  const meta = child(b, child(b, moov, "udta"), "meta");
  if (!meta) return NONE;
  const full = ascii(b, meta.start + 4, meta.start + 8) !== "hdlr";
  const ilst = child(b, { ...meta, start: meta.start + (full ? 4 : 0) }, "ilst");
  return { cover: mp4Cover(b, child(b, ilst, "covr")), lyrics: mp4Lyrics(b, child(b, ilst, "\u00a9lyr")) };
}

function mp4Cover(b: Uint8Array, covr: Box | null): Picture | null {
  if (!covr) return null;
  for (const data of boxes(b, covr.start, covr.end)) {
    if (data.type !== "data") continue;
    const pic = picture(b.subarray(data.start + 8, data.end));
    if (pic) return pic;
  }
  return null;
}

function mp4Lyrics(b: Uint8Array, lyr: Box | null): string | null {
  const data = child(b, lyr, "data");
  return data ? clean(new TextDecoder().decode(b.subarray(data.start + 8, data.end))) : null;
}
