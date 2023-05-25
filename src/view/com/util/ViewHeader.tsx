import React from 'react'
import {observer} from 'mobx-react-lite'
import {Animated, StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {CenteredView} from './Views'
import {Text} from './text/Text'
import {useStores} from 'state/index'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnimatedValue} from 'lib/hooks/useAnimatedValue'
import {useAnalytics} from 'lib/analytics'
import {NavigationProp} from 'lib/routes/types'
import {isDesktopWeb} from 'platform/detection'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

export const ViewHeader = observer(function ({
  title,
  canGoBack,
  hideOnScroll,
  showOnDesktop,
  showBorder,
  renderButton,
}: {
  title: string
  canGoBack?: boolean
  hideOnScroll?: boolean
  showOnDesktop?: boolean
  showBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  const store = useStores()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()

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

  if (isDesktopWeb) {
    if (showOnDesktop) {
      return <DesktopWebHeader title={title} renderButton={renderButton} />
    }
    return null
  } else {
    if (typeof canGoBack === 'undefined') {
      canGoBack = navigation.canGoBack()
    }

    return (
      <Container hideOnScroll={hideOnScroll || false} showBorder={showBorder}>
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
        <View style={styles.titleContainer} pointerEvents="none">
          <Text type="title" style={[pal.text, styles.title]}>
            {title}
          </Text>
        </View>
        {renderButton ? (
          renderButton()
        ) : (
          <View style={canGoBack ? styles.backBtn : styles.backBtnWide} />
        )}
      </Container>
    )
  }
})

function DesktopWebHeader({
  title,
  renderButton,
}: {
  title: string
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  return (
    <CenteredView style={[styles.header, styles.desktopHeader, pal.border]}>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="title-lg" style={[pal.text, styles.title]}>
          {title}
        </Text>
      </View>
      {renderButton?.()}
    </CenteredView>
  )
}

const Container = observer(
  ({
    children,
    hideOnScroll,
    showBorder,
  }: {
    children: React.ReactNode
    hideOnScroll: boolean
    showBorder?: boolean
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
      return (
        <View
          style={[
            styles.header,
            pal.view,
            pal.border,
            showBorder && styles.border,
          ]}>
          {children}
        </View>
      )
    }
    return (
      <Animated.View
        style={[
          styles.header,
          pal.view,
          pal.border,
          styles.headerFloating,
          transform,
          showBorder && styles.border,
        ]}>
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
    paddingVertical: 6,
  },
  headerFloating: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  desktopHeader: {
    borderBottomWidth: 1,
    paddingVertical: 12,
  },
  border: {
    borderBottomWidth: 1,
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
    width: 30,
    height: 30,
    paddingHorizontal: 6,
  },
  backIcon: {
    marginTop: 6,
  },
})
