import { MediaType } from "@/plugins/api/interfaces";

/** The fields an item may carry for its year, whatever its type. */
interface YearItem {
  media_type?: MediaType;
  year?: number | null;
  metadata?: { original_year?: number | null } | null;
}

/**
 * The year shown for an item: an album shows the first release of the album (all editions),
 * else the year of its edition. Every other item shows its own year.
 */
export function displayYear(item: YearItem): number | undefined {
  const original =
    item.media_type === MediaType.ALBUM
      ? item.metadata?.original_year
      : undefined;
  return original || item.year || undefined;
}

/**
 * The years an album page shows: the first release, and the year of the edition when it is
 * a later one.
 */
export function albumHeroYears(item: YearItem): {
  original?: number;
  edition?: number;
} {
  const original = displayYear(item);
  const edition = item.year || undefined;
  return edition && original && edition !== original
    ? { original, edition }
    : { original };
}
