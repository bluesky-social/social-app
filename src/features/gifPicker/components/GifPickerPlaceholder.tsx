import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

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
  const {_} = useLingui()

  const emptyMessage = isSearching
    ? _(msg`No GIFs found for "${query}".`)
    : isRecentsEmpty
      ? _(msg`No recent GIFs yet. Pick one to see it here.`)
      : _(msg`No GIFs to show right now. Try again in a moment.`)

  return (
    <ListMaybePlaceholder
      isLoading={isLoading}
      isError={isError}
      onRetry={onRetry}
      onGoBack={onGoBack}
      emptyType="results"
      sideBorders={false}
      topBorder={false}
      errorTitle={_(msg`Couldn't load GIFs`)}
      errorMessage={_(
        msg`There was a problem loading GIFs. Check your connection and try again.`,
      )}
      emptyMessage={emptyMessage}
    />
  )
}
