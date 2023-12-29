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
import {useExternalSources, useSetExternalSource} from 'state/preferences'
import {SelectableBtn} from 'view/com/util/forms/SelectableBtn.tsx'

type Props = NativeStackScreenProps<CommonNavigatorParams, 'ExternalSources'>
export function ExternalSources({}: Props) {
  const pal = usePalette('default')
  const {_} = useLingui()
  const setMinimalShellMode = useSetMinimalShellMode()
  const {screen} = useAnalytics()
  const {isTabletOrDesktop} = useWebMediaQueries()

  useFocusEffect(
    React.useCallback(() => {
      screen('ExternalSources')
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
      testID="externalSourcesScreen">
      <ViewHeader title={_(msg`External Sources`)} showOnDesktop />
      <ScrollView>
        <View style={styles.spacer} />
        <View style={[pal.view]}>
          <View style={styles.infoCard}>
            <Text style={pal.text}>
              <Trans>
                Some posts on Bluesky may include media from an external source
                which you may choose to load. If you allow this media, your IP
                may be shown to the external source.
              </Trans>
            </Text>
          </View>
        </View>
        <ExternalSourceSelector name="youtube" label="YouTube" />
        <ExternalSourceSelector name="vimeo" label="Vimeo" />
        <ExternalSourceSelector name="twitch" label="Twitch" />
        <ExternalSourceSelector name="giphy" label="GIPHY" />
        <ExternalSourceSelector name="tenor" label="Tenor" />
        <ExternalSourceSelector name="spotify" label="Spotify" />
        <ExternalSourceSelector name="appleMusic" label="Apple Music" />
        <ExternalSourceSelector name="soundcloud" label="SoundCloud" />
      </ScrollView>
    </CenteredView>
  )
}

function ExternalSourceSelector({
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
  const setExternalSource = useSetExternalSource()
  const sources = useExternalSources()

  return (
    <View>
      <View style={styles.spacer} />
      <Text type="xl-bold" style={[pal.text, styles.heading]}>
        <Trans>{label}</Trans>
      </Text>
      <View style={[styles.linkCard, pal.view, styles.selectableBtns]}>
        <SelectableBtn
          selected={sources[name] === 'never'}
          label="Never"
          left
          onSelect={() => setExternalSource(name, 'never')}
          accessibilityHint={`Set ${label} to never load`}
        />
        <SelectableBtn
          selected={sources[name] === 'ask'}
          label="Ask"
          onSelect={() => setExternalSource(name, 'ask')}
          accessibilityHint={`Set ${label} to ask before loading`}
        />
        <SelectableBtn
          selected={sources[name] === 'always'}
          label="Always"
          right
          onSelect={() => setExternalSource(name, 'always')}
          accessibilityHint={`Set ${label} to always load`}
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
})
