import React from 'react'

import {CenteredView} from 'view/com/util/Views'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {View} from 'react-native'
import {Button} from '#/components/Button'
import {useNavigation} from '@react-navigation/core'
import {NavigationProp} from 'lib/routes/types'
import {StackActions} from '@react-navigation/native'
import {router} from '#/routes'

export function Error({
  title,
  message,
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => unknown
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

  return (
    <CenteredView
      style={[
        a.flex_1,
        a.align_center,
        !gtMobile ? a.justify_between : a.gap_5xl,
        t.atoms.border_contrast_low,
        {paddingTop: 175, paddingBottom: 110},
      ]}
      sideBorders>
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        <Text style={[a.font_bold, a.text_3xl]}>{title}</Text>
        <Text
          style={[
            a.text_md,
            a.text_center,
            t.atoms.text_contrast_high,
            {lineHeight: 1.4},
            gtMobile && {width: 450},
          ]}>
          {message}
        </Text>
      </View>
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        {onRetry && (
          <Button
            variant="solid"
            color="primary"
            label="Click here"
            onPress={onRetry}
            size="large"
            style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
            Retry
          </Button>
        )}
        <Button
          variant="solid"
          color={onRetry ? 'secondary' : 'primary'}
          label="Click here"
          onPress={onGoBack}
          size="large"
          style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
          Go Back
        </Button>
      </View>
    </CenteredView>
  )
}
