import {memo} from 'react'
import {type StyleProp, View, type ViewStyle} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import type React from 'react'

import {cleanError} from '#/lib/strings/errors'
import {CenteredView} from '#/view/com/util/Views'
import {atoms as a, flatten, useBreakpoints, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Error} from '#/components/Error'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  error,
  onRetry,
  height,
  style,
  showEndMessage = false,
  endMessageText,
  renderEndMessage,
}: {
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  error?: string
  onRetry?: () => Promise<unknown>
  height?: number
  style?: StyleProp<ViewStyle>
  showEndMessage?: boolean
  endMessageText?: string
  renderEndMessage?: () => React.ReactNode
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.align_center,
        a.border_t,
        a.pb_lg,
        t.atoms.border_contrast_low,
        {height: height ?? 180, paddingTop: 30},
        flatten(style),
      ]}>
      {isFetchingNextPage ? (
        <Loader size="xl" />
      ) : error ? (
        <ListFooterMaybeError error={error} onRetry={onRetry} />
      ) : !hasNextPage && showEndMessage ? (
        renderEndMessage ? (
          renderEndMessage()
        ) : (
          <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
            {endMessageText ?? <Trans>You have reached the end</Trans>}
          </Text>
        )
      ) : null}
    </View>
  )
}

function ListFooterMaybeError({
  error,
  onRetry,
}: {
  error?: string
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (!error) return null

  return (
    <View style={[a.w_full, a.px_lg]}>
      <View
        style={[
          a.flex_row,
          a.gap_md,
          a.p_md,
          a.rounded_sm,
          a.align_center,
          t.atoms.bg_contrast_25,
        ]}>
        <Text
          style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}
          numberOfLines={2}>
          {error ? (
            cleanError(error)
          ) : (
            <Trans>Oops, something went wrong!</Trans>
          )}
        </Text>
        <Button
          variant="solid"
          label={_(msg`Press to retry`)}
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_sm,
            a.overflow_hidden,
            a.px_md,
            a.py_sm,
          ]}
          onPress={onRetry}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

let ListMaybePlaceholder = ({
  isLoading,
  noEmpty,
  isError,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  emptyType = 'page',
  onRetry,
  onGoBack,
  hideBackButton,
  sideBorders,
  topBorder = false,
}: {
  isLoading: boolean
  noEmpty?: boolean
  isError?: boolean
  emptyTitle?: string
  emptyMessage?: string
  errorTitle?: string
  errorMessage?: string
  emptyType?: 'page' | 'results'
  onRetry?: () => Promise<unknown>
  onGoBack?: () => void
  hideBackButton?: boolean
  sideBorders?: boolean
  topBorder?: boolean
}): React.ReactNode => {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile, gtTablet} = useBreakpoints()

  if (isLoading) {
    return (
      <CenteredView
        style={[
          a.h_full_vh,
          a.align_center,
          !gtMobile ? a.justify_between : a.gap_5xl,
          t.atoms.border_contrast_low,
          {paddingTop: 175, paddingBottom: 110},
        ]}
        sideBorders={sideBorders ?? gtMobile}
        topBorder={topBorder && !gtTablet}>
        <View style={[a.w_full, a.align_center, {top: 100}]}>
          <Loader size="xl" />
        </View>
      </CenteredView>
    )
  }

  if (isError) {
    return (
      <Error
        title={errorTitle ?? _(msg`Oops!`)}
        message={errorMessage ?? _(msg`Something went wrong!`)}
        onRetry={onRetry}
        onGoBack={onGoBack}
        sideBorders={sideBorders}
        hideBackButton={hideBackButton}
      />
    )
  }

  if (!noEmpty) {
    return (
      <Error
        title={
          emptyTitle ??
          (emptyType === 'results'
            ? _(msg`No results found`)
            : _(msg`Page not found`))
        }
        message={
          emptyMessage ??
          _(msg`We're sorry! We can't find the page you were looking for.`)
        }
        onRetry={onRetry}
        onGoBack={onGoBack}
        hideBackButton={hideBackButton}
        sideBorders={sideBorders}
      />
    )
  }

  return null
}
ListMaybePlaceholder = memo(ListMaybePlaceholder)
export {ListMaybePlaceholder}
