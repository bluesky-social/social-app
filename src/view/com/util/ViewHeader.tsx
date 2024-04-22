import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import Animated from 'react-native-reanimated'
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useNavigation} from '@react-navigation/native'

import {useMinimalShellMode} from 'lib/hooks/useMinimalShellMode'
import {usePalette} from 'lib/hooks/usePalette'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {NavigationProp} from 'lib/routes/types'
import {useTheme} from '#/alf'
import {Text} from './text/Text'
import {CenteredView} from './Views'

const BACK_HITSLOP = {left: 20, top: 20, right: 50, bottom: 20}

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
  const {_} = useLingui()
  const navigation = useNavigation<NavigationProp>()
  const {isDesktop} = useWebMediaQueries()
  const t = useTheme()

  const onPressBack = React.useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    } else {
      navigation.navigate('Home')
    }
  }, [navigation])

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

    const showBackButtonAndCan = showBackButton && canGoBack
    return (
      <Container hideOnScroll={hideOnScroll || false} showBorder={showBorder}>
        <View style={{flex: 1}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            {showBackButtonAndCan ? (
              <TouchableOpacity
                testID="viewHeaderDrawerBtn"
                onPress={onPressBack}
                hitSlop={BACK_HITSLOP}
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel={canGoBack ? _(msg`Back`) : _(msg`Menu`)}
                accessibilityHint="">
                <FontAwesomeIcon
                  size={18}
                  icon="angle-left"
                  style={[styles.backIcon, pal.text]}
                />
              </TouchableOpacity>
            ) : null}
            <View
              style={[
                styles.titleContainer,
                !showBackButtonAndCan && {marginLeft: 0},
              ]}
              pointerEvents="none">
              <Text type="title" style={[pal.text, styles.title]}>
                {title}
              </Text>
            </View>
            {renderButton ? (
              renderButton()
            ) : showBackButton ? (
              <View style={styles.backBtn} />
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
          borderBottomWidth: showBorder ? 1 : 0,
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
  backBtn: {
    width: 30,
    height: 30,
  },
  backIcon: {
    marginTop: 6,
  },
})
