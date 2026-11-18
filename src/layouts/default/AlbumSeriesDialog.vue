<!--
  Global dialog to edit the album series: create a series of one's own, add an
  album to a series (or give it a new number there) and change a series' type.
  Opened from various places, so its visibility is steered through the eventbus.
-->
<template>
  <Dialog :key="dialogKey" v-model:open="showDialog">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle class="mb-2">{{ $t(titleKey) }}</DialogTitle>
        <DialogDescription v-if="album">{{ album.name }}</DialogDescription>
        <DialogDescription v-else-if="series">
          {{ series.name }}
        </DialogDescription>
        <DialogDescription v-else class="sr-only">
          {{ $t(titleKey) }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-4">
        <!-- the series to add the album to, or a new one -->
        <div v-if="mode === 'add'" class="flex flex-col gap-2">
          <Label for="album-series-pick">{{ $t("album_series") }}</Label>
          <NativeSelect
            id="album-series-pick"
            v-model="pickedSeriesId"
            class="w-full"
          >
            <NativeSelectOption :value="NEW_SERIES">
              {{ $t("new_album_series") }}
            </NativeSelectOption>
            <NativeSelectOption
              v-for="option in seriesOptions"
              :key="option.item_id"
              :value="option.item_id"
            >
              {{ option.name }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <template v-if="createsSeries">
          <div class="flex flex-col gap-2">
            <Label for="album-series-name">{{ $t("album_series_name") }}</Label>
            <Input
              id="album-series-name"
              ref="nameInput"
              v-model="seriesName"
              @keyup.enter="doSave"
            />
          </div>
        </template>

        <div
          v-if="createsSeries || mode === 'type'"
          class="flex flex-col gap-2"
        >
          <Label for="album-series-type">{{ $t("album_series_type") }}</Label>
          <NativeSelect
            id="album-series-type"
            v-model="seriesType"
            class="w-full"
          >
            <NativeSelectOption
              v-for="type in SERIES_TYPES"
              :key="type"
              :value="type"
            >
              {{ $t(`album_series_types.${type}`) }}
            </NativeSelectOption>
          </NativeSelect>
        </div>

        <div
          v-if="mode === 'add' || mode === 'sequence'"
          class="flex flex-col gap-2"
        >
          <Label for="album-series-sequence">
            {{ $t("album_series_sequence") }}
          </Label>
          <Input
            id="album-series-sequence"
            ref="sequenceInput"
            v-model="sequence"
            :placeholder="$t('album_series_sequence_hint')"
            @keyup.enter="doSave"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="showDialog = false">
          {{ $t("close") }}
        </Button>
        <Button :disabled="!canSave || saving" @click="doSave">
          {{ $t("settings.save") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from "vue";
import { toast } from "vue-sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import api from "@/plugins/api";
import {
  AlbumSeriesType,
  type Album,
  type MediaCollection,
} from "@/plugins/api/interfaces";
import { type AlbumSeriesDialogEvent, eventbus } from "@/plugins/eventbus";
import { $t } from "@/plugins/i18n";
import { store } from "@/plugins/store";

const NEW_SERIES = "";
const SERIES_TYPES = [
  AlbumSeriesType.ALBUM_SERIES,
  AlbumSeriesType.RANKED_LIST,
  AlbumSeriesType.PERSONAL,
];

const showDialog = ref(false);
// force Dialog remount via dynamic key to prevent the enter animation from
// stalling at opacity:0 when opened from a context menu
const dialogKey = ref(0);
const saving = ref(false);
const mode = ref<AlbumSeriesDialogEvent["mode"]>("create");
const album = ref<Album>();
const series = ref<MediaCollection<Album>>();
const seriesOptions = ref<MediaCollection<Album>[]>([]);
const pickedSeriesId = ref(NEW_SERIES);
const seriesName = ref("");
const seriesType = ref(AlbumSeriesType.PERSONAL);
const sequence = ref("");
const nameInput = ref();
const sequenceInput = ref();

const createsSeries = computed(
  () =>
    mode.value === "create" ||
    (mode.value === "add" && pickedSeriesId.value === NEW_SERIES),
);

const titleKey = computed(
  () =>
    ({
      create: "new_album_series",
      add: "add_to_album_series",
      sequence: "edit_album_series_sequence",
      type: "edit_album_series_type",
    })[mode.value],
);

const canSave = computed(
  () => !createsSeries.value || !!seriesName.value.trim(),
);

watch(showDialog, (open) => {
  store.dialogActive = open;
  if (open) {
    nextTick(() => {
      (createsSeries.value ? nameInput : sequenceInput).value?.focus?.();
    });
  }
});

const onOpen = async (evt: AlbumSeriesDialogEvent) => {
  mode.value = evt.mode;
  album.value = evt.album;
  series.value = evt.series;
  seriesName.value = "";
  seriesType.value =
    evt.series?.metadata.series_type ?? AlbumSeriesType.PERSONAL;
  sequence.value = evt.sequence != null ? String(evt.sequence) : "";
  pickedSeriesId.value = NEW_SERIES;
  seriesOptions.value = [];
  if (evt.mode === "add") {
    // the series the album is in already are left out: their number is edited
    // from the series itself
    const current = new Set(
      (evt.album?.metadata.collections ?? []).map((entry) => entry.title),
    );
    const [shown, hidden] = await Promise.all([
      api.getAlbumSeriesList(false, undefined, 0).catch(() => []),
      api.getAlbumSeriesList(true, undefined, 0).catch(() => []),
    ]);
    seriesOptions.value = [...shown, ...hidden]
      .filter((option) => !current.has(option.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    const own = seriesOptions.value.find(
      (option) => option.metadata.series_source === "custom",
    );
    if (own) pickedSeriesId.value = own.item_id;
  }
  dialogKey.value++;
  showDialog.value = true;
};

const doSave = async () => {
  if (!canSave.value || saving.value) return;
  saving.value = true;
  try {
    let seriesId =
      mode.value === "add" ? pickedSeriesId.value : series.value?.item_id;
    if (createsSeries.value) {
      const created = await api.createAlbumSeries(
        seriesName.value.trim(),
        seriesType.value,
      );
      seriesId = created.item_id;
    }
    if (mode.value === "type" && seriesId) {
      await api.setAlbumSeriesType(seriesId, seriesType.value);
    }
    if (
      (mode.value === "add" || mode.value === "sequence") &&
      seriesId &&
      album.value
    ) {
      await api.addAlbumToSeries(seriesId, album.value.item_id, sequence.value);
    }
    toast.success(
      $t(
        mode.value === "create" ? "album_series_created" : "album_series_saved",
      ),
    );
    eventbus.emit("albumSeriesChanged");
    showDialog.value = false;
  } catch (err) {
    toast.error(
      $t("album_series_save_failed", [
        err instanceof Error ? err.message : String(err),
      ]),
    );
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  eventbus.on("albumSeriesDialog", onOpen);
});
onBeforeUnmount(() => {
  eventbus.off("albumSeriesDialog", onOpen);
});
</script>
