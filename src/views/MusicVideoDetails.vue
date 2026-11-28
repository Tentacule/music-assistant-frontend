<template>
  <section class="music-video-details">
    <MusicVideoHero :item="itemDetails" @edit-rows="rowsEditorOpen = true" />

    <template v-if="itemDetails">
      <template v-for="rowId in visibleRows" :key="rowId">
        <div
          v-if="rowId === 'preview'"
          class="mx-auto my-4 aspect-video w-full max-w-4xl overflow-hidden rounded-lg"
        >
          <MusicVideoPlayer :music-video="itemDetails" :poster="poster" />
        </div>

        <DetailTextRow
          v-else-if="rowId === 'description' && description"
          :title="$t('description')"
          :text="description"
          :dialog-title="itemDetails.name"
          @edit-rows="rowsEditorOpen = true"
        />

        <ItemsListing
          v-else-if="rowId === 'artist_music_videos'"
          itemtype="artistmusicvideos"
          :parent-item="itemDetails"
          :show-provider="true"
          :show-favorites-only-filter="false"
          :show-track-number="false"
          :show-count="false"
          detail-row
          :load-paged-data="loadArtistMusicVideos"
          :title="$t('music_videos_of_artist')"
          :hide-on-empty="true"
        />

        <DetailAdminCard v-else-if="rowId === 'provider_mappings'">
          <ProviderDetails :item-details="itemDetails" />
        </DetailAdminCard>
      </template>
    </template>

    <RowsEditor
      v-if="itemDetails"
      v-model:open="rowsEditorOpen"
      :item="itemDetails"
      :registry="musicVideoRows"
      :available-ids="availableRows"
      :subtitle="$t('edit_rows_subtitle_music_video')"
    />
    <br />
  </section>
</template>

<script setup lang="ts">
// fork: the page of a music video
import DetailAdminCard from "@/components/details/DetailAdminCard.vue";
import DetailTextRow from "@/components/details/DetailTextRow.vue";
import RowsEditor from "@/components/details/RowsEditor.vue";
import ItemsListing, {
  type LoadDataParams,
} from "@/components/ItemsListing.vue";
import MusicVideoHero from "@/components/music_video/MusicVideoHero.vue";
import MusicVideoPlayer from "@/components/music_video/MusicVideoPlayer.vue";
import {
  availableMusicVideoRowIds,
  musicVideoRows,
} from "@/components/music_video/musicVideoRows";
import ProviderDetails from "@/components/ProviderDetails.vue";
import { useDetailItemUpdates } from "@/composables/useDetailItemUpdates";
import { getImageThumbForItem } from "@/helpers/utils";
import { api } from "@/plugins/api";
import { MediaType, type MusicVideo } from "@/plugins/api/interfaces";
import { computed, ref, watch } from "vue";

export interface Props {
  itemId: string;
  provider: string;
}
const props = defineProps<Props>();
const itemDetails = ref<MusicVideo>();
const rowsEditorOpen = ref(false);

const availableRows = computed(() =>
  itemDetails.value ? availableMusicVideoRowIds(itemDetails.value) : [],
);
const visibleRows = computed(() => {
  const { order, hidden } = musicVideoRows.resolve(availableRows.value);
  return order.filter((rowId) => !hidden.has(rowId));
});
const description = computed(() => itemDetails.value?.metadata?.description);
const poster = computed(() =>
  itemDetails.value ? getImageThumbForItem(itemDetails.value) : undefined,
);

const loadItemDetails = async function () {
  const { itemId, provider } = props;
  itemDetails.value = undefined;
  rowsEditorOpen.value = false;
  const musicVideo = await api.getMusicVideo(itemId, provider);
  if (itemId !== props.itemId || provider !== props.provider) return;
  itemDetails.value = musicVideo;
};

watch(
  () => [props.itemId, props.provider],
  ([itemId]) => {
    if (itemId) loadItemDetails();
  },
  { immediate: true },
);

useDetailItemUpdates(itemDetails, {
  get providerItem() {
    return { ...props, mediaType: MediaType.MUSIC_VIDEO };
  },
});

// the other music videos of the first artist, capped by the server: one page
const loadArtistMusicVideos = async function (params: LoadDataParams) {
  const video = itemDetails.value;
  const artist = video?.artists[0];
  if (!video || !artist || params.offset) return [];
  const videos = await api.getArtistMusicVideos(
    artist.item_id,
    artist.provider,
  );
  return videos.filter((other) => other.uri !== video.uri);
};
</script>
