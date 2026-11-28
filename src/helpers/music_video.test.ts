import { describe, expect, it } from "vitest";
import { MediaType, type QueueItem } from "@/plugins/api/interfaces";
import { queueItemMusicVideo } from "./music_video";

const queueItem = (mediaType: MediaType) =>
  ({
    queue_item_id: "q1",
    media_item: { item_id: "7", provider: "library", media_type: mediaType },
  }) as unknown as QueueItem;

describe("queueItemMusicVideo", () => {
  it("returns the music video a queue item plays", () => {
    expect(queueItemMusicVideo(queueItem(MediaType.MUSIC_VIDEO))).toEqual({
      item_id: "7",
      provider: "library",
    });
  });

  it("returns nothing for a track or no item", () => {
    expect(queueItemMusicVideo(queueItem(MediaType.TRACK))).toBeUndefined();
    expect(queueItemMusicVideo(undefined)).toBeUndefined();
  });
});
