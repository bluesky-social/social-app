import React from 'react'
import {StyleSheet, TouchableOpacity, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import {s, colors, gradients} from 'lib/styles'
import {Text} from '../util/text/Text'
import {usePalette} from 'lib/hooks/usePalette'
import {Trans} from '@lingui/macro'
import {useModalControls} from '#/state/modals'
import {
  ExternalEmbedType,
  externalEmbedLabels,
  useSetExternalEmbedPref,
} from 'state/preferences/external-embeds-prefs.tsx'

export const snapPoints = [500]

export function Component({
  onAccept,
  source,
}: {
  onAccept: () => void
  source: ExternalEmbedType
}) {
  const pal = usePalette('default')
  const {closeModal} = useModalControls()
  const setExternalEmbedPref = useSetExternalEmbedPref()

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
    <View testID="repostModal" style={[s.flex1, pal.view, styles.container]}>
      <Text style={[pal.text, styles.title]}>
        <Trans>{externalEmbedLabels[source]} Embeds</Trans>
      </Text>

      <Text style={pal.text}>
        <Trans>
          Some posts on Bluesky may include media embeds from an external
          source. Embeds may allow the external source to collect information
          about you and your device. You may choose to remove these embeds by
          source.
        </Trans>
      </Text>
      <Text style={[pal.textLight, {fontWeight: '500', marginTop: 15}]}>
        <Trans>
          Note: Embeds are not loaded until you choose to load an embed. No
          information is sent to or requested from the external source until you
          load the embed.
        </Trans>
      </Text>
      <View style={[s.mt20]} />
      <TouchableOpacity
        testID="cancelBtn"
        onPress={onHidePress}
        accessibilityRole="button"
        accessibilityLabel={`Never load media from ${externalEmbedLabels[source]}`}
        accessibilityHint=""
        onAccessibilityEscape={closeModal}>
        <View style={[styles.btn, pal.btn]}>
          <Text style={[pal.text, s.bold, s.f18]}>
            <Trans>Hide {externalEmbedLabels[source]} embeds</Trans>
          </Text>
        </View>
      </TouchableOpacity>
      <View style={[s.mt20]} />
      <TouchableOpacity
        testID="cancelBtn"
        onPress={onShowPress}
        accessibilityRole="button"
        accessibilityLabel={`Show ${externalEmbedLabels[source]} embeds`}
        accessibilityHint=""
        onAccessibilityEscape={closeModal}>
        <LinearGradient
          colors={[gradients.blueLight.start, gradients.blueLight.end]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={[styles.btn]}>
          <Text style={[s.white, s.bold, s.f18]}>
            <Trans>Show {externalEmbedLabels[source]} embeds</Trans>
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
  },
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
