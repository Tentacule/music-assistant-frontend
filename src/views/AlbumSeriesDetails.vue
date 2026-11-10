<template>
  <section>
    <AlbumSeriesHero :item="series" />
    <!-- the listing keeps its own toolbar, but takes the title and gutter of the hero above -->
    <ItemsListing
      :key="itemId"
      class="px-4 pt-3 max-md:px-1 max-md:pt-2 [&>.v-divider]:hidden"
      itemtype="albums"
      path="albumseries"
      :parent-item="series"
      :show-provider="false"
      :show-refresh-button="false"
      :load-paged-data="loadSeriesAlbums"
      :sort-listing="ListingType.ALBUM_SERIES"
      :title="$t('albums_in_series')"
      :empty-message="$t('album_series_empty')"
      :allow-collapse="false"
    >
      <template #title>
        <span
          class="text-[22px] font-bold tracking-[-0.4px] max-md:text-[19px]"
        >
          {{ $t("albums_in_series") }}
        </span>
      </template>
    </ItemsListing>
  </section>
</template>

<script setup lang="ts">
import AlbumSeriesHero from "@/components/album/AlbumSeriesHero.vue";
import ItemsListing from "@/components/ItemsListing.vue";
import type { LoadDataParams } from "@/composables/useItemsListing";
import { api } from "@/plugins/api";
import {
  ListingType,
  type Album,
  type MediaCollection,
  type MediaItemType,
} from "@/plugins/api/interfaces";
import { $t } from "@/plugins/i18n";
import { toast } from "vue-sonner";
import { ref, watch } from "vue";

export interface Props {
  itemId: string;
  provider: string;
}
const props = defineProps<Props>();

// the series in its own order, for the hero; the listing below sorts its copy
const series = ref<MediaCollection<Album>>();

watch(
  () => props.itemId,
  () => {
    series.value = undefined;
  },
);

/** The series' albums in the order picked, searched and paged here. */
const loadSeriesAlbums = async (
  params: LoadDataParams,
): Promise<MediaItemType[]> => {
  const itemId = props.itemId;
  try {
    if (!series.value) {
      const whole = await api.getAlbumSeries(itemId);
      if (itemId !== props.itemId) return [];
      series.value = whole;
    }
    const sorted = await api.getAlbumSeries(
      itemId,
      params.sortField,
      params.sortDirection,
    );
    const search = params.search?.toLowerCase();
    const albums = search
      ? sorted.items.filter((album) =>
          album.name.toLowerCase().includes(search),
        )
      : sorted.items;
    return albums.slice(params.offset, params.offset + params.limit);
  } catch {
    toast.error($t("album_series_load_error"));
    return [];
  }
};
</script>
