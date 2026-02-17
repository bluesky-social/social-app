import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {
  type EmbedPlayerSource,
  embedPlayerSources,
  externalEmbedLabels,
} from '#/lib/strings/embed-player'
import {useSetExternalEmbedPref} from '#/state/preferences'
import {atoms as a, web} from '#/alf'
import {Admonition} from '#/components/Admonition'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function EmbedConsentDialog({
  control,
  source,
  onAccept,
}: {
  control: Dialog.DialogControlProps
  source: EmbedPlayerSource
  onAccept: () => void
}) {
  const {_} = useLingui()
  const setExternalEmbedPref = useSetExternalEmbedPref()

  const onShowAllPress = useCallback(() => {
    for (const key of embedPlayerSources) {
      setExternalEmbedPref(key, 'show')
    }
    onAccept()
    control.close()
  }, [control, onAccept, setExternalEmbedPref])

  const onShowPress = useCallback(() => {
    setExternalEmbedPref(source, 'show')
    onAccept()
    control.close()
  }, [control, onAccept, setExternalEmbedPref, source])

  const onHidePress = useCallback(() => {
    setExternalEmbedPref(source, 'hide')
    control.close()
  }, [control, setExternalEmbedPref, source])

  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={_(msg`External Media`)}
        style={web({maxWidth: 400})}>
        <View style={a.gap_sm}>
          <Text style={[a.text_2xl, a.font_bold]}>
            <Trans>External Media</Trans>
          </Text>

          <View style={[a.mt_sm, a.mb_2xl, a.gap_lg]}>
            <Text style={[a.text_md, a.leading_snug]}>
              <Trans>
                This content is hosted by {externalEmbedLabels[source]}. Do you
                want to enable external media?
              </Trans>
            </Text>

            <Admonition type="info">
              <Trans>
                External media may allow websites to collect information about
                you and your device. No information is sent or requested until
                you press the "play" button.
              </Trans>
            </Admonition>
          </View>
        </View>
        <View style={a.gap_md}>
          <Button
            label={_(msg`Enable external media`)}
            onPress={onShowAllPress}
            onAccessibilityEscape={control.close}
            color="primary"
            size="large">
            <ButtonText>
              <Trans>Enable external media</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Enable this source only`)}
            onPress={onShowPress}
            onAccessibilityEscape={control.close}
            color="secondary"
            size="large">
            <ButtonText>
              <Trans>Enable {externalEmbedLabels[source]} only</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`No thanks`)}
            onAccessibilityEscape={control.close}
            onPress={onHidePress}
            color="secondary"
            size="large"
            variant="ghost">
            <ButtonText>
              <Trans>No thanks</Trans>
            </ButtonText>
          </Button>
        </View>
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}
