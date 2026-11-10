<template>
  <nav
    v-if="series.length"
    class="flex flex-wrap items-center gap-2 px-7 pt-4 max-md:px-4 max-md:pt-3"
    :aria-label="$t('album_series')"
  >
    <span class="text-sm font-semibold text-muted-foreground">
      {{ $t("album_series") }}
    </span>
    <Badge
      v-for="entry in series"
      :key="entry.title"
      as-child
      variant="secondary"
      class="px-3 py-1 text-[13px]"
    >
      <RouterLink :to="entry.route">
        <LibraryBig />
        {{ entry.label }}
      </RouterLink>
    </Badge>
  </nav>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { albumSeriesLabel, albumSeriesRoute } from "@/helpers/albumSeries";
import type { Album } from "@/plugins/api/interfaces";
import { LibraryBig } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";

export interface Props {
  album: Album;
}
const props = defineProps<Props>();

// one link per series the album is part of: "My Series #3"
const series = computed(() =>
  (props.album.metadata?.collections ?? []).map((collection) => ({
    title: collection.title,
    label: albumSeriesLabel(collection),
    route: albumSeriesRoute(collection.title),
  })),
);
</script>
