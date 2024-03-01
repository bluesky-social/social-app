import React from 'react'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {View} from 'react-native'
import {Loader} from '#/components/Loader'
import {Trans} from '@lingui/macro'
import {cleanError} from 'lib/strings/errors'
import {Button} from '#/components/Button'
import {Text} from '#/components/Typography'
import {StackActions} from '@react-navigation/native'
import {useNavigation} from '@react-navigation/core'
import {NavigationProp} from 'lib/routes/types'
import {router} from '#/routes'

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
        a.pb_lg,
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
  empty,
  error,
  notFoundType = 'page',
  onRetry,
}: {
  isLoading: boolean
  isEmpty: boolean
  isError: boolean
  empty?: string
  error?: string
  notFoundType?: 'page' | 'results'
  onRetry?: () => Promise<unknown>
}) {
  const navigation = useNavigation<NavigationProp>()
  const t = useTheme()
  const {gtMobile} = useBreakpoints()

  const canGoBack = navigation.canGoBack()
  const onGoBack = React.useCallback(() => {
    if (canGoBack) {
      navigation.goBack()
    } else {
      navigation.navigate('HomeTab')

      // Checking the state for routes ensures that web doesn't encounter errors while going back
      if (navigation.getState()?.routes) {
        navigation.dispatch(StackActions.push(...router.matchPath('/')))
      } else {
        navigation.navigate('HomeTab')
        navigation.dispatch(StackActions.popToTop())
      }
    }
  }, [navigation, canGoBack])

  if (!isEmpty) return null

  return (
    <View
      style={[
        a.flex_1,
        a.align_center,
        !gtMobile ? [a.justify_between, a.border_t] : a.gap_5xl,
        t.atoms.border_contrast_low,
        {paddingTop: 175, paddingBottom: 110},
      ]}>
      {isLoading ? (
        <View style={[a.w_full, a.align_center, {top: 100}]}>
          <Loader size="xl" />
        </View>
      ) : (
        <>
          <View style={[a.w_full, a.align_center, a.gap_lg]}>
            <Text style={[a.font_bold, a.text_3xl]}>
              {isError ? (
                <Trans>Oops!</Trans>
              ) : isEmpty ? (
                <>
                  {notFoundType === 'results' ? (
                    <Trans>No results found</Trans>
                  ) : (
                    <Trans>Page not found</Trans>
                  )}
                </>
              ) : undefined}
            </Text>

            {isError ? (
              <Text
                style={[a.text_md, a.text_center, t.atoms.text_contrast_high]}>
                {error ? error : <Trans>Something went wrong!</Trans>}
              </Text>
            ) : isEmpty ? (
              <Text
                style={[a.text_md, a.text_center, t.atoms.text_contrast_high]}>
                {empty ? (
                  empty
                ) : (
                  <Trans>
                    We're sorry! We can't find the page you were looking for.
                  </Trans>
                )}
              </Text>
            ) : undefined}
          </View>
          <View
            style={[a.gap_md, !gtMobile ? [a.w_full, a.px_lg] : {width: 350}]}>
            {isError && onRetry && (
              <Button
                variant="solid"
                color="primary"
                label="Click here"
                onPress={onRetry}
                size="large"
                style={[
                  a.rounded_sm,
                  a.overflow_hidden,
                  {paddingVertical: 10},
                ]}>
                Retry
              </Button>
            )}
            <Button
              variant="solid"
              color={isError && onRetry ? 'secondary' : 'primary'}
              label="Click here"
              onPress={onGoBack}
              size="large"
              style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
              Go Back
            </Button>
          </View>
        </>
      )}
    </View>
  )
}
