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
    ? l({
        message: `No GIFs found for "${query}".`,
        comment:
          'Empty-state message shown in the GIF picker when a search returns zero results. Placeholder is the user’s search query.',
      })
    : isRecentsEmpty
      ? l({
          message: 'No recent GIFs yet. Pick one to see it here.',
          comment:
            'Empty-state message shown in the GIF picker’s Recents tab before the user has selected any GIFs.',
        })
      : l({
          message: 'No GIFs to show right now. Try again in a moment.',
          comment:
            'Empty-state message shown when the trending/featured GIF feed returns no results (rare, usually a transient provider issue).',
        })

  return (
    <ListMaybePlaceholder
      isLoading={isLoading}
      isError={isError}
      onRetry={isError ? onRetry : undefined}
      onGoBack={onGoBack}
      emptyType="results"
      sideBorders={false}
      topBorder={false}
      errorTitle={l({
        message: 'Couldn’t load GIFs',
        comment:
          'Title of the error screen shown when the GIF provider request fails.',
      })}
      errorMessage={l({
        message:
          'There was a problem loading GIFs. Check your connection and try again.',
        comment:
          'Body message of the error screen shown when the GIF provider request fails. Encourages the user to retry.',
      })}
      emptyMessage={emptyMessage}
    />
  )
}
