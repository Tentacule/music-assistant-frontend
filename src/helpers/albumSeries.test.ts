import { describe, expect, it } from "vitest";

import {
  albumSeriesArtists,
  albumSeriesFacts,
  albumSeriesItemId,
  albumSeriesLabel,
  albumSeriesRoute,
} from "@/helpers/albumSeries";
import type { Album } from "@/plugins/api/interfaces";

const album = (name: string, year?: number, artists: string[] = []) =>
  ({
    name,
    year,
    artists: artists.map((artistName) => ({ name: artistName })),
  }) as unknown as Album;

const labels = {
  series: "Series",
  albums: (count: number) => `${count} albums`,
};

describe("albumSeries", () => {
  it("names the series the way the server does", () => {
    expect(albumSeriesItemId("My Saga")).toBe("album___My Saga");
    expect(albumSeriesRoute("My Saga")).toEqual({
      name: "albumseries",
      params: { provider: "library", itemId: "album___My Saga" },
    });
  });

  it("labels an album with its number in the series when it has one", () => {
    expect(albumSeriesLabel({ title: "Saga", sequence: 3 })).toBe("Saga #3");
    expect(albumSeriesLabel({ title: "Saga", sequence: "2b" })).toBe(
      "Saga #2b",
    );
    expect(albumSeriesLabel({ title: "Saga", sequence: null })).toBe("Saga");
    expect(albumSeriesLabel({ title: "Saga", sequence: "" })).toBe("Saga");
  });

  it("lists each artist once, in album order", () => {
    const albums = [
      album("One", 2001, ["B", "A"]),
      album("Two", 2003, ["A", "C"]),
    ];
    expect(albumSeriesArtists(albums)).toEqual(["B", "A", "C"]);
  });

  it("lists the album count and the years the series spans", () => {
    expect(
      albumSeriesFacts([album("One", 2003), album("Two", 1998)], labels),
    ).toEqual(["Series", "2 albums", "1998–2003"]);
    expect(albumSeriesFacts([album("One", 2003)], labels)).toEqual([
      "Series",
      "1 albums",
      "2003",
    ]);
    expect(albumSeriesFacts([album("One")], labels)).toEqual([
      "Series",
      "1 albums",
    ]);
    expect(albumSeriesFacts([], labels)).toEqual(["Series"]);
  });
});
