import React from 'react'
import {StyleSheet, View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useFocusEffect} from '@react-navigation/native'

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
import {atoms as a} from '#/alf'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'AccessibilitySettings'
>
export function AccessibilitySettingsScreen({}: Props) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isMobile, isTabletOrMobile} = useWebMediaQueries()
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
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View style={s.hContentRegion} testID="accessibilitySettingsScreen">
      <SimpleViewHeader
        showBackButton={isTabletOrMobile}
        style={[
          pal.border,
          a.border_b,
          !isMobile && {
            borderLeftWidth: StyleSheet.hairlineWidth,
            borderRightWidth: StyleSheet.hairlineWidth,
          },
        ]}>
        <View style={a.flex_1}>
          <Text type="title-lg" style={[pal.text, {fontWeight: '600'}]}>
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
          {paddingBottom: 100},
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
            label={_(msg`Disable autoplay for videos and GIFs`)}
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
