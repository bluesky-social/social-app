import React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import {useNavigation} from '@react-navigation/native'

import {isAndroid, isWeb} from '#/platform/detection'
import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from 'lib/analytics/analytics'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {BackButton} from '#/components/BackButton'
import {CenteredView} from './Views'

export function SimpleViewHeader({
  showBackButton = true,
  style,
  children,
}: React.PropsWithChildren<{
  showBackButton?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const {isMobile} = useWebMediaQueries()

  const canGoBack = navigation.canGoBack()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

  const onPressMenu = React.useCallback(() => {
    track('ViewHeader:MenuButtonClicked')
    setDrawerOpen(true)
  }, [track, setDrawerOpen])

  const Container = isMobile ? View : CenteredView
  return (
    <Container
      style={[
        styles.header,
        isMobile && styles.headerMobile,
        isWeb && styles.headerWeb,
        pal.view,
        style,
      ]}>
      {showBackButton && (
        <BackButton
          canGoBack={canGoBack}
          onPressBack={onPressBack}
          onPressMenu={onPressMenu}
          style={{native: {marginRight: isAndroid ? 12 : 2}}}
        />
      )}
      {children}
    </Container>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    width: '100%',
  },
  headerMobile: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerWeb: {
    // @ts-ignore web-only
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  backBtn: {
    width: 30,
    height: 30,
  },
  backBtnWide: {
    width: 30,
    height: 30,
    paddingLeft: 4,
    marginRight: 4,
  },
  backIcon: {
    marginTop: 6,
  },
})
