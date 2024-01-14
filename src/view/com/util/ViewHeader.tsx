import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {useNavigation} from '@react-navigation/native'
import {CenteredView} from './Views'
import {Text} from './text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useAnalytics} from 'lib/analytics/analytics'
import {NavigationProp} from 'lib/routes/types'
import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import Animated from 'react-native-reanimated'
import {useSetDrawerOpen} from '#/state/shell'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

export function ViewHeader({
  title,
  canGoBack,
  showBackButton = true,
  hideOnScroll,
  showOnDesktop,
  showBorder,
  renderButton,
}: {
  title: string
  canGoBack?: boolean
  showBackButton?: boolean
  hideOnScroll?: boolean
  showOnDesktop?: boolean
  showBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const {isDesktop, isTablet} = useWebMediaQueries()

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

  if (isDesktop) {
    if (showOnDesktop) {
      return (
        <DesktopWebHeader
          title={title}
          renderButton={renderButton}
          showBorder={showBorder}
        />
      )
    }
    return null
  } else {
    if (typeof canGoBack === 'undefined') {
      canGoBack = navigation.canGoBack()
    }

    return (
      <Container hideOnScroll={hideOnScroll || false} showBorder={showBorder}>
        {showBackButton ? (
          <TouchableOpacity
            testID="viewHeaderDrawerBtn"
            onPress={canGoBack ? onPressBack : onPressMenu}
            hitSlop={BACK_HITSLOP}
            style={canGoBack ? styles.backBtn : styles.backBtnWide}
            accessibilityRole="button"
            accessibilityLabel={canGoBack ? _(msg`Back`) : _(msg`Menu`)}
            accessibilityHint={
              canGoBack ? '' : _(msg`Access navigation links and settings`)
            }>
            {canGoBack ? (
              <FontAwesomeIcon
                size={18}
                icon="angle-left"
                style={[styles.backIcon, pal.text]}
              />
            ) : !isTablet ? (
              <FontAwesomeIcon
                size={18}
                icon="bars"
                style={[styles.backIcon, pal.textLight]}
              />
            ) : null}
          </TouchableOpacity>
        ) : null}
        <View style={styles.titleContainer} pointerEvents="none">
          <Text type="title" style={[pal.text, styles.title]}>
            {title}
          </Text>
        </View>
        {renderButton ? (
          renderButton()
        ) : showBackButton ? (
          <View style={canGoBack ? styles.backBtn : styles.backBtnWide} />
        ) : null}
      </Container>
    )
  }
}

function DesktopWebHeader({
  title,
  renderButton,
  showBorder = true,
}: {
  title: string
  renderButton?: () => JSX.Element
  showBorder?: boolean
}) {
  const pal = usePalette('default')
  return (
    <CenteredView
      style={[
        styles.header,
        styles.desktopHeader,
        pal.border,
        {
          borderBottomWidth: showBorder ? 1 : 0,
        },
      ]}>
      <View style={styles.titleContainer} pointerEvents="none">
        <Text type="title-lg" style={[pal.text, styles.title]}>
          {title}
        </Text>
      </View>
      {renderButton?.()}
    </CenteredView>
  )
}

function Container({
  children,
  hideOnScroll,
  showBorder,
}: {
  children: React.ReactNode
  hideOnScroll: boolean
  showBorder?: boolean
}) {
  const pal = usePalette('default')
  const {headerMinimalShellTransform} = useMinimalShellMode()

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
        styles.headerFloating,
        pal.view,
        pal.border,
        headerMinimalShellTransform,
        showBorder && styles.border,
      ]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: '100%',
  },
  headerFloating: {
    position: 'absolute',
    top: 0,
    width: '100%',
  },
  desktopHeader: {
    paddingVertical: 12,
    maxWidth: 600,
    marginLeft: 'auto',
    marginRight: 'auto',
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
