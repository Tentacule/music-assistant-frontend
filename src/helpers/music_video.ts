/** Helpers for the music videos of the fork. */
import type { MusicVideoRef } from "@/composables/useMusicVideoSource";
import { MediaType, type QueueItem } from "@/plugins/api/interfaces";

/**
 * The music video a queue item plays, or undefined when it plays something else.
 *
 * @param queueItem - The queue item, usually the current one.
 */
export function queueItemMusicVideo(
  queueItem?: QueueItem | null,
): MusicVideoRef | undefined {
  const mediaItem = queueItem?.media_item;
  if (mediaItem?.media_type !== MediaType.MUSIC_VIDEO) return undefined;
  return { item_id: mediaItem.item_id, provider: mediaItem.provider };
}
