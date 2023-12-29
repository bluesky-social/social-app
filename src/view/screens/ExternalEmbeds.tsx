import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useFocusEffect} from '@react-navigation/native'
import {NativeStackScreenProps, CommonNavigatorParams} from 'lib/routes/types'
import {s} from 'lib/styles'
import {CenteredView} from '../com/util/Views'
import {ViewHeader} from '../com/util/ViewHeader'
import {Text} from '../com/util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {useAnalytics} from 'lib/analytics/analytics'
import {useWebMediaQueries} from 'lib/hooks/useWebMediaQueries'
import {useSetMinimalShellMode} from '#/state/shell'
import {Trans, msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {ScrollView} from '../com/util/Views'
import {
  useExternalEmbedsPrefs,
  useSetExternalEmbedPref,
} from 'state/preferences'
import {ToggleButton} from 'view/com/util/forms/ToggleButton.tsx'
import {
  externalEmbedLabels,
  ExternalEmbedType,
} from 'state/preferences/external-embeds-prefs.tsx'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ExternalEmbeds'>
export function ExternalEmbeds({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {isTabletOrDesktop} = useWebMediaQueries()

  useFocusEffect(
    React.useCallback(() => {
      screen('ExternalEmbeds')
      setMinimalShellMode(false)
    }, [screen, setMinimalShellMode]),
  )

  return (
    <CenteredView
      style={[
        s.hContentRegion,
        pal.border,
        isTabletOrDesktop ? styles.desktopContainer : pal.viewLight,
      ]}
      testID="externalEmbedsScreen">
      <ViewHeader title={_(msg`External Embeds`)} showOnDesktop />
      <ScrollView>
        <View style={styles.spacer} />
        <View style={[pal.view]}>
          <View style={styles.infoCard}>
            <Text style={pal.text}>
              <Trans>
                Some posts on Bluesky may include media embeds from an external
                source that you can load. Embeds may allow the external source
                to collect information about you and your device. You may choose
                to remove these embeds by source.
              </Trans>
            </Text>
            <Text style={[pal.textLight, {fontWeight: '500', marginTop: 15}]}>
              <Trans>
                Note: Embeds are not loaded until you choose to load an embed.
                No information is sent to or requested from the external source
                until you load the embed.
              </Trans>
            </Text>
          </View>
        </View>
        <View style={styles.spacer} />
        {Object.entries(externalEmbedLabels).map(([key, label]) => (
          <PrefSelector
            name={key as ExternalEmbedType}
            label={label}
            key={key}
          />
        ))}
      </ScrollView>
    </CenteredView>
  )
}

function PrefSelector({
  name,
  label,
}: {
  name:
    | 'giphy'
    | 'tenor'
    | 'youtube'
    | 'twitch'
    | 'vimeo'
    | 'spotify'
    | 'appleMusic'
    | 'soundcloud'
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
          isSelected={sources[name] === 'show'}
          onPress={() =>
            setExternalEmbedPref(
              name,
              sources[name] === 'show' ? 'hide' : 'show',
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
    paddingBottom: 6,
  },
  desktopContainer: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
  },
  spacer: {
    height: 8,
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginBottom: 1,
  },
  infoCard: {
    marginBottom: 1,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 30,
    marginRight: 12,
  },
  selectableBtns: {
    flexDirection: 'row',
  },
  toggleCard: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 1,
  },
})
