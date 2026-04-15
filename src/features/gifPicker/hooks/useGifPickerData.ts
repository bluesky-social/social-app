import {
  useFeaturedGifsQuery as useKlipyFeaturedGifsQuery,
  useGifSearchQuery as useKlipyGifSearchQuery,
} from '#/state/queries/klipy'
import {
  useTenorFeaturedGifsQuery,
  useTenorGifSearchQuery,
} from '#/state/queries/tenor'
import {useAnalytics} from '#/analytics'
import {type GifPickerProvider} from '#/features/gifPicker/types'

/**
 * Single entry point for the GIF picker's data layer. Wraps the Klipy/Tenor
 * feature-flag split and the featured-vs-search branching so the UI only ever
 * consumes one query result.
 *
 * The Tenor path is kept alive until the Klipy rollout is complete.
 */
export function useGifPickerData(
  query: string,
  {enabled = true}: {enabled?: boolean} = {},
) {
  const ax = useAnalytics()
  // TODO: revert — hardcoded for local Klipy testing
  const useKlipy = true // ax.features.enabled(ax.features.KlipyGifProviderEnable)
  const isSearching = query.length > 0
  const provider: GifPickerProvider = useKlipy ? 'klipy' : 'tenor'

  const klipyFeatured = useKlipyFeaturedGifsQuery({
    enabled: enabled && useKlipy && !isSearching,
  })
  const klipySearch = useKlipyGifSearchQuery(query, {
    enabled: enabled && useKlipy && isSearching,
  })
  const tenorFeatured = useTenorFeaturedGifsQuery({
    enabled: enabled && !useKlipy && !isSearching,
  })
  const tenorSearch = useTenorGifSearchQuery(query, {
    enabled: enabled && !useKlipy && isSearching,
  })

  const active = useKlipy
    ? isSearching
      ? klipySearch
      : klipyFeatured
    : isSearching
      ? tenorSearch
      : tenorFeatured

  return {
    ...active,
    provider,
    isSearching,
  }
}
