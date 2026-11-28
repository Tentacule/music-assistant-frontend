<template>
  <div class="relative flex h-full w-full items-center justify-center bg-black">
    <video
      v-show="showVideo"
      ref="videoElement"
      class="h-full w-full object-contain"
      muted
      playsinline
      :controls="!synced"
      :poster="poster"
      :aria-label="$t('music_video_player')"
      @error="playbackError = true"
    ></video>
    <img
      v-if="!showVideo && poster"
      :src="poster"
      class="h-full w-full object-contain"
      alt=""
    />
    <p
      v-if="unavailableMessage"
      class="absolute bottom-3 rounded bg-black/60 px-3 py-1 text-sm text-white"
    >
      {{ unavailableMessage }}
    </p>
  </div>
</template>

<script setup lang="ts">
// fork: the muted picture of a music video, in sync with the player when
// `synced` is set, or a plain muted preview with its own controls otherwise
import {
  useMusicVideoSource,
  type MusicVideoRef,
} from "@/composables/useMusicVideoSource";
import { useMusicVideoSync } from "@/composables/useMusicVideoSync";
import { MusicVideoSourceKind } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import type Hls from "hls.js";
import { computed, onBeforeUnmount, ref, toRef, watch } from "vue";

export interface Props {
  musicVideo?: MusicVideoRef;
  poster?: string;
  synced?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  musicVideo: undefined,
  poster: undefined,
  synced: false,
});

const HLS_MIME_TYPE = "application/vnd.apple.mpegurl";

const videoElement = ref<HTMLVideoElement>();
const playbackError = ref(false);
const { info, failed } = useMusicVideoSource(toRef(props, "musicVideo"));
let hls: Hls | undefined;

const showVideo = computed(
  () =>
    !!info.value &&
    info.value.web_playable &&
    !failed.value &&
    !playbackError.value,
);
const unavailableMessage = computed(() => {
  if (failed.value || playbackError.value) return $t("music_video_unavailable");
  if (info.value && !info.value.web_playable)
    return $t("music_video_codec_unsupported");
  return "";
});

const destroyHls = () => {
  hls?.destroy();
  hls = undefined;
};

/**
 * Point the video element at a URL. HLS goes through hls.js wherever it works: a browser
 * that claims native HLS (recent Chrome) may still fail on the MPEG-TS segments of a music
 * service. Native HLS is only the fallback, for Safari on iOS.
 */
const attachSource = async (url: string, kind: MusicVideoSourceKind) => {
  const video = videoElement.value;
  if (!video) return;
  destroyHls();
  playbackError.value = false;
  if (kind !== MusicVideoSourceKind.HLS) {
    video.src = url;
    return;
  }
  const { default: HlsPlayer } = await import("hls.js");
  if (!HlsPlayer.isSupported()) {
    if (video.canPlayType(HLS_MIME_TYPE)) video.src = url;
    else playbackError.value = true;
    return;
  }
  hls = new HlsPlayer();
  hls.on(HlsPlayer.Events.ERROR, (_event, data) => {
    if (data.fatal) playbackError.value = true;
  });
  hls.loadSource(url);
  hls.attachMedia(video);
};

const { remuxStart } = useMusicVideoSync(videoElement, info, {
  enabled: toRef(props, "synced"),
  attachSource,
});

watch(
  [info, videoElement],
  ([source, video]) => {
    if (!source || !video || !source.web_playable) return;
    // a synced remuxed file starts where the player is; the sync restarts it
    if (props.synced && source.kind === MusicVideoSourceKind.REMUX) return;
    remuxStart.value = 0;
    attachSource(source.url, source.kind);
  },
  { immediate: true },
);

onBeforeUnmount(destroyHls);
</script>
