import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Trans} from '@lingui/macro'
import {useFocusEffect} from '@react-navigation/native'

import {usePalette} from '#/lib/hooks/usePalette'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
import {
  EmbedPlayerSource,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {s} from '#/lib/styles'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from '#/state/preferences'
import {useSetMinimalShellMode} from '#/state/shell'
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
import {atoms as a} from '#/alf'
import {SimpleViewHeader} from '../com/util/SimpleViewHeader'
import {Text} from '../com/util/text/Text'
import {ScrollView} from '../com/util/Views'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesExternalEmbeds'
>
export function PreferencesExternalEmbeds({}: Props) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {isTabletOrMobile} = useWebMediaQueries()

  useFocusEffect(
    React.useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  return (
    <View style={s.hContentRegion} testID="preferencesExternalEmbedsScreen">
      <ScrollView
        // @ts-ignore web only -prf
        dataSet={{'stable-gutters': 1}}
        contentContainerStyle={[pal.viewLight, {paddingBottom: 75}]}>
        <SimpleViewHeader
          showBackButton={isTabletOrMobile}
          style={[pal.border, a.border_b]}>
          <View style={a.flex_1}>
            <Text type="title-lg" style={[pal.text, {fontWeight: '600'}]}>
              <Trans>External Media Preferences</Trans>
            </Text>
            <Text style={pal.textLight}>
              <Trans>Customize media from external sites.</Trans>
            </Text>
          </View>
        </SimpleViewHeader>

        <View style={[pal.view]}>
          <View style={styles.infoCard}>
            <Text style={pal.text}>
              <Trans>
                External media may allow websites to collect information about
                you and your device. No information is sent or requested until
                you press the "play" button.
              </Trans>
            </Text>
          </View>
        </View>
        <Text type="xl-bold" style={[pal.text, styles.heading]}>
          <Trans>Enable media players for</Trans>
        </Text>
        {Object.entries(externalEmbedLabels)
          // TODO: Remove special case when we disable the old integration.
          .filter(([key]) => key !== 'tenor')
          .map(([key, label]) => (
            <PrefSelector
              source={key as EmbedPlayerSource}
              label={label}
              key={key}
            />
          ))}
      </ScrollView>
    </View>
  )
}

function PrefSelector({
  source,
  label,
}: {
  source: EmbedPlayerSource
  label: string
}) {
  const pal = usePalette('default')
  const setExternalEmbedPref = useSetExternalEmbedPref()
  const sources = useExternalEmbedsPrefs()

  return (
    <View>
      <View style={[pal.view, styles.toggleCard]}>
        <ToggleButton
          type="default-light"
          label={label}
          labelType="lg"
          isSelected={sources?.[source] === 'show'}
          onPress={() =>
            setExternalEmbedPref(
              source,
              sources?.[source] === 'show' ? 'hide' : 'show',
            )
          }
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
  },
  spacer: {
    height: 8,
  },
  infoCard: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  toggleCard: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
})
