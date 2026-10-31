<template>
  <section>
    <CollectionHero :item="heroCollection" />
    <!-- the listing keeps its own toolbar, but takes the title and gutter of the hero above -->
    <ItemsListing
      :key="`${provider}:${itemId}`"
      class="px-4 pt-3 max-md:px-1 max-md:pt-2 [&>.v-divider]:hidden"
      :itemtype="collectionMediaType"
      :parent-item="itemDetails"
      :show-refresh-button="false"
      :load-paged-data="loadCollectionItems"
      :title="title"
      :empty-message="emptyMessage"
      :allow-collapse="false"
    >
      <template #title>
        <span
          class="text-[22px] font-bold tracking-[-0.4px] max-md:text-[19px]"
        >
          {{ title }}
        </span>
      </template>
    </ItemsListing>
  </section>
</template>

<script setup lang="ts">
import CollectionHero from "@/components/collection/CollectionHero.vue";
import ItemsListing from "@/components/ItemsListing.vue";
import { useCollectionDetails } from "@/composables/useCollectionDetails";
import {
  MediaType,
  type Album,
  type Audiobook,
  type MediaCollection,
} from "@/plugins/api/interfaces";
import { computed } from "vue";
import { $t } from "@/plugins/i18n";

export interface Props {
  itemId: string;
  provider: string;
}
const props = defineProps<Props>();
const { itemDetails, collectionMediaType, loadCollectionItems } =
  useCollectionDetails(() => props);

const heroCollection = computed(() => {
  switch (collectionMediaType.value) {
    case MediaType.AUDIOBOOK:
      return itemDetails.value as MediaCollection<Audiobook> | undefined;
    case MediaType.ALBUM:
      return itemDetails.value as MediaCollection<Album> | undefined;
    default:
      return undefined;
  }
});

const title = computed(() => {
  if (collectionMediaType.value === MediaType.AUDIOBOOK) {
    return $t("audiobooks_in_collection");
  }
  if (collectionMediaType.value === MediaType.ALBUM) {
    return $t("albums_in_series");
  }
  return "";
});

const emptyMessage = computed(() => {
  if (collectionMediaType.value === MediaType.AUDIOBOOK) {
    return $t("collection_no_audiobooks");
  }
  if (collectionMediaType.value === MediaType.ALBUM) {
    return $t("series_no_albums");
  }
  return "";
});
</script>
