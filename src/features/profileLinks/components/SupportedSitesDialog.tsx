import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {atoms as a, useTheme, web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'
import {SUPPORT_PROVIDERS} from '../providers'
import {ProviderLogo} from './ProviderLogo'

/**
 * Lists the sites whose links get the green support button. Built from
 * `SUPPORT_PROVIDERS`, so it always matches what the app recognizes.
 */
export function SupportedSitesDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <SupportedSitesInner />
    </Dialog.Outer>
  )
}

function SupportedSitesInner() {
  const {t: l, i18n} = useLingui()
  const t = useTheme()
  // a provider can be listed once per domain, e.g. Stripe
  const providers = SUPPORT_PROVIDERS.filter(
    (provider, i) =>
      SUPPORT_PROVIDERS.findIndex(other => other.name === provider.name) === i,
  ).sort((x, y) => x.name.localeCompare(y.name, i18n.locale))

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 400})}
      label={l`Supported sites`}>
      <View style={[a.gap_sm, a.pb_lg]}>
        <Text style={[a.text_2xl, a.font_bold, a.leading_tight]}>
          <Trans>Supported sites</Trans>
        </Text>
        <Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
          <Trans>Links to these sites show as a green support button.</Trans>
        </Text>
      </View>
      <View>
        {providers.map((provider, i) => (
          <View
            key={provider.name}
            style={[
              a.flex_row,
              a.align_center,
              a.gap_md,
              a.py_md,
              i > 0 && a.border_t,
              t.atoms.border_contrast_low,
            ]}>
            <ProviderLogo
              provider={provider}
              size="lg"
              style={t.atoms.text_contrast_high}
            />
            <Text style={[a.text_md]}>{provider.name}</Text>
          </View>
        ))}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
