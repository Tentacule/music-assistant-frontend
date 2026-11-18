import type { ContextMenuItem } from "@/helpers/context_menu_item";
import { isAlbumSeries, seriesSequenceOf } from "@/helpers/albumSeries";
import api from "@/plugins/api";
import {
  AlbumSeriesSource,
  MediaType,
  type Album,
  type MediaCollection,
  type MediaItemType,
  type MediaItemTypeOrItemMapping,
} from "@/plugins/api/interfaces";
import { eventbus } from "@/plugins/eventbus";
import { $t } from "@/plugins/i18n";
import { Hash, ListPlus, ListX, Tags, Trash2, Undo2 } from "@lucide/vue";
import { toast } from "vue-sonner";

/** Run a series edit, then toast how it went and tell the views to reload. */
const runSeriesEdit = async (
  edit: () => Promise<void>,
  doneKey: string,
): Promise<void> => {
  try {
    await edit();
    toast.success($t(doneKey));
    eventbus.emit("albumSeriesChanged");
  } catch (err) {
    toast.error(
      $t("album_series_save_failed", [
        err instanceof Error ? err.message : String(err),
      ]),
    );
  }
};

/** The entries of a library album listed in a series: renumber, remove or restore. */
const albumInSeriesItems = (
  album: Album,
  series: MediaCollection<Album>,
): ContextMenuItem[] => {
  const hidden = (series.metadata.hidden_item_ids ?? []).includes(
    album.item_id,
  );
  if (hidden) {
    return [
      {
        label: "restore_in_album_series",
        action: () =>
          runSeriesEdit(
            () => api.restoreAlbumInSeries(series.item_id, album.item_id),
            "album_series_saved",
          ),
        icon: Undo2,
      },
    ];
  }
  const custom = series.metadata.series_source === AlbumSeriesSource.CUSTOM;
  return [
    {
      label: "edit_album_series_sequence",
      action: () =>
        eventbus.emit("albumSeriesDialog", {
          mode: "sequence",
          album,
          series,
          sequence: seriesSequenceOf(album, series.name),
        }),
      icon: Hash,
    },
    {
      label: custom ? "remove_from_album_series" : "hide_in_album_series",
      action: () =>
        runSeriesEdit(
          () => api.removeAlbumFromSeries(series.item_id, album.item_id),
          custom ? "album_series_saved" : "hide_in_album_series_done",
        ),
      icon: ListX,
    },
  ];
};

/** The entries of an album series itself: change its type, delete it when it is one's own. */
export const albumSeriesEditItems = (
  series: MediaCollection<Album>,
): ContextMenuItem[] => {
  const entries: ContextMenuItem[] = [
    {
      label: "edit_album_series_type",
      action: () =>
        eventbus.emit("albumSeriesDialog", { mode: "type", series }),
      icon: Tags,
    },
  ];
  if (series.metadata.series_source === AlbumSeriesSource.CUSTOM) {
    entries.push({
      label: "delete_album_series",
      action: () =>
        eventbus.emit("deleteConfirmationDialog", {
          title: $t("delete_album_series"),
          message: $t("delete_album_series_confirm", [series.name]),
          confirmLabel: $t("remove"),
          onConfirm: () =>
            runSeriesEdit(
              () => api.deleteAlbumSeries(series.item_id),
              "album_series_deleted",
            ),
        }),
      icon: Trash2,
    });
  }
  return entries;
};

/**
 * The album series entries of the context menu of one item: add an album to a
 * series, edit an album within the series it is listed in, or edit a series.
 */
export const albumSeriesMenuItems = (
  items: MediaItemTypeOrItemMapping[],
  parentItem: MediaItemType | undefined,
  canEditLibrary: boolean,
): ContextMenuItem[] => {
  if (items.length !== 1 || !canEditLibrary) return [];
  const item = items[0];
  if (isAlbumSeries(item)) return albumSeriesEditItems(item);
  if (item.media_type !== MediaType.ALBUM || item.provider !== "library") {
    return [];
  }
  const album = item as Album;
  const entries: ContextMenuItem[] = [
    {
      label: "add_to_album_series",
      action: () => eventbus.emit("albumSeriesDialog", { mode: "add", album }),
      icon: ListPlus,
    },
  ];
  if (parentItem && isAlbumSeries(parentItem)) {
    entries.push(...albumInSeriesItems(album, parentItem));
  }
  return entries;
};
