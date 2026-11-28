<template>
  <ItemsListing
    fill-height
    itemtype="musicvideos"
    path="librarymusicvideos"
    :show-provider="false"
    :show-favorites-only-filter="true"
    :show-track-number="false"
    :load-paged-data="loadItems"
    :sort-listing="ListingType.LIBRARY_MUSIC_VIDEOS"
    library-toolbar
    :update-available="updateAvailable"
    :title="$t('music_videos')"
    :show-search-button="true"
    :allow-key-hooks="true"
    :icon="Clapperboard"
    :restore-state="true"
    :total="total"
    :show-provider-filter="true"
  />
</template>

<script setup lang="ts">
// fork: the music videos of the library
import ItemsListing, { LoadDataParams } from "@/components/ItemsListing.vue";
import { onLibrarySyncCompleted } from "@/composables/useLibrarySync";
import { useListingTotal } from "@/composables/useListingTotal";
import api from "@/plugins/api";
import {
  EventMessage,
  EventType,
  ListingType,
  MediaType,
} from "@/plugins/api/interfaces";
import { Clapperboard } from "@lucide/vue";
import { onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({
  name: "MusicVideos",
});

const updateAvailable = ref<boolean>(false);
const { total, setTotal, loadTotal } = useListingTotal();

onMounted(() => {
  const unsub = api.subscribe(
    EventType.MEDIA_ITEM_ADDED,
    (evt: EventMessage) => {
      if (evt.object_id?.startsWith("library://music_video")) {
        updateAvailable.value = true;
      }
    },
  );
  onBeforeUnmount(unsub);
  // per-item add events are suppressed during provider library syncs
  const unsubSync = onLibrarySyncCompleted(MediaType.MUSIC_VIDEO, () => {
    updateAvailable.value = true;
  });
  onBeforeUnmount(unsubSync);
});

const loadItems = async function (params: LoadDataParams) {
  updateAvailable.value = false;
  if (!params.offset) setTotals(params);
  return await api.getLibraryMusicVideos(
    params.favoritesOnly || undefined,
    params.search,
    params.limit,
    params.offset,
    params.sortField,
    params.sortDirection,
    params.provider && params.provider.length > 0 ? params.provider : undefined,
    params.randomSeed,
  );
};

const setTotals = async function (params: LoadDataParams) {
  // a provider filter has no count endpoint: the results give the total
  if (params.provider && params.provider.length > 0) {
    setTotal(undefined);
    return;
  }
  await loadTotal(
    api.getLibraryMusicVideosCount(params.favoritesOnly || false),
  );
};
</script>
