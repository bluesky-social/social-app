import React from 'react'
import {StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

import {useAnalytics} from '#/lib/analytics/analytics'
import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {s} from '#/lib/styles'
import {isNative} from '#/platform/detection'
import {
  useAutoplayDisabled,
  useHapticsDisabled,
  useRequireAltTextEnabled,
  useSetAutoplayDisabled,
  useSetHapticsDisabled,
  useSetRequireAltTextEnabled,
} from '#/state/preferences'
import {
  useLargeAltBadgeEnabled,
  useSetLargeAltBadgeEnabled,
} from '#/state/preferences/large-alt-badge'
import {useSetMinimalShellMode} from '#/state/shell'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
import {SimpleViewHeader} from '#/view/com/util/SimpleViewHeader'
import {Text} from '#/view/com/util/text/Text'
import {ScrollView} from '#/view/com/util/Views'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilitySettings'
>
export function AccessibilitySettingsScreen({}: Props) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {isMobile} = useWebMediaQueries()
  const {_} = useLingui()

  const requireAltTextEnabled = useRequireAltTextEnabled()
  const setRequireAltTextEnabled = useSetRequireAltTextEnabled()
  const autoplayDisabled = useAutoplayDisabled()
  const setAutoplayDisabled = useSetAutoplayDisabled()
  const hapticsDisabled = useHapticsDisabled()
  const setHapticsDisabled = useSetHapticsDisabled()
  const largeAltBadgeEnabled = useLargeAltBadgeEnabled()
  const setLargeAltBadgeEnabled = useSetLargeAltBadgeEnabled()

  useFocusEffect(
    React.useCallback(() => {
      screen('PreferencesExternalEmbeds')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <View style={s.hContentRegion} testID="accessibilitySettingsScreen">
      <SimpleViewHeader
        showBackButton={isMobile}
        style={[
          pal.border,
          {borderBottomWidth: 1},
          !isMobile && {borderLeftWidth: 1, borderRightWidth: 1},
        ]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
            <Trans>Accessibility Settings</Trans>
          </Text>
        </View>
      </SimpleViewHeader>
      <ScrollView
        // @ts-ignore web only -prf
        dataSet={{'stable-gutters': 1}}
        style={s.flex1}
        contentContainerStyle={[
          s.flex1,
          {paddingBottom: 200},
          isMobile && pal.viewLight,
        ]}>
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Alt text</Trans>
        </Text>
        <View style={[pal.view, styles.toggleCard]}>
          <ToggleButton
            type="default-light"
            label={_(msg`Require alt text before posting`)}
            labelType="lg"
            isSelected={requireAltTextEnabled}
            onPress={() => setRequireAltTextEnabled(!requireAltTextEnabled)}
          />
          <ToggleButton
            type="default-light"
            label={_(msg`Display larger alt text badges`)}
            labelType="lg"
            isSelected={!!largeAltBadgeEnabled}
            onPress={() => setLargeAltBadgeEnabled(!largeAltBadgeEnabled)}
          />
        </View>
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Media</Trans>
        </Text>
        <View style={[pal.view, styles.toggleCard]}>
          <ToggleButton
            type="default-light"
            label={_(msg`Disable autoplay for GIFs`)}
            labelType="lg"
            isSelected={autoplayDisabled}
            onPress={() => setAutoplayDisabled(!autoplayDisabled)}
          />
        </View>
        {isNative && (
          <>
            <Text type="xl-bold" style={[pal.text, styles.heading]}>
              <Trans>Haptics</Trans>
            </Text>
            <View style={[pal.view, styles.toggleCard]}>
              <ToggleButton
                type="default-light"
                label={_(msg`Disable haptic feedback`)}
                labelType="lg"
                isSelected={hapticsDisabled}
                onPress={() => setHapticsDisabled(!hapticsDisabled)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 6,
  },
  toggleCard: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
})
