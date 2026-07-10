import {Image} from 'expo-image'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'
import {Trans} from '@lingui/react/macro'

import {type BluvyDeclaration} from '#/state/queries/bluvy'
import {atoms as a, useTheme} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {CustomLinkWarningDialog} from '#/components/dialogs/LinkWarning'
import {ArrowTopRight_Stroke2_Corner0_Rounded as ArrowTopRightIcon} from '#/components/icons/Arrow'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'
import {useAnalytics} from '#/analytics'
import type * as bsky from '#/types/bsky'

export function BluvyButton({
  declaration,
  profile,
}: {
  declaration: BluvyDeclaration
  profile: bsky.profile.AnyProfileView
}) {
  const t = useTheme()
  const ax = useAnalytics()
  const {_} = useLingui()
  const linkWarningControl = Dialog.useDialogControl()

  const {showButtonTo, messageMeUrl} = declaration.messageMe

  // exclude `nothing` and all unknown values
  if (showButtonTo !== 'everyone' && showButtonTo !== 'mutual') {
    return null
  }

  if (
    showButtonTo === 'mutual' &&
    !(profile.viewer?.following && profile.viewer?.followedBy)
  ) {
    return null
  }

  let url: string
  try {
    const urlp = new URL(messageMeUrl)
    // some declarations omit the did hash (e.g. a bare "https://bluvy.app/message")
    // -> point it at this profile
    if (!urlp.hash) {
      urlp.hash = profile.did
    }
    url = urlp.toString()
  } catch {
    return null
  }

  return (
    <>
      <Link
        to={url}
        onPress={evt => {
          ax.metric('profile:associated:bluvy:click-to-chat', {})
          evt.preventDefault()
          linkWarningControl.open()
          return false
        }}
        label={_(msg`Open Bluvy DM`)}
        overridePresentation={false}
        shouldProxy={false}
        style={[
          t.atoms.bg_contrast_50,
          a.rounded_full,
          a.self_start,
          {padding: 6},
        ]}>
        <BluvyLogo />
        <Text style={[a.text_sm, a.font_medium, a.ml_xs]}>
          <Trans>Bluvy DM</Trans>
        </Text>
        <ArrowTopRightIcon style={[t.atoms.text, a.mx_2xs]} width={14} />
      </Link>
      <CustomLinkWarningDialog
        control={linkWarningControl}
        link={{
          href: url,
          displayText: '',
          share: false,
        }}
      />
    </>
  )
}

function BluvyLogo() {
  return (
    <Image
      source={require('../../../../assets/images/bluvy_logo.webp')}
      accessibilityIgnoresInvertColors={false}
      contentFit="cover"
      useAppleWebpCodec
      style={[a.rounded_full, {width: 16, height: 16}]}
    />
  )
}
