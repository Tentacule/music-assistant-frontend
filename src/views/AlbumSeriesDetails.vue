<template>
  <section>
    <AlbumSeriesHero :item="series" />
    <!-- the listing keeps its own toolbar, but takes the title and gutter of the hero above -->
    <ItemsListing
      :key="`${itemId}-${visibility}`"
      ref="listing"
      class="px-4 pt-3 max-md:px-1 max-md:pt-2 [&>.v-divider]:hidden"
      itemtype="albums"
      path="albumseries"
      :parent-item="series"
      :show-provider="false"
      :show-refresh-button="false"
      :load-paged-data="loadSeriesAlbums"
      :sort-listing="ListingType.ALBUM_SERIES"
      :title="$t('albums_in_series')"
      :empty-message="$t(emptyMessageKey)"
      :allow-collapse="false"
      :extra-menu-items="menuItems"
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
import type { ToolBarMenuItem } from "@/components/Toolbar.vue";
import type { LoadDataParams } from "@/composables/useItemsListing";
import { albumSeriesEditItems } from "@/layouts/default/albumSeriesMenuItems";
import { api } from "@/plugins/api";
import { authManager } from "@/plugins/auth";
import {
  ListingType,
  Scope,
  type Album,
  type AlbumVisibility,
  type MediaCollection,
  type MediaItemType,
} from "@/plugins/api/interfaces";
import { eventbus } from "@/plugins/eventbus";
import { $t } from "@/plugins/i18n";
import router from "@/plugins/router";
import { Eye } from "@lucide/vue";
import { toast } from "vue-sonner";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

export interface Props {
  itemId: string;
  provider: string;
}
const props = defineProps<Props>();

const VISIBILITIES: AlbumVisibility[] = ["visible", "hidden", "all"];

const listing = ref<InstanceType<typeof ItemsListing>>();
// the series in its own order, for the hero; the listing below sorts its copy
const series = ref<MediaCollection<Album>>();
// the albums in the series, those removed from it, or both
const visibility = ref<AlbumVisibility>("visible");

watch(
  () => props.itemId,
  () => {
    series.value = undefined;
    visibility.value = "visible";
  },
);

const emptyMessageKey = computed(() =>
  visibility.value === "hidden"
    ? "album_series_hidden_empty"
    : "album_series_empty",
);

const menuItems = computed<ToolBarMenuItem[]>(() => {
  const items: ToolBarMenuItem[] = [
    {
      label: "album_series_visibility",
      icon: Eye,
      active: visibility.value !== "visible",
      overflowAllowed: true,
      subItems: VISIBILITIES.map((value) => ({
        label: `album_series_visibilities.${value}`,
        selected: visibility.value === value,
        action: () => {
          visibility.value = value;
        },
      })),
    },
  ];
  if (series.value && authManager.hasScope(Scope.LIBRARY_WRITE)) {
    items.push(
      ...albumSeriesEditItems(series.value).map((item) => ({
        ...item,
        overflowAllowed: true,
      })),
    );
  }
  return items;
});

/** Fetch the series again for the hero, leaving the page when it is gone. */
const reloadSeries = async () => {
  const itemId = props.itemId;
  try {
    const whole = await api.getAlbumSeries(itemId);
    if (itemId !== props.itemId) return;
    series.value = whole;
    listing.value?.reload();
  } catch {
    router.replace({ name: "series" });
  }
};

onMounted(() => eventbus.on("albumSeriesChanged", reloadSeries));
onBeforeUnmount(() => eventbus.off("albumSeriesChanged", reloadSeries));

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
      visibility.value,
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
