import React from 'react'
import {atoms as a, useTheme} from '#/alf'
import {Text, View} from 'react-native'
import {Loader} from '#/components/Loader'
import {Trans} from '@lingui/macro'
import {cleanError} from 'lib/strings/errors'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {Button} from '#/components/Button'

export function ListFooter({
  isFetching,
  isError,
  error,
  onRetry,
}: {
  isFetching: boolean
  isError: boolean
  error?: string
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()

  return (
    <View
      style={[
        a.w_full,
        a.align_center,
        a.justify_center,
        a.border_t,
        t.atoms.border_contrast_low,
        {height: 100},
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
  isError: boolean
  error?: string
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()

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
          label="Press to retry"
          style={[
            a.align_center,
            a.justify_center,
            a.rounded_sm,
            a.overflow_hidden,
            a.px_md,
            a.py_sm,
          ]}
          onPress={onRetry}>
          Retry
        </Button>
      </View>
    </View>
  )
}
export function ListMaybeLoading({isLoading}: {isLoading: boolean}) {
  if (!isLoading) return
  return (
    <View style={[a.w_full, a.align_center, {top: 100}]}>
      <Loader size="xl" />
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
  const {isDesktop} = useWebMediaQueries()
  const t = useTheme()

  if (!isDesktop) return null

  return (
    <View style={[a.w_full, a.py_lg, a.px_xl, a.gap_xs]}>
      <Text style={[a.text_3xl, a.font_bold, t.atoms.text]}>{title}</Text>
      {subtitle ? (
        <Text style={[a.text_md, t.atoms.text]}>{subtitle}</Text>
      ) : undefined}
    </View>
  )
}
