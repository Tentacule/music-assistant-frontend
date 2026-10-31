import type { LoadDataParams } from "@/composables/useItemsListing";
import { api } from "@/plugins/api";
import { getCollectionMediaTypeFromItemId } from "@/plugins/api/helpers";
import {
  MediaType,
  type MediaCollection,
  type MediaItemType,
} from "@/plugins/api/interfaces";
import { computed, ref, watch } from "vue";

interface CollectionRef {
  itemId: string;
  provider: string;
}

export function useCollectionDetails(collection: () => CollectionRef) {
  const itemDetails = ref<MediaCollection<MediaItemType>>();
  const collectionMediaType = computed(() =>
    getCollectionMediaTypeFromItemId(collection().itemId),
  );

  watch(
    () => [collection().itemId, collection().provider] as const,
    () => {
      itemDetails.value = undefined;
    },
  );

  // the collections the server can list: series of audiobooks and of albums
  const getCollection = (
    ...args: Parameters<typeof api.getAudiobookCollection>
  ): Promise<MediaCollection<MediaItemType>> =>
    collectionMediaType.value === MediaType.ALBUM
      ? api.getAlbumCollection(...args)
      : api.getAudiobookCollection(...args);

  const loadCollectionItems = async (
    params: LoadDataParams,
  ): Promise<MediaItemType[]> => {
    if (
      collectionMediaType.value !== MediaType.AUDIOBOOK &&
      collectionMediaType.value !== MediaType.ALBUM
    )
      return [];
    const { itemId, provider } = collection();
    if (!itemDetails.value) {
      const snapshot = await getCollection(itemId, undefined, 0);
      if (itemId !== collection().itemId || provider !== collection().provider)
        return [];
      itemDetails.value = snapshot;
    }
    const page = await getCollection(
      itemId,
      params.search,
      params.limit,
      params.offset,
      params.favoritesOnly || undefined,
    );
    return page.items;
  };

  return { itemDetails, collectionMediaType, loadCollectionItems };
}
