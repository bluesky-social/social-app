import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme} from '#/alf'
import {createStaticClick, SimpleInlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'

/**
 * Explains what sharing on-device age signals reveals, shown alongside the
 * "Share age range" button on the age assurance surfaces (the no-access screen
 * and the account settings card).
 *
 * Platform-split so the copy can name the OS account the age range comes from
 * (Apple Account vs Google Account) and reassure users that only a range is
 * shared. Device signals are only supported on iOS and Android, so these are
 * the only two cases.
 */
export function DeviceSignalsNotice({onPressKws}: {onPressKws: () => void}) {
  const t = useTheme()
  const {t: l} = useLingui()

  return (
    <Text style={[a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
      {IS_IOS ? (
        <Trans comment="Shown next to the 'Share age range' button when on-device age verification is available. KWS is the name of a third-party verification partner.">
          Sharing your age range reveals only the range associated with your
          Apple Account – for example, that you’re at least 18.{' '}
          <Text style={[a.text_sm, a.font_bold]}>
            Your exact age and birthday are never shared,
          </Text>{' '}
          and this data never leaves this device. Therefore, it only enables
          access on this device. Alternatively,{' '}
          <SimpleInlineLinkText
            label={l`Verify now using KWS`}
            {...createStaticClick(() => {
              onPressKws()
            })}>
            you can use our trusted partner, KWS
          </SimpleInlineLinkText>
          , to complete your verification and enable access on all platforms.
        </Trans>
      ) : (
        <Trans comment="Shown next to the 'Share age range' button when on-device age verification is available. KWS is the name of a third-party verification partner.">
          Sharing your age range reveals only the range associated with your
          Google Account – for example, that you’re at least 18.{' '}
          <Text style={[a.text_sm, a.font_bold]}>
            Your exact age and birthday are never shared,
          </Text>{' '}
          and this data never leaves this device. Therefore, it only enables
          access on this device. Alternatively,{' '}
          <SimpleInlineLinkText
            label={l`Verify now using KWS`}
            {...createStaticClick(() => {
              onPressKws()
            })}>
            you can use our trusted partner, KWS
          </SimpleInlineLinkText>
          , to complete your verification and enable access on all platforms.
        </Trans>
      )}
    </Text>
  )
}
