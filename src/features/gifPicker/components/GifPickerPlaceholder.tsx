import {useLingui} from '@lingui/react/macro'

import {ListMaybePlaceholder} from '#/components/Lists'

export function GifPickerPlaceholder({
  isLoading,
  isError,
  isSearching,
  isRecentsEmpty,
  query,
  onRetry,
  onGoBack,
}: {
  isLoading: boolean
  isError: boolean
  isSearching: boolean
  isRecentsEmpty: boolean
  query: string
  onRetry: () => Promise<unknown>
  onGoBack: () => void
}) {
  const {t: l} = useLingui()

  const emptyMessage = isSearching
    ? l`No GIFs found for "${query}".`
    : isRecentsEmpty
      ? l`No recent GIFs yet. Pick one to see it here.`
      : l`No GIFs to show right now. Try again in a moment.`

  return (
    <ListMaybePlaceholder
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onGoBack={onGoBack}
      emptyType="results"
      sideBorders={false}
      topBorder={false}
      errorTitle={l`Couldn't load GIFs`}
      errorMessage={l`There was a problem loading GIFs. Check your connection and try again.`}
      emptyMessage={emptyMessage}
    />
  )
}
