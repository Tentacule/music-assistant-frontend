import { describe, expect, it } from "vitest";
import {
  IN_SYNC_DRIFT,
  MAX_RATE_CHANGE,
  RESTART_DRIFT,
  SEEK_DRIFT,
  decideVideoSync,
  remuxUrlAt,
} from "./music_video_sync";

const playing = (videoPosition: number, seekable = true) =>
  decideVideoSync({
    playerPosition: 100,
    playerPlaying: true,
    videoPosition,
    seekable,
  });

describe("decideVideoSync", () => {
  it("plays at normal speed when the video is in step", () => {
    expect(playing(100 - IN_SYNC_DRIFT / 2)).toEqual({
      play: true,
      playbackRate: 1,
    });
  });

  it("speeds up a video slightly behind, slows down one slightly ahead", () => {
    const behind = playing(99.9);
    const ahead = playing(100.1);
    expect(behind.playbackRate).toBeGreaterThan(1);
    expect(ahead.playbackRate).toBeLessThan(1);
    expect(behind.seekTo).toBeUndefined();
    expect(Math.abs(behind.playbackRate - 1)).toBeLessThanOrEqual(
      MAX_RATE_CHANGE,
    );
  });

  it("seeks a video that is far off", () => {
    expect(playing(100 - SEEK_DRIFT - 1)).toEqual({
      play: true,
      playbackRate: 1,
      seekTo: 100,
    });
  });

  it("restarts a remuxed video only when it is far off", () => {
    expect(playing(100 - RESTART_DRIFT - 1, false).restartAt).toBe(100);
    const near = playing(100 - SEEK_DRIFT - 0.5, false);
    expect(near.restartAt).toBeUndefined();
    expect(near.seekTo).toBeUndefined();
    expect(near.playbackRate).toBeGreaterThan(1);
  });

  it("pauses with the player and shows its frame", () => {
    expect(
      decideVideoSync({
        playerPosition: 42,
        playerPlaying: false,
        videoPosition: 10,
        seekable: true,
      }),
    ).toEqual({ play: false, playbackRate: 1, seekTo: 42 });
    expect(
      decideVideoSync({
        playerPosition: 42,
        playerPlaying: false,
        videoPosition: 10,
        seekable: false,
      }),
    ).toEqual({ play: false, playbackRate: 1 });
  });
});

describe("remuxUrlAt", () => {
  it("adds the start position to the query", () => {
    expect(remuxUrlAt("http://ma/music_video/abc", 12.5)).toBe(
      "http://ma/music_video/abc?start=12.500",
    );
    expect(remuxUrlAt("http://ma/v?x=1", 3)).toBe(
      "http://ma/v?x=1&start=3.000",
    );
    expect(remuxUrlAt("http://ma/v", 0)).toBe("http://ma/v");
  });
});
