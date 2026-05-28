import {useCallback} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {StackActions, useNavigation} from '@react-navigation/native'

import {type NavigationProp} from '#/lib/routes/types'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Layout from '#/components/Layout'
import {Text} from '#/components/Typography'

export const NotFoundScreen = () => {
  const t = useTheme()
  const {t: l} = useLingui()
  const navigation = useNavigation<NavigationProp>()

  const canGoBack = navigation.canGoBack()
  const onPressHome = useCallback(() => {
    if (canGoBack) {
      navigation.goBack()
    } else {
      navigation.navigate('HomeTab')
      navigation.dispatch(StackActions.popToTop())
    }
  }, [navigation, canGoBack])

  return (
    <Layout.Screen testID="notFoundView">
      <Layout.Center>
        <Layout.Header.Outer>
          <Layout.Header.BackButton />
          <Layout.Header.Content align="left">
            <Layout.Header.TitleText>
              <Trans>Page not found</Trans>
            </Layout.Header.TitleText>
          </Layout.Header.Content>
          <Layout.Header.Slot />
        </Layout.Header.Outer>
        <View style={[a.px_xl, a.align_center, a.h_full, {paddingTop: 100}]}>
          <Text style={[a.mb_md, a.text_4xl, a.font_semi_bold, t.atoms.text]}>
            <Trans>Page not found</Trans>
          </Text>
          <Text style={[a.mb_md, a.text_md, t.atoms.text]}>
            <Trans>
              We're sorry! We can't find the page you were looking for.
            </Trans>
          </Text>
          <Button
            color="primary"
            size="small"
            label={canGoBack ? l`Go back` : l`Go home`}
            accessibilityLabel={canGoBack ? l`Go back` : l`Go home`}
            accessibilityHint={
              canGoBack ? l`Returns to previous page` : l`Returns to home page`
            }
            onPress={onPressHome}>
            <ButtonText>{canGoBack ? l`Go back` : l`Go home`}</ButtonText>
          </Button>
        </View>
      </Layout.Center>
    </Layout.Screen>
  )
}
