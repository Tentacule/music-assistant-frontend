/**
 * Where the client reads the picture of a music video (fork).
 *
 * Asks the server for the video URL of a music video and asks again before the
 * URL expires, so a long session keeps a working source.
 */
import api from "@/plugins/api";
import type { MusicVideoPlaybackInfo } from "@/plugins/api/interfaces";
import { onBeforeUnmount, ref, watch, type Ref } from "vue";

/** Seconds before the expiry of a URL at which a new one is asked for. */
const RENEW_BEFORE_EXPIRY = 60;
const MS_PER_SECOND = 1000;

export interface MusicVideoRef {
  item_id: string;
  provider: string;
}

export function useMusicVideoSource(
  musicVideo: Ref<MusicVideoRef | undefined>,
) {
  const info = ref<MusicVideoPlaybackInfo>();
  const failed = ref(false);
  let renewTimer: ReturnType<typeof setTimeout> | undefined;
  let request = 0;

  const clearRenewTimer = () => {
    if (renewTimer !== undefined) clearTimeout(renewTimer);
    renewTimer = undefined;
  };

  const load = async (target: MusicVideoRef | undefined) => {
    const current = ++request;
    clearRenewTimer();
    info.value = undefined;
    failed.value = false;
    if (!target) return;
    try {
      const result = await api.getMusicVideoUrl(
        target.item_id,
        target.provider,
      );
      if (current !== request) return;
      info.value = result;
      const renewIn =
        (result.expires_at - RENEW_BEFORE_EXPIRY) * MS_PER_SECOND - Date.now();
      if (renewIn > 0) renewTimer = setTimeout(() => load(target), renewIn);
    } catch {
      // the picture is optional: without it the artwork stays on screen
      if (current === request) failed.value = true;
    }
  };

  watch(
    () =>
      musicVideo.value
        ? `${musicVideo.value.provider}/${musicVideo.value.item_id}`
        : "",
    () => load(musicVideo.value),
    { immediate: true },
  );
  onBeforeUnmount(() => {
    request++;
    clearRenewTimer();
  });

  return { info, failed };
}
