import { describe, expect, test } from "bun:test";
import { fromFileName } from "../src/lib/tracks";

describe("fromFileName", () => {
  test("splits artist and title on a spaced dash", () => {
    expect(fromFileName("Some Producer - My Song.mp3")).toEqual({ artist: "Some Producer", title: "My Song" });
  });

  test("keeps the whole name as the title when there is no dash", () => {
    expect(fromFileName("my_song.ogg")).toEqual({ artist: null, title: "my song" });
  });

  test("keeps dashes inside the title", () => {
    expect(fromFileName("Artist - Re-Mix - Live.flac")).toEqual({ artist: "Artist", title: "Re-Mix - Live" });
  });
});
