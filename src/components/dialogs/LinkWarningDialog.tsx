import React from 'react'
import {View} from 'react-native'
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

import {useOpenLink} from '#/lib/hooks/useOpenLink'
import {shareUrl} from '#/lib/sharing'
import {isPossiblyAUrl, splitApexDomain} from '#/lib/strings/url-helpers'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import {Text} from '#/components/Typography'

export function LinkWarningDialog({
  control,
  linkText,
  linkHref,
  mode = 'open',
}: {
  control: Dialog.DialogControlProps
  linkText: string
  linkHref: string
  mode?: 'open' | 'share'
}) {
  return (
    <Dialog.Outer control={control}>
      <Dialog.Handle />
      <DialogInner linkHref={linkHref} linkText={linkText} mode={mode} />
    </Dialog.Outer>
  )
}

function DialogInner({
  linkText,
  linkHref,
  mode,
}: {
  linkText: string
  linkHref: string
  mode: 'open' | 'share'
}) {
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const potentiallyMisleading = isPossiblyAUrl(linkText)
  const openLink = useOpenLink()

  const share = mode === 'share'

  const onPressVisit = () => {
    control.close(() => {
      if (share) {
        shareUrl(linkHref)
      } else {
        openLink(linkHref)
      }
    })
  }
  return (
    <Dialog.Inner label={''}>
      <View style={[]}>
        {potentiallyMisleading ? (
          <>
            {/* <FontAwesomeIcon
          icon="circle-exclamation"
          color={pal.colors.text}
          size={18}
        /> */}
            <Text style={[]}>
              <Trans>Potentially Misleading Link</Trans>
            </Text>
          </>
        ) : (
          <Text style={[]}>
            <Trans>Leaving Bluesky</Trans>
          </Text>
        )}
      </View>

      <View style={{gap: 10}}>
        <Text>
          <Trans>This link is taking you to the following website:</Trans>
        </Text>

        <LinkBox href={linkHref} />

        {potentiallyMisleading && (
          <Text>
            <Trans>Make sure this is where you intend to go!</Trans>
          </Text>
        )}
      </View>

      <View style={[]}>
        <Button
          label={share ? _(msg`Share Link`) : _(msg`Visit Site`)}
          onPress={onPressVisit}
          color="primary"
          size="large"
          variant="solid"
          style={a.mt_xl}>
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
        <Button
          label={_(msg`Cancel`)}
          onPress={() => control.close()}
          color="secondary"
          size="large"
          variant="solid">
          <ButtonText>
            <Trans>Done</Trans>
          </ButtonText>
        </Button>
      </View>
    </Dialog.Inner>
  )
}

function LinkBox({href}: {href: string}) {
  const t = useTheme()
  const [scheme, hostname, rest] = React.useMemo(() => {
    try {
      const urlp = new URL(href)
      const [subdomain, apexdomain] = splitApexDomain(urlp.hostname)
      return [
        urlp.protocol + '//' + subdomain,
        apexdomain,
        urlp.pathname + urlp.search + urlp.hash,
      ]
    } catch {
      return ['', href, '']
    }
  }, [href])
  return (
    <View
      style={[
        t.atoms.bg,
        t.atoms.border_contrast_medium,
        a.border,
        a.rounded_sm,
        a.px_md,
        a.py_sm,
      ]}>
      <Text style={[t.atoms.text_contrast_high]}>
        {scheme}
        <Text style={[t.atoms.text, a.font_bold]}>{hostname}</Text>
        {rest}
      </Text>
    </View>
  )
}
