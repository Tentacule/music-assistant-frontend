import { displayYear } from "@/helpers/albumYear";
import {
  MediaType,
  type Album,
  type MediaItemCollection,
} from "@/plugins/api/interfaces";
import type { RouteLocationRaw } from "vue-router";

// the backend names a collection "<MediaType>___<collection title>"
const COLLECTION_ID_SEPARATOR = "___";

/** The collection id the server gives the album series with this title. */
export function albumSeriesItemId(title: string): string {
  return `${MediaType.ALBUM}${COLLECTION_ID_SEPARATOR}${title}`;
}

/** The series page of the album series with this title. */
export function albumSeriesRoute(title: string): RouteLocationRaw {
  return {
    name: "albumseries",
    params: { provider: "library", itemId: albumSeriesItemId(title) },
  };
}

/** "My Series #3", or just the title when the album has no number in it. */
export function albumSeriesLabel(collection: MediaItemCollection): string {
  const sequence = collection.sequence;
  return sequence !== undefined && sequence !== null && sequence !== ""
    ? `${collection.title} #${sequence}`
    : collection.title;
}

/** The artists of a series' albums, each named once, in album order. */
export function albumSeriesArtists(albums: Album[]): string[] {
  const names = new Set<string>();
  for (const album of albums) {
    for (const artist of album.artists ?? []) names.add(artist.name);
  }
  return [...names];
}

interface SeriesFactLabels {
  series: string;
  albums: (count: number) => string;
}

/** "Series · 5 albums · 1998–2011": the facts the series hero lists. */
export function albumSeriesFacts(
  albums: Album[],
  labels: SeriesFactLabels,
): string[] {
  const facts = [labels.series];
  if (albums.length) facts.push(labels.albums(albums.length));
  const years = albums
    .map((album) => displayYear(album))
    .filter((year): year is number => !!year);
  if (years.length) {
    const first = Math.min(...years);
    const last = Math.max(...years);
    facts.push(first === last ? String(first) : `${first}–${last}`);
  }
  return facts;
}
