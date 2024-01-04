import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {ScrollView} from './util'
import {usePalette} from 'lib/hooks/usePalette'
import {
  EmbedPlayerSource,
  embedPlayerSources,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useModalControls} from '#/state/modals'
import {useSetExternalEmbedPref} from '#/state/preferences/external-embeds-prefs'
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

export const snapPoints = [450]

export function Component({
  onAccept,
  source,
}: {
  onAccept: () => void
  source: EmbedPlayerSource
}) {
  const pal = usePalette('default')
  const {closeModal} = useModalControls()
  const {_} = useLingui()
  const setExternalEmbedPref = useSetExternalEmbedPref()
  const {isMobile} = useWebMediaQueries()

  const onShowAllPress = React.useCallback(() => {
    for (const key of embedPlayerSources) {
      setExternalEmbedPref(key, 'show')
    }
    onAccept()
    closeModal()
  }, [closeModal, onAccept, setExternalEmbedPref])

  const onShowPress = React.useCallback(() => {
    setExternalEmbedPref(source, 'show')
    onAccept()
    closeModal()
  }, [closeModal, onAccept, setExternalEmbedPref, source])

  const onHidePress = React.useCallback(() => {
    setExternalEmbedPref(source, 'hide')
    closeModal()
  }, [closeModal, setExternalEmbedPref, source])

  return (
    <ScrollView
      testID="embedConsentModal"
      style={[
        s.flex1,
        pal.view,
        isMobile
          ? {paddingHorizontal: 20, paddingTop: 10}
          : {paddingHorizontal: 30},
      ]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>External Media</Trans>
      </Text>

      <Text style={pal.text}>
        <Trans>
          This content is hosted by {externalEmbedLabels[source]}. Do you want
          to enable external media?
        </Trans>
      </Text>
      <View style={[s.mt10]} />
      <Text style={pal.textLight}>
        <Trans>
          External media may allow websites to collect information about you and
          your device. No information is sent or requested until you press the
          "play" button.
        </Trans>
      </Text>
      <View style={[s.mt20]} />
      <TouchableOpacity
        testID="enableAllBtn"
        onPress={onShowAllPress}
        accessibilityRole="button"
        accessibilityLabel={_(
          msg`Show embeds from ${externalEmbedLabels[source]}`,
        )}
        accessibilityHint=""
        onAccessibilityEscape={closeModal}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans>Enable External Media</Trans>
          </Text>
        </LinearGradient>
      </TouchableOpacity>
      <View style={[s.mt10]} />
      <TouchableOpacity
        testID="enableSourceBtn"
        onPress={onShowPress}
        accessibilityRole="button"
        accessibilityLabel={_(
          msg`Never load embeds from ${externalEmbedLabels[source]}`,
        )}
        accessibilityHint=""
        onAccessibilityEscape={closeModal}>
        <View style={[styles.btn, pal.btn]}>
          <Text style={[pal.text, s.bold, s.f18]}>
            <Trans>Enable {externalEmbedLabels[source]} only</Trans>
          </Text>
        </View>
      </TouchableOpacity>
      <View style={[s.mt10]} />
      <TouchableOpacity
        testID="disableSourceBtn"
        onPress={onHidePress}
        accessibilityRole="button"
        accessibilityLabel={_(
          msg`Never load embeds from ${externalEmbedLabels[source]}`,
        )}
        accessibilityHint=""
        onAccessibilityEscape={closeModal}>
        <View style={[styles.btn, pal.btn]}>
          <Text style={[pal.text, s.bold, s.f18]}>
            <Trans>No thanks</Trans>
          </Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 24,
    marginBottom: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderRadius: 32,
    padding: 14,
    backgroundColor: colors.gray1,
  },
})
