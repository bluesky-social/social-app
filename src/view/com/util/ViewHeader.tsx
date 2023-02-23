import React from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {UserAvatar} from './UserAvatar'
import {Text} from './text/Text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useAnalytics} from 'lib/analytics'
import {isDesktopWeb} from '../../../platform/detection'

const BACK_HITSLOP = {left: 10, top: 10, right: 30, bottom: 10}

export const ViewHeader = observer(function ViewHeader({
  title,
  canGoBack,
  hideOnScroll,
}: {
  title: string
  canGoBack?: boolean
  hideOnScroll?: boolean
}) {
  const pal = usePalette('default')
  const store = useStores()
  const {track} = useAnalytics()
  const onPressBack = () => {
    store.nav.tab.goBack()
  }
  const onPressMenu = () => {
    track('ViewHeader:MenuButtonClicked')
    store.shell.setMainMenuOpen(true)
  }
  if (typeof canGoBack === 'undefined') {
    canGoBack = store.nav.tab.canGoBack
  }
  if (isDesktopWeb) {
    return undefined
  }
  return (
    <Container hideOnScroll={hideOnScroll || false}>
      <TouchableOpacity
        testID="viewHeaderBackOrMenuBtn"
        onPress={canGoBack ? onPressBack : onPressMenu}
        hitSlop={BACK_HITSLOP}
        style={canGoBack ? styles.backBtn : styles.backBtnWide}>
        {canGoBack ? (
          <FontAwesomeIcon
            size={18}
            icon="angle-left"
            style={[styles.backIcon, pal.text]}
          />
        ) : (
          <UserAvatar
            size={30}
            handle={store.me.handle}
            displayName={store.me.displayName}
            avatar={store.me.avatar}
          />
        )}
      </TouchableOpacity>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="title" style={[pal.text, styles.title]}>
          {title}
        </Text>
      </View>
      <View style={canGoBack ? styles.backBtn : styles.backBtnWide} />
    </Container>
  )
})

const Container = observer(
  ({
    children,
    hideOnScroll,
  }: {
    children: React.ReactNode
    hideOnScroll: boolean
  }) => {
    const store = useStores()
    const pal = usePalette('default')
    const interp = useAnimatedValue(0)

    React.useEffect(() => {
      if (store.shell.minimalShellMode) {
        Animated.timing(interp, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
          isInteraction: false,
        }).start()
      } else {
        Animated.timing(interp, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
          isInteraction: false,
        }).start()
      }
    }, [interp, store.shell.minimalShellMode])
    const transform = {
      transform: [{translateY: Animated.multiply(interp, -100)}],
    }

    if (!hideOnScroll) {
      return <View style={[styles.header, pal.view]}>{children}</View>
    }
    return (
      <Animated.View
        style={[styles.header, pal.view, styles.headerFloating, transform]}>
        {children}
      </Animated.View>
    )
  },
)

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 6,
  },
  headerFloating: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },

  titleContainer: {
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingRight: 10,
  },
  title: {
    fontWeight: 'bold',
  },

  backBtn: {
    width: 30,
    height: 30,
  },
  backBtnWide: {
    width: 40,
    height: 30,
    marginLeft: 6,
  },
  backIcon: {
    marginTop: 6,
  },
})
