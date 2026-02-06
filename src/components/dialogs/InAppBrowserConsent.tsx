import {useCallback} from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {useSetInAppBrowser} from '#/state/preferences/in-app-browser'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {SquareArrowTopRight_Stroke2_Corner0_Rounded as External} from '#/components/icons/SquareArrowTopRight'
import {Text} from '#/components/Typography'
import {IS_WEB} from '#/env'
import {useGlobalDialogsControlContext} from './Context'

export function InAppBrowserConsentDialog() {
  const {inAppBrowserConsentControl} = useGlobalDialogsControlContext()

  if (IS_WEB) return null

  return (
    <Dialog.Outer
      control={inAppBrowserConsentControl.control}
      nativeOptions={{preventExpansion: true}}
      onClose={inAppBrowserConsentControl.clear}>
      <Dialog.Handle />
      <InAppBrowserConsentInner href={inAppBrowserConsentControl.value} />
    </Dialog.Outer>
  )
}

function InAppBrowserConsentInner({href}: {href?: string}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const setInAppBrowser = useSetInAppBrowser()
  const openLink = useOpenLink()

  const onUseIAB = useCallback(() => {
    control.close(() => {
      setInAppBrowser(true)
      if (href) {
        openLink(href, true)
      }
    })
  }, [control, setInAppBrowser, href, openLink])

  const onUseLinking = useCallback(() => {
    control.close(() => {
      setInAppBrowser(false)
      if (href) {
        openLink(href, false)
      }
    })
  }, [control, setInAppBrowser, href, openLink])

  const onCancel = useCallback(() => {
    control.close()
  }, [control])

  return (
    <Dialog.ScrollableInner label={_(msg`How should we open this link?`)}>
      <View style={[a.gap_2xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_bold, a.text_2xl]}>
            <Trans>How should we open this link?</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_high, a.leading_snug, a.text_md]}>
            <Trans>
              Your choice will be remembered for future links. You can change it
              at any time in settings.
            </Trans>
          </Text>
        </View>
        <View style={[a.gap_sm]}>
          <Button
            label={_(msg`Use in-app browser`)}
            onPress={onUseIAB}
            size="large"
            variant="solid"
            color="primary">
            <ButtonText>
              <Trans>Use in-app browser</Trans>
            </ButtonText>
          </Button>
          <Button
            label={_(msg`Use my default browser`)}
            onPress={onUseLinking}
            size="large"
            variant="solid"
            color="secondary">
            <ButtonText>
              <Trans>Use my default browser</Trans>
            </ButtonText>
            <ButtonIcon position="right" icon={External} />
          </Button>
          <Button
            label={_(msg`Cancel`)}
            onPress={onCancel}
            size="large"
            variant="ghost"
            color="secondary">
            <ButtonText>
              <Trans>Cancel</Trans>
            </ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
