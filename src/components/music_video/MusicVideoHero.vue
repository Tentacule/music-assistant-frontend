<template>
  <DetailHero
    :item="item"
    :backdrop="backdrop.url"
    :blur-backdrop="backdrop.blurred"
    @edit-rows="emit('edit-rows')"
  >
    <template #toolbar-append>
      <DetailHeroFavorite v-if="item" :item="item" />
    </template>

    <template v-if="item" #cover>
      <DetailHeroCover :item="item" />
    </template>

    <template v-if="item" #meta>
      <DetailHeroMetaLine v-if="item.artists.length" :icon="Music">
        <template v-for="(artist, index) in item.artists" :key="artist.uri">
          <span v-if="index > 0">,&nbsp;</span>
          <DetailHeroLink @click="gotoItem('artist', artist)">
            {{ artist.name }}
          </DetailHeroLink>
        </template>
      </DetailHeroMetaLine>
      <DetailHeroFacts :icon="Music2" :facts="trackFacts">
        <template v-if="item.track" #lead>
          <DetailHeroLink @click="gotoItem('track', item.track)">
            {{ item.track.name }}
          </DetailHeroLink>
        </template>
      </DetailHeroFacts>
    </template>

    <template v-if="item" #actions>
      <DetailHeroPlayButton :item="item" />
      <DetailHeroSourceBadge :item="item" />
    </template>

    <template v-if="item" #aside>
      <DetailHeroGenres :item="item" />
      <DetailHeroProviders :item="item" />
    </template>
  </DetailHero>
</template>

<script setup lang="ts">
// fork: the hero of a music video page
import DetailHero from "@/components/details/DetailHero.vue";
import DetailHeroCover from "@/components/details/DetailHeroCover.vue";
import DetailHeroFacts from "@/components/details/DetailHeroFacts.vue";
import DetailHeroFavorite from "@/components/details/DetailHeroFavorite.vue";
import DetailHeroGenres from "@/components/details/DetailHeroGenres.vue";
import DetailHeroLink from "@/components/details/DetailHeroLink.vue";
import DetailHeroMetaLine from "@/components/details/DetailHeroMetaLine.vue";
import DetailHeroPlayButton from "@/components/details/DetailHeroPlayButton.vue";
import DetailHeroProviders from "@/components/details/DetailHeroProviders.vue";
import DetailHeroSourceBadge from "@/components/details/DetailHeroSourceBadge.vue";
import { heroBackdrop, type HeroBackdrop } from "@/helpers/hero_backdrop";
import { formatDuration } from "@/helpers/utils";
import type { MusicVideo } from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { Music, Music2 } from "@lucide/vue";
import { computed } from "vue";
import { useRouter } from "vue-router";

export interface Props {
  item?: MusicVideo;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "edit-rows"): void;
}>();

const router = useRouter();

const backdrop = computed<HeroBackdrop>(() =>
  props.item ? heroBackdrop(props.item) : { blurred: false },
);

// "4:05" after the linked track, or "No linked track · 4:05"
const trackFacts = computed(() => {
  const video = props.item;
  if (!video) return [];
  const parts: string[] = [];
  if (!video.track) parts.push($t("music_video_no_track"));
  if (video.duration) parts.push(formatDuration(video.duration));
  return parts;
});

const gotoItem = function (
  name: "artist" | "track",
  target: { item_id: string; provider: string },
) {
  router.push({
    name,
    params: { itemId: target.item_id, provider: target.provider },
  });
};
</script>
