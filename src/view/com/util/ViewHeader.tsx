import React from 'react'
import {StyleSheet, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {useNavigation} from '@react-navigation/native'

import {useSetDrawerOpen} from '#/state/shell'
import {useAnalytics} from 'lib/analytics/analytics'
import {useMinimalShellHeaderTransform} from 'lib/hooks/useMinimalShellTransform'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {useTheme} from '#/alf'
import {BackButton, RightSpacer} from '#/components/BackButton'
import {Text} from './text/Text'
import {CenteredView} from './Views'

export function ViewHeader({
  title,
  subtitle,
  canGoBack,
  showBackButton = true,
  hideOnScroll,
  showOnDesktop,
  showBorder,
  renderButton,
}: {
  title: string
  subtitle?: string
  canGoBack?: boolean
  showBackButton?: boolean
  hideOnScroll?: boolean
  showOnDesktop?: boolean
  showBorder?: boolean
  renderButton?: () => JSX.Element
}) {
  const pal = usePalette('default')

  const setDrawerOpen = useSetDrawerOpen()
  const navigation = useNavigation<NavigationProp>()
  const {track} = useAnalytics()
  const {isDesktop} = useWebMediaQueries()
  const t = useTheme()

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
          subtitle={subtitle}
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
        <View style={{flex: 1}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            {showBackButton && (
              <BackButton
                onPressBack={onPressBack}
                canGoBack={canGoBack}
                onPressMenu={onPressMenu}
              />
            )}
            <View style={styles.titleContainer} pointerEvents="none">
              <Text type="title" style={[pal.text, styles.title]}>
                {title}
              </Text>
            </View>
            {renderButton ? (
              renderButton()
            ) : showBackButton ? (
              <RightSpacer wide={!canGoBack} />
            ) : null}
          </View>
          {subtitle ? (
            <View
              style={[styles.titleContainer, {marginTop: -3}]}
              pointerEvents="none">
              <Text
                style={[
                  pal.text,
                  styles.subtitle,
                  t.atoms.text_contrast_medium,
                ]}>
                {subtitle}
              </Text>
            </View>
          ) : undefined}
        </View>
      </Container>
    )
  }
}

function DesktopWebHeader({
  title,
  subtitle,
  renderButton,
  showBorder = true,
}: {
  title: string
  subtitle?: string
  renderButton?: () => JSX.Element
  showBorder?: boolean
}) {
  const pal = usePalette('default')
  const t = useTheme()
  return (
    <CenteredView
      style={[
        styles.header,
        styles.desktopHeader,
        pal.border,
        {
          borderBottomWidth: showBorder ? StyleSheet.hairlineWidth : 0,
        },
        {display: 'flex', flexDirection: 'column'},
      ]}>
      <View>
        <View style={styles.titleContainer} pointerEvents="none">
          <Text type="title-lg" style={[pal.text, styles.title]}>
            {title}
          </Text>
        </View>
        {renderButton?.()}
      </View>
      {subtitle ? (
        <View>
          <View style={[styles.titleContainer]} pointerEvents="none">
            <Text
              style={[
                pal.text,
                styles.subtitleDesktop,
                t.atoms.text_contrast_medium,
              ]}>
              {subtitle}
            </Text>
          </View>
        </View>
      ) : null}
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
  const headerMinimalShellTransform = useMinimalShellHeaderTransform()

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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleContainer: {
    marginLeft: 'auto',
    marginRight: 'auto',
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
  },
  subtitleDesktop: {
    fontSize: 15,
  },
})
