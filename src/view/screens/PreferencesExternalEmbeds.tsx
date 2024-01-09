import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {Text} from '../com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {
  EmbedPlayerSource,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans} from '@lingui/macro'
import {ScrollView} from '../com/util/Views'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from 'state/preferences'
import {ToggleButton} from 'view/com/util/forms/ToggleButton'
import {SimpleViewHeader} from '../com/util/SimpleViewHeader'

type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'PreferencesExternalEmbeds'
>
export function PreferencesExternalEmbeds({}: Props) {
  const pal = usePalette('default')
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {isMobile} = useWebMediaQueries()

  useFocusEffect(
    React.useCallback(() => {
      screen('PreferencesExternalEmbeds')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <View style={s.hContentRegion} testID="preferencesExternalEmbedsScreen">
      <SimpleViewHeader
        showBackButton={isMobile}
        style={[
          pal.border,
          {borderBottomWidth: 1},
          !isMobile && {borderLeftWidth: 1, borderRightWidth: 1},
        ]}>
        <View style={{flex: 1}}>
          <Text type="title-lg" style={[pal.text, {fontWeight: 'bold'}]}>
            <Trans>External Media Preferences</Trans>
          </Text>
          <Text style={pal.textLight}>
            <Trans>Customize media from external sites.</Trans>
          </Text>
        </View>
      </SimpleViewHeader>
      <ScrollView
        // @ts-ignore web only -prf
        dataSet={{'stable-gutters': 1}}
        contentContainerStyle={[pal.viewLight, {paddingBottom: 200}]}>
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
        {Object.entries(externalEmbedLabels).map(([key, label]) => (
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
