import { describe, expect, it } from "vitest";
import { MediaType } from "@/plugins/api/interfaces";
import { albumHeroYears, displayYear } from "./albumYear";

describe("displayYear", () => {
  it("shows the first release of an album", () => {
    expect(
      displayYear({
        media_type: MediaType.ALBUM,
        year: 2011,
        metadata: { original_year: 1973 },
      }),
    ).toBe(1973);
  });

  it("falls back to the year of the edition", () => {
    expect(displayYear({ media_type: MediaType.ALBUM, year: 2011 })).toBe(2011);
  });

  it("keeps the own year of an item that is not an album", () => {
    expect(
      displayYear({
        media_type: MediaType.TRACK,
        year: 2011,
        metadata: { original_year: 1973 },
      }),
    ).toBe(2011);
  });
});

describe("albumHeroYears", () => {
  it("shows the edition of a later release", () => {
    expect(
      albumHeroYears({
        media_type: MediaType.ALBUM,
        year: 2011,
        metadata: { original_year: 1973 },
      }),
    ).toEqual({ original: 1973, edition: 2011 });
  });

  it("shows one year when both are the same", () => {
    expect(
      albumHeroYears({
        media_type: MediaType.ALBUM,
        year: 1973,
        metadata: { original_year: 1973 },
      }),
    ).toEqual({ original: 1973 });
  });
});
