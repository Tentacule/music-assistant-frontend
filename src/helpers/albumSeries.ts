import { displayYear } from "@/helpers/albumYear";
import {
  AlbumSeriesSource,
  AlbumSeriesType,
  MediaType,
  type Album,
  type MediaCollection,
  type MediaItemCollection,
  type MediaItemTypeOrItemMapping,
} from "@/plugins/api/interfaces";
import type { RouteLocationRaw } from "vue-router";

// the backend names a collection "<MediaType>___<collection title>"
const COLLECTION_ID_SEPARATOR = "___";

/** The collection id the server gives the album series with this title. */
export function albumSeriesItemId(title: string): string {
  return `${MediaType.ALBUM}${COLLECTION_ID_SEPARATOR}${title}`;
}

/** Whether an item is an album series (and not an audiobook collection). */
export function isAlbumSeries(
  item: MediaItemTypeOrItemMapping,
): item is MediaCollection<Album> {
  return (
    item.media_type === MediaType.COLLECTION &&
    item.item_id.startsWith(`${MediaType.ALBUM}${COLLECTION_ID_SEPARATOR}`)
  );
}

/** The number of an album in the series with this title, if it has one. */
export function seriesSequenceOf(
  album: Album,
  title: string,
): number | string | null {
  const entry = album.metadata.collections?.find(
    (collection) => collection.title === title,
  );
  return entry?.sequence ?? null;
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

interface SeriesKindLabels {
  types: Record<AlbumSeriesType, string>;
  sources: Record<AlbumSeriesSource, string>;
  hidden: (count: number) => string;
}

/** "Ranked list · MusicBrainz · 2 hidden": what kind of series it is. */
export function albumSeriesKind(
  series: MediaCollection<Album>,
  labels: SeriesKindLabels,
): string[] {
  const facts: string[] = [];
  const { series_type, series_source, hidden_item_ids } = series.metadata;
  if (series_type) facts.push(labels.types[series_type]);
  if (series_source) facts.push(labels.sources[series_source]);
  if (hidden_item_ids?.length)
    facts.push(labels.hidden(hidden_item_ids.length));
  return facts;
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
