import React from 'react'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'

import {isWeb} from '#/platform/detection'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {CenteredView} from './Views'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

export function SimpleViewHeader({
  showBackButton = true,
  style,
  children,
}: React.PropsWithChildren<{
  showBackButton?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const navigation = useNavigation<NavigationProp>()
  const {isMobile} = useWebMediaQueries()
  const canGoBack = navigation.canGoBack()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

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
      {showBackButton && canGoBack ? (
        <TouchableOpacity
          testID="viewHeaderDrawerBtn"
          onPress={onPressBack}
          hitSlop={BACK_HITSLOP}
          style={canGoBack ? styles.backBtn : styles.backBtnWide}
          accessibilityRole="button"
          accessibilityLabel={'Back'}
          accessibilityHint="">
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={[styles.backIcon, pal.text]}
          />
        </TouchableOpacity>
      ) : null}
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
    paddingHorizontal: 6,
  },
  backIcon: {
    marginTop: 6,
  },
})
