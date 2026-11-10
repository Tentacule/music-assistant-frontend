<template>
  <DetailHero
    :item="item"
    :backdrop="backdrop"
    blur-backdrop
    :height="400"
    :phone-height="360"
    :editable-rows="false"
  >
    <template v-if="item" #main>
      <div
        class="flex w-full min-w-0 items-end gap-6 max-md:flex-col max-md:items-stretch max-md:gap-3"
      >
        <div class="detail-hero-cover flex-none">
          <MediaCollectionThumb
            :item="item"
            :size="`${coverSize}px`"
            :thumb-offset="coverSize * STACK_OFFSET_RATIO"
          />
        </div>

        <div class="flex min-w-0 flex-1 flex-col gap-2.5 pb-1">
          <h1
            class="m-0 line-clamp-2 text-[44px] leading-[1.2] font-medium tracking-[-1.1px] [text-shadow:0_2px_12px_rgba(0,0,0,0.5)] max-md:text-[30px] max-md:tracking-[-0.7px]"
          >
            {{ item.name }}
          </h1>

          <div
            class="flex flex-col gap-1 text-[15px] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.5)] max-md:text-sm"
          >
            <div
              v-if="artists.length"
              class="flex min-w-0 items-center gap-2"
              :title="$t('artists')"
            >
              <Music :size="16" class="flex-none" />
              <span class="min-w-0 truncate">{{ artists.join(" / ") }}</span>
            </div>
            <DetailHeroFacts :icon="LibraryBig" :facts="facts" />
          </div>

          <div class="flex min-w-0 items-center">
            <DetailHeroPlayButton :item="item" />
          </div>
        </div>
      </div>
    </template>
  </DetailHero>
</template>

<script setup lang="ts">
import DetailHero from "@/components/details/DetailHero.vue";
import DetailHeroFacts from "@/components/details/DetailHeroFacts.vue";
import DetailHeroPlayButton from "@/components/details/DetailHeroPlayButton.vue";
import MediaCollectionThumb from "@/components/MediaCollectionThumb.vue";
import { albumSeriesFacts, albumSeriesArtists } from "@/helpers/albumSeries";
import { getImageThumbForItem } from "@/helpers/utils";
import {
  ImageType,
  type Album,
  type MediaCollection,
} from "@/plugins/api/interfaces";
import { isPhoneSizedScreen } from "@/plugins/breakpoint";
import { $t } from "@/plugins/i18n";
import { LibraryBig, Music } from "@lucide/vue";
import { computed } from "vue";

export interface Props {
  item?: MediaCollection<Album>;
}
const props = defineProps<Props>();

// keeps the stacked covers inside the cover's square at any size
const STACK_OFFSET_RATIO = 0.095;

const coverSize = computed(() => (isPhoneSizedScreen() ? 132 : 200));

// a series has no artwork of its own, so the first album cover is blurred
// behind the hero
const backdrop = computed(() => {
  const album = props.item?.items.find((item) =>
    getImageThumbForItem(item, ImageType.THUMB),
  );
  return getImageThumbForItem(album, ImageType.THUMB);
});

const artists = computed(() =>
  props.item ? albumSeriesArtists(props.item.items) : [],
);

// "Series · 5 albums · 1998–2011", without whatever is unknown
const facts = computed(() =>
  albumSeriesFacts(props.item?.items ?? [], {
    series: $t("series"),
    albums: (count) => $t("n_albums", count, { named: { count } }),
  }),
);
</script>
