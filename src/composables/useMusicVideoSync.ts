/**
 * Keeps the picture of a music video in step with the active player (fork).
 *
 * The player plays the audio; this applies `decideVideoSync` to the video
 * element a few times a second: speed, seek, pause, or a restart of a remuxed
 * stream that cannot seek by itself.
 */
import {
  resolveActiveTiming,
  toElapsedTime,
} from "@/helpers/activeElapsedTime";
import { decideVideoSync, remuxUrlAt } from "@/helpers/music_video_sync";
import {
  MusicVideoSourceKind,
  PlaybackState,
  type MusicVideoPlaybackInfo,
} from "@/plugins/api/interfaces";
import { onBeforeUnmount, ref, watch, type Ref } from "vue";

/** How often the video is brought back in step with the player, in ms. */
const SYNC_INTERVAL_MS = 250;

export interface MusicVideoSyncOptions {
  /** Whether the video follows the player. */
  enabled: Ref<boolean>;
  /** Points the video element at a URL. */
  attachSource: (url: string, kind: MusicVideoSourceKind) => Promise<void>;
}

export function useMusicVideoSync(
  video: Ref<HTMLVideoElement | undefined>,
  info: Ref<MusicVideoPlaybackInfo | undefined>,
  options: MusicVideoSyncOptions,
) {
  // where a remuxed stream started in the item: its currentTime counts from there
  const remuxStart = ref(0);
  let timer: ReturnType<typeof setInterval> | undefined;

  const restartRemux = (source: MusicVideoPlaybackInfo, position: number) => {
    remuxStart.value = position;
    void options.attachSource(remuxUrlAt(source.url, position), source.kind);
  };

  const tick = () => {
    const element = video.value;
    const source = info.value;
    if (!element || !source || !source.web_playable) return;
    const timing = resolveActiveTiming();
    const playerPosition = toElapsedTime(timing);
    if (!timing || playerPosition === undefined) return;
    const remux = source.kind === MusicVideoSourceKind.REMUX;
    if (remux && !element.currentSrc) {
      restartRemux(source, playerPosition);
      return;
    }
    const offset = remux ? remuxStart.value : 0;
    const action = decideVideoSync({
      playerPosition,
      playerPlaying:
        timing.playbackState === PlaybackState.PLAYING && !timing.positionHeld,
      videoPosition: offset + element.currentTime,
      seekable: source.seekable,
    });
    if (action.restartAt !== undefined) {
      restartRemux(source, action.restartAt);
      return;
    }
    if (
      action.seekTo !== undefined &&
      element.readyState >= HTMLMediaElement.HAVE_METADATA
    ) {
      element.currentTime = Math.max(0, action.seekTo - offset);
    }
    element.playbackRate = action.playbackRate;
    if (action.play && element.paused) {
      // a muted video may always play; a refused start is retried on the next tick
      element.play().catch(() => undefined);
    } else if (!action.play && !element.paused) {
      element.pause();
    }
  };

  const stop = () => {
    if (timer !== undefined) clearInterval(timer);
    timer = undefined;
  };

  watch(
    options.enabled,
    (enabled) => {
      stop();
      if (enabled) timer = setInterval(tick, SYNC_INTERVAL_MS);
    },
    { immediate: true },
  );
  onBeforeUnmount(stop);

  return { remuxStart };
}
