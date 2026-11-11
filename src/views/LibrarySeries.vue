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
import { ListingType } from "@/plugins/api/interfaces";
import { eventbus } from "@/plugins/eventbus";
import { EyeOff, LibraryBig } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

defineOptions({
  name: "Series",
});

const listing = ref<InstanceType<typeof ItemsListing>>();
// the series list shows the hidden series instead of the shown ones
const showHidden = ref(false);

const menuItems = computed<ToolBarMenuItem[]>(() => [
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
]);

const reload = () => listing.value?.reload();

onMounted(() => eventbus.on("albumSeriesHiddenChanged", reload));
onBeforeUnmount(() => eventbus.off("albumSeriesHiddenChanged", reload));

const loadItems = async function (params: LoadDataParams) {
  return await api.getAlbumSeriesList(
    showHidden.value,
    params.search,
    params.limit,
    params.offset,
    params.sortField,
    params.sortDirection,
    params.randomSeed,
  );
};
</script>
