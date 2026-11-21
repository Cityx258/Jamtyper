import { expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readCover, readLyrics, readTags, type Read } from "../src/lib/cover-tags";
import { lineAt, parseLyrics } from "../src/lib/lyrics";

const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 9]);
const text = (s: string) => new TextEncoder().encode(s);
const cat = (...parts: (Uint8Array | number[])[]) => new Uint8Array(parts.flatMap((p) => [...p]));
const be32 = (n: number) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
const le32 = (n: number) => be32(n).reverse();
const safe = (n: number) => [(n >> 21) & 127, (n >> 14) & 127, (n >> 7) & 127, n & 127];
const reader = (b: Uint8Array): Read => async (o, l) => b.slice(o, o + l);

const box = (type: string, ...body: Uint8Array[]) => {
  const inner = cat(...body);
  return cat(be32(inner.length + 8), text(type), inner);
};

function flacPictureBlock(kind: number, image: Uint8Array) {
  const mime = text("image/x");
  return cat(be32(kind), be32(mime.length), mime, be32(0), new Array(16).fill(0), be32(image.length), image);
}

test("an MP4 cover is read from moov/udta/meta/ilst/covr, even after mdat", async () => {
  const meta = box("meta", new Uint8Array(4), box("hdlr", new Uint8Array(25)), box("ilst", box("covr", box("data", new Uint8Array([0, 0, 0, 13, 0, 0, 0, 0]), JPEG))));
  const file = cat(box("ftyp", text("M4A "), new Uint8Array(4)), box("mdat", new Uint8Array(5000)), box("moov", box("udta", meta)));
  expect(await readCover(reader(file))).toEqual({ type: "image/jpeg", data: JPEG });
});

test("an ID3v2.3 front cover is preferred over another picture", async () => {
  const frame = (kind: number, image: Uint8Array) => {
    const body = cat([0], text("image/png"), [0, kind], text("desc"), [0], image);
    return cat(text("APIC"), be32(body.length), [0, 0], body);
  };
  const tag = cat(frame(0, JPEG), frame(3, PNG), new Array(20).fill(0));
  const file = cat(text("ID3"), [3, 0, 0], safe(tag.length), tag, [0xff, 0xfb]);
  expect(await readCover(reader(file))).toEqual({ type: "image/png", data: PNG });
});

test("ID3v2.4 uses synchsafe frame sizes and UTF-16 descriptions", async () => {
  const body = cat([1], text("image/jpeg"), [0, 3], [0xff, 0xfe, 0x41, 0, 0, 0], JPEG);
  const tag = cat(text("APIC"), safe(body.length), [0, 0], body);
  const file = cat(text("ID3"), [4, 0, 0], safe(tag.length), tag);
  expect((await readCover(reader(file)))?.data).toEqual(JPEG);
});

test("a FLAC PICTURE block is read", async () => {
  const pic = flacPictureBlock(3, PNG);
  const file = cat(text("fLaC"), [0, 0, 0, 34], new Array(34).fill(0), [0x86], [(pic.length >> 16) & 255, (pic.length >> 8) & 255, pic.length & 255], pic);
  expect(await readCover(reader(file))).toEqual({ type: "image/png", data: PNG });
});

test("an Opus METADATA_BLOCK_PICTURE comment is read, even across pages", async () => {
  const image = cat(JPEG, new Array(600).fill(7));
  const comment = text(`METADATA_BLOCK_PICTURE=${btoa(String.fromCharCode(...flacPictureBlock(3, image)))}`);
  const tags = cat(text("OpusTags"), le32(3), text("lib"), le32(1), le32(comment.length), comment);
  const page = (body: Uint8Array, lacing: number[]) =>
    cat(text("OggS"), [0, 0], new Array(8).fill(0), le32(7), new Array(8).fill(0), [lacing.length], lacing, body);
  const lace = (n: number) => [...new Array(Math.floor(n / 255)).fill(255), n % 255];
  const head = text("OpusHead........");
  const file = cat(page(head, lace(head.length)), page(tags.subarray(0, 255), [255]), page(tags.subarray(255), lace(tags.length - 255)));
  expect(await readCover(reader(file))).toEqual({ type: "image/jpeg", data: image });
});

test("files without a cover, or with bytes that aren't an image, give nothing", async () => {
  expect(await readCover(reader(cat(text("ID3"), [3, 0, 0], safe(10), new Array(10).fill(0))))).toBeNull();
  const fake = box("moov", box("udta", box("meta", new Uint8Array(4), box("ilst", box("covr", box("data", new Uint8Array(8), text("<svg>")))))));
  expect(await readCover(reader(cat(box("ftyp", text("M4A ")), fake)))).toBeNull();
  expect(await readCover(reader(text("not an audio file at all")))).toBeNull();
});

test("every .m4a site song has a cover the player can show", async () => {
  const dir = join(import.meta.dir, "../public/music");
  const songs = readdirSync(dir).filter((f) => f.endsWith(".m4a"));
  expect(songs.length).toBeGreaterThan(0);
  const missing = [];
  for (const song of songs) {
    const cover = await readCover(reader(new Uint8Array(readFileSync(join(dir, song)))));
    if (!cover?.type.startsWith("image/")) missing.push(song);
  }
  expect(missing).toEqual([]);
});

test("MP4 lyrics are read from the ©lyr atom next to the cover", async () => {
  const lyrBody = box("data", new Uint8Array([0, 0, 0, 1, 0, 0, 0, 0]), text("[00:01.50] hello\r\n[00:03.00] world"));
  const lyr = cat(be32(lyrBody.length + 8), [0xa9], text("lyr"), lyrBody);
  const meta = box("meta", new Uint8Array(4), box("hdlr", new Uint8Array(25)), box("ilst", lyr));
  const file = cat(box("ftyp", text("M4A "), new Uint8Array(4)), box("moov", box("udta", meta)));
  expect(await readTags(reader(file))).toEqual({ cover: null, lyrics: "[00:01.50] hello\n[00:03.00] world" });
});

test("ID3 USLT lyrics are read", async () => {
  const body = cat([3], text("eng"), [0], text("la la la"));
  const tag = cat(text("USLT"), be32(body.length), [0, 0], body, new Array(10).fill(0));
  const file = cat(text("ID3"), [3, 0, 0], safe(tag.length), tag);
  expect(await readLyrics(reader(file))).toBe("la la la");
});

test("synced lyrics are parsed, sorted and looked up by time", () => {
  const lyrics = parseLyrics("[ar:Miku]\n[00:05.00][00:20.00] chorus\n[00:01.50] intro\n[00:10.00]\n[00:30.00]");
  expect(lyrics).toEqual({
    synced: true,
    lines: [
      { at: 1.5, text: "intro" },
      { at: 5, text: "chorus" },
      { at: 10, text: "" },
      { at: 20, text: "chorus" },
    ],
  });
  if (!lyrics?.synced) throw new Error("not synced");
  expect(lineAt(lyrics.lines, 0)).toBe(-1);
  expect(lineAt(lyrics.lines, 6)).toBe(1);
  expect(lineAt(lyrics.lines, 99)).toBe(3);
});

test("plain lyrics stay plain", () => {
  expect(parseLyrics("\nfirst\n\n\nsecond\n")).toEqual({ synced: false, lines: ["first", "", "second"] });
  expect(parseLyrics("  \n")).toBeNull();
});

test("site songs with lyrics in their tags give the player lyrics", async () => {
  const dir = join(import.meta.dir, "../public/music");
  let found = 0;
  for (const song of readdirSync(dir).filter((f) => f.endsWith(".m4a"))) {
    if (parseLyrics(await readLyrics(reader(new Uint8Array(readFileSync(join(dir, song))))))) found++;
  }
  expect(found).toBeGreaterThan(0);
});
