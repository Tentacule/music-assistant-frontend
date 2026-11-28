/**
 * Keeps the muted picture of a music video in step with the player that plays
 * its audio (fork).
 *
 * The player position is the reference: the video follows it by seeking when
 * it is far off, and by playing slightly faster or slower when it is close, so
 * the picture never jumps for a small drift.
 */

/** Seconds of drift above which the video seeks instead of changing its speed. */
export const SEEK_DRIFT = 0.3;
/** Seconds of drift below which the video plays at normal speed. */
export const IN_SYNC_DRIFT = 0.04;
/**
 * Seconds of drift above which a video that cannot seek by itself (a remuxed
 * file) is restarted from the player position. Larger than SEEK_DRIFT, as a
 * restart reloads the stream.
 */
export const RESTART_DRIFT = 2;
/** The most the playback rate moves away from 1 to catch up. */
export const MAX_RATE_CHANGE = 0.05;
/** Rate change per second of drift, below MAX_RATE_CHANGE. */
const RATE_PER_SECOND = 0.5;

export interface VideoSyncState {
  /** Where the player is in the item, in seconds. */
  playerPosition: number;
  /** Whether the player is playing. */
  playerPlaying: boolean;
  /** Where the video is, in seconds from the start of the item. */
  videoPosition: number;
  /** Whether the video can seek by itself (false for a remuxed file). */
  seekable: boolean;
}

export interface VideoSyncAction {
  /** Whether the video should be playing. */
  play: boolean;
  /** The playback rate the video should have. */
  playbackRate: number;
  /** Seek the video to this position, when set. */
  seekTo?: number;
  /** Reload a stream that cannot seek from this position, when set. */
  restartAt?: number;
}

/**
 * Return what the video has to do to follow the player.
 *
 * @param state - The positions and states of the player and the video.
 */
export function decideVideoSync(state: VideoSyncState): VideoSyncAction {
  const drift = state.playerPosition - state.videoPosition;
  const distance = Math.abs(drift);
  if (!state.playerPlaying) {
    // a paused player shows its frame: only a seekable video moves to it
    return state.seekable && distance > SEEK_DRIFT
      ? { play: false, playbackRate: 1, seekTo: state.playerPosition }
      : { play: false, playbackRate: 1 };
  }
  if (!state.seekable && distance > RESTART_DRIFT) {
    return { play: true, playbackRate: 1, restartAt: state.playerPosition };
  }
  if (state.seekable && distance > SEEK_DRIFT) {
    return { play: true, playbackRate: 1, seekTo: state.playerPosition };
  }
  if (distance <= IN_SYNC_DRIFT) {
    return { play: true, playbackRate: 1 };
  }
  const change = Math.min(MAX_RATE_CHANGE, distance * RATE_PER_SECOND);
  return { play: true, playbackRate: 1 + Math.sign(drift) * change };
}

/**
 * Return the URL that starts a remuxed music video at a position.
 *
 * @param url - The URL the server gave for the music video.
 * @param start - The position to start at, in seconds.
 */
export function remuxUrlAt(url: string, start: number): string {
  const separator = url.includes("?") ? "&" : "?";
  return start > 0 ? `${url}${separator}start=${start.toFixed(3)}` : url;
}
