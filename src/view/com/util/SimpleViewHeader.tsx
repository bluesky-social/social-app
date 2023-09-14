import React from 'react'
import {observer} from 'mobx-react-lite'
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {CenteredView} from './Views'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useAnalytics} from 'lib/analytics/analytics'
import {NavigationProp} from 'lib/routes/types'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

export const SimpleViewHeader = observer(function SimpleViewHeaderImpl({
  showBackButton = true,
  style,
  children,
}: React.PropsWithChildren<{
  showBackButton?: boolean
  style?: StyleProp<ViewStyle>
}>) {
  const pal = usePalette('default')
  const store = useStores()
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
    store.shell.openDrawer()
  }, [track, store])

  const Container = isMobile ? View : CenteredView
  return (
    <Container style={[styles.header, isMobile && styles.headerMobile, style]}>
      {showBackButton ? (
        <TouchableOpacity
          testID="viewHeaderDrawerBtn"
          onPress={canGoBack ? onPressBack : onPressMenu}
          hitSlop={BACK_HITSLOP}
          style={canGoBack ? styles.backBtn : styles.backBtnWide}
          accessibilityRole="button"
          accessibilityLabel={canGoBack ? 'Back' : 'Menu'}
          accessibilityHint="">
          {canGoBack ? (
            <FontAwesomeIcon
              size={18}
              icon="angle-left"
              style={[styles.backIcon, pal.text]}
            />
          ) : (
            <FontAwesomeIcon
              size={18}
              icon="bars"
              style={[styles.backIcon, pal.textLight]}
            />
          )}
        </TouchableOpacity>
      ) : null}
      {children}
    </Container>
  )
})

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
