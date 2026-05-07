import {
  useFeaturedGifsQuery,
  useGifSearchQuery,
} from '#/features/gifPicker/queries'

/**
 * Single entry point for the GIF picker's data layer. Routes between the
 * featured and search endpoints so the UI only ever consumes one query result.
 */
export function useGifPickerData(
  query: string,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const isSearching = query.length > 0

  const featured = useFeaturedGifsQuery({enabled: enabled && !isSearching})
  const search = useGifSearchQuery(query, {enabled: enabled && isSearching})

  const active = isSearching ? search : featured

  return {
    ...active,
    isSearching,
  }
}
