import { describe, expect, it } from "vitest";

import {
  albumSeriesArtists,
  albumSeriesFacts,
  albumSeriesItemId,
  albumSeriesKind,
  albumSeriesLabel,
  albumSeriesRoute,
  isAlbumSeries,
  seriesSequenceOf,
} from "@/helpers/albumSeries";
import {
  AlbumSeriesSource,
  AlbumSeriesType,
  MediaType,
  type Album,
  type MediaCollection,
  type MediaItemType,
} from "@/plugins/api/interfaces";

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

describe("album series editing", () => {
  const series = (metadata: object) =>
    ({
      item_id: "album___Best of",
      media_type: MediaType.COLLECTION,
      name: "Best of",
      items: [],
      metadata,
    }) as unknown as MediaCollection<Album>;

  it("tells an album series from an audiobook collection", () => {
    expect(isAlbumSeries(series({}))).toBe(true);
    expect(
      isAlbumSeries({
        item_id: "audiobook___Saga",
        media_type: MediaType.COLLECTION,
      } as unknown as MediaItemType),
    ).toBe(false);
    expect(
      isAlbumSeries({
        item_id: "album___x",
        media_type: MediaType.ALBUM,
      } as unknown as MediaItemType),
    ).toBe(false);
  });

  it("finds the number of an album in a series", () => {
    const listed = {
      metadata: { collections: [{ title: "Best of", sequence: 3 }] },
    } as unknown as Album;
    expect(seriesSequenceOf(listed, "Best of")).toBe(3);
    expect(seriesSequenceOf(listed, "Other")).toBeNull();
  });

  it("describes the type, source and hidden albums of a series", () => {
    const kindLabels = {
      types: {
        [AlbumSeriesType.ALBUM_SERIES]: "Album series",
        [AlbumSeriesType.RANKED_LIST]: "Ranked list",
        [AlbumSeriesType.PERSONAL]: "Personal",
      },
      sources: {
        [AlbumSeriesSource.MUSICBRAINZ]: "MusicBrainz",
        [AlbumSeriesSource.CUSTOM]: "Custom",
      },
      hidden: (count: number) => `${count} hidden`,
    };
    expect(
      albumSeriesKind(
        series({
          series_type: AlbumSeriesType.RANKED_LIST,
          series_source: AlbumSeriesSource.MUSICBRAINZ,
          hidden_item_ids: ["1", "2"],
        }),
        kindLabels,
      ),
    ).toEqual(["Ranked list", "MusicBrainz", "2 hidden"]);
    expect(albumSeriesKind(series({}), kindLabels)).toEqual([]);
  });
});
