<template>
  <ItemsListing
    ref="listing"
    fill-height
    itemtype="albums"
    path="libraryseries"
    :show-provider="false"
    :show-favorites-only-filter="false"
    :load-paged-data="loadItems"
    :sort-listing="ListingType.LIBRARY_ALBUMS"
    library-toolbar
    :title="$t('series')"
    :allow-key-hooks="true"
    :show-search-button="true"
    :icon="LibraryBig"
    :restore-state="true"
    :extra-menu-items="menuItems"
    :empty-message="
      $t(showHidden ? 'hidden_series_empty' : 'series_list_empty')
    "
  />
</template>

<script setup lang="ts">
import ItemsListing, { LoadDataParams } from "@/components/ItemsListing.vue";
import type { ToolBarMenuItem } from "@/components/Toolbar.vue";
import api from "@/plugins/api";
import { authManager } from "@/plugins/auth";
import { AlbumSeriesType, ListingType, Scope } from "@/plugins/api/interfaces";
import { eventbus } from "@/plugins/eventbus";
import { EyeOff, LibraryBig, Plus, Tags } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({
  name: "Series",
});

const listing = ref<InstanceType<typeof ItemsListing>>();
// the series list shows the hidden series instead of the shown ones
const showHidden = ref(false);

const SERIES_TYPES = [
  AlbumSeriesType.ALBUM_SERIES,
  AlbumSeriesType.RANKED_LIST,
  AlbumSeriesType.PERSONAL,
];
// only the series of this type are listed, when one is picked
const seriesType = ref<AlbumSeriesType>();

const menuItems = computed<ToolBarMenuItem[]>(() => {
  const items: ToolBarMenuItem[] = [
    {
      label: "album_series_type",
      icon: Tags,
      active: !!seriesType.value,
      overflowAllowed: true,
      subItems: [undefined, ...SERIES_TYPES].map((type) => ({
        label: type ? `album_series_types.${type}` : "album_series_types.all",
        selected: seriesType.value === type,
        action: () => {
          seriesType.value = type;
          listing.value?.reload();
        },
      })),
    },
    {
      label: "show_hidden_series",
      icon: EyeOff,
      active: showHidden.value,
      overflowAllowed: true,
      action: () => {
        showHidden.value = !showHidden.value;
        listing.value?.reload();
      },
    },
  ];
  if (authManager.hasScope(Scope.LIBRARY_WRITE)) {
    items.unshift({
      label: "new_album_series",
      icon: Plus,
      action: () => eventbus.emit("albumSeriesDialog", { mode: "create" }),
    });
  }
  return items;
});

const reload = () => listing.value?.reload();

onMounted(() => {
  eventbus.on("albumSeriesHiddenChanged", reload);
  eventbus.on("albumSeriesChanged", reload);
});
onBeforeUnmount(() => {
  eventbus.off("albumSeriesHiddenChanged", reload);
  eventbus.off("albumSeriesChanged", reload);
});

const loadItems = async function (params: LoadDataParams) {
  return await api.getAlbumSeriesList(
    showHidden.value,
    params.search,
    params.limit,
    params.offset,
    params.sortField,
    params.sortDirection,
    params.randomSeed,
    seriesType.value,
  );
};
</script>
