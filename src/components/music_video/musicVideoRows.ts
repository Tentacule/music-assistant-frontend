// fork: the rows of a music video page
import {
  createRowRegistry,
  type RowDefinition,
} from "@/components/details/rowRegistry";
import type { MusicVideo } from "@/plugins/api/interfaces";

export type MusicVideoRowId =
  "preview" | "description" | "artist_music_videos" | "provider_mappings";

export const MUSIC_VIDEO_ROWS: readonly RowDefinition<MusicVideoRowId>[] = [
  { id: "preview", labelKey: "music_video_preview" },
  { id: "description", labelKey: "description" },
  { id: "artist_music_videos", labelKey: "music_videos_of_artist" },
  { id: "provider_mappings", labelKey: "source_details" },
];

export const MUSIC_VIDEO_ROWS_PREFERENCE_KEY = "music_video.rows";

/** Rows the music video page can show for this music video. */
export function availableMusicVideoRowIds(
  musicVideo: MusicVideo,
): MusicVideoRowId[] {
  const rows: MusicVideoRowId[] = ["preview"];
  if (musicVideo.metadata?.description) rows.push("description");
  if (musicVideo.artists.length) rows.push("artist_music_videos");
  rows.push("provider_mappings");
  return rows;
}

/** The music video page's rows and the user's customization of them. */
export const musicVideoRows = createRowRegistry<MusicVideoRowId, MusicVideo>({
  rows: MUSIC_VIDEO_ROWS,
  preferenceKey: MUSIC_VIDEO_ROWS_PREFERENCE_KEY,
});
