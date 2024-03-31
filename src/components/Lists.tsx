import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {cleanError} from 'lib/strings/errors'
import {CenteredView} from 'view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Button} from '#/components/Button'
import {Error} from '#/components/Error'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'

export function ListFooter({
  isFetching,
  isError,
  error,
  onRetry,
  height,
}: {
  isFetching?: boolean
  isError?: boolean
  error?: string
  onRetry?: () => Promise<unknown>
  height?: number
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
      ]}>
      {isFetching ? (
        <Loader size="xl" />
      ) : (
        <ListFooterMaybeError
          isError={isError}
          error={error}
          onRetry={onRetry}
        />
      )}
    </View>
  )
}

function ListFooterMaybeError({
  isError,
  error,
  onRetry,
}: {
  isError?: boolean
  error?: string
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()
  const {_} = useLingui()

  if (!isError) return null

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
          variant="gradient"
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
          <Trans>Retry</Trans>
        </Button>
      </View>
    </View>
  )
}

export function ListHeaderDesktop({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  const {gtTablet} = useBreakpoints()
  const t = useTheme()

  if (!gtTablet) return null

  return (
    <View style={[a.w_full, a.py_lg, a.px_xl, a.gap_xs]}>
      <Text style={[a.text_3xl, a.font_bold]}>{title}</Text>
      {subtitle ? (
        <Text style={[a.text_md, t.atoms.text_contrast_medium]}>
          {subtitle}
        </Text>
      ) : undefined}
    </View>
  )
}

export function ListMaybePlaceholder({
  isLoading,
  isEmpty,
  isError,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  emptyType = 'page',
  onRetry,
}: {
  isLoading: boolean
  isEmpty?: boolean
  isError?: boolean
  emptyTitle?: string
  emptyMessage?: string
  errorTitle?: string
  errorMessage?: string
  emptyType?: 'page' | 'results'
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {gtMobile, gtTablet} = useBreakpoints()

  if (!isLoading && isError) {
    return (
      <Error
        title={errorTitle ?? _(msg`Oops!`)}
        message={errorMessage ?? _(`Something went wrong!`)}
        onRetry={onRetry}
      />
    )
  }

  if (isLoading) {
    return (
      <CenteredView
        style={[
          a.flex_1,
          a.align_center,
          !gtMobile ? a.justify_between : a.gap_5xl,
          t.atoms.border_contrast_low,
          {paddingTop: 175, paddingBottom: 110},
        ]}
        sideBorders={gtMobile}
        topBorder={!gtTablet}>
        <View style={[a.w_full, a.align_center, {top: 100}]}>
          <Loader size="xl" />
        </View>
      </CenteredView>
    )
  }

  if (isEmpty) {
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
      />
    )
  }
}
